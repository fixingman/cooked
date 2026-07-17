import { buildRecipeFromSchema } from "@/lib/parseJsonLd";
import { resolveRecipeImage } from "@/lib/imageUtils";

export const maxDuration = 30;

interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  cuisine?: string;
  mealTimes: string[];
  tags: string[];
  dietaryTags: string[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  let prompt: string;
  let recipes: RecipeSummary[];
  let pantryItems: string[] | undefined;
  let flavorHints: Record<string, string[]> | undefined;
  let forceGenerate: boolean | undefined;
  let conceptsOnly: boolean | undefined;
  try {
    ({ prompt, recipes, pantryItems, flavorHints, forceGenerate, conceptsOnly } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!prompt?.trim()) return Response.json({ error: "Prompt required" }, { status: 400 });

  // Fast concept picker — Haiku generates 4 recipe ideas to choose from before
  // committing to a full Sonnet generation.
  if (conceptsOnly) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{
            role: "user",
            content: `You are a recipe assistant. The user wants to cook: "${prompt.trim()}"

Generate 4 distinct recipe concepts. Make them genuinely different — vary the style, main ingredient, or technique.

Return ONLY valid JSON (no markdown fences):
{"mode":"concepts","concepts":[{"title":"...","description":"one sentence, 12 words max"},{"title":"...","description":"..."},{"title":"...","description":"..."},{"title":"...","description":"..."}]}`,
          }],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return Response.json({ error: "AI request failed" }, { status: 502 });
      const data = await res.json();
      const text = data?.content?.[0]?.text as string | undefined;
      if (!text) return Response.json({ error: "Empty AI response" }, { status: 502 });
      const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
      const json = JSON.parse(raw);
      if (json.mode === "concepts" && Array.isArray(json.concepts)) {
        return Response.json({ mode: "concepts", concepts: json.concepts });
      }
      return Response.json({ error: "Unexpected concepts format" }, { status: 422 });
    } catch {
      return Response.json({ error: "Request failed — try again." }, { status: 500 });
    }
  }

  const hasLibrary = recipes?.length > 0;
  const librarySection = hasLibrary
    ? `\n\nUser's recipe library (${recipes.length} recipes):\n${JSON.stringify(
        recipes.map(r => ({ id: r.id, title: r.title, description: r.description, cuisine: r.cuisine, mealTimes: r.mealTimes, tags: r.tags, dietaryTags: r.dietaryTags })),
        null, 2
      )}`
    : "\n\nThe user's recipe library is empty.";

  const pantrySection = pantryItems?.length
    ? `\n\nUser's pantry: ${pantryItems.join(", ")}.`
    : "";

  const flavorSection = flavorHints && Object.keys(flavorHints).length
    ? `\n\nFlavour-science pairings for their ingredients (use these to build the recipe):\n${
        Object.entries(flavorHints)
          .map(([ing, pairs]) => `• ${ing} pairs well with: ${pairs.join(", ")}`)
          .join("\n")
      }`
    : "";

  const claudePrompt = `You are a recipe assistant for a personal cookbook app.

User's request: "${prompt.trim()}"${librarySection}${pantrySection}${flavorSection}

${forceGenerate ? 'Always use "generate" mode — create a brand-new recipe.' : `Choose the response mode:
- "suggest": user is asking what to cook from their existing library (phrases like "what should I make", "what do I have", or a cuisine/ingredient already well-covered in their library)
- "generate": user wants something new, specific, or not well-covered in the library — prefer this when in doubt

For "suggest": return the top 1–3 most relevant recipe IDs with a concise 1-sentence reason each.
For "generate": return a complete new recipe.`}

Return ONLY valid JSON — no markdown fences, no explanation.

Suggest format:
{"mode":"suggest","results":[{"id":"...","reason":"..."}]}

Generate format:
{"mode":"generate","recipe":{"name":"...","description":"...","prepTime":"PT15M","cookTime":"PT30M","totalTime":"PT45M","recipeYield":4,"recipeIngredient":["200g pasta","..."],"recipeInstructions":["Step 1 text","Step 2 text"],"recipeCuisine":"italian","recipeCategory":"Dinner","image":null,"suitableForDiet":[],"typeTags":[],"chefNotes":"any tips or null"}}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: claudePrompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return Response.json({ error: "AI request failed" }, { status: 502 });

    const data = await res.json();
    const text = data?.content?.[0]?.text as string | undefined;
    if (!text) return Response.json({ error: "Empty AI response" }, { status: 502 });

    const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
    const json = JSON.parse(raw);

    if (json.mode === "suggest" && Array.isArray(json.results)) {
      return Response.json({ mode: "suggest", results: json.results });
    }

    if (json.mode === "generate" && json.recipe) {
      const id = crypto.randomUUID();
      const recipe = buildRecipeFromSchema(json.recipe, "", id);
      if (!recipe) return Response.json({ error: "Could not build recipe" }, { status: 422 });

      // Try to find a relevant image via Unsplash
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
      const imageResult = await resolveRecipeImage(undefined, recipe.title, recipe.cuisine ?? "any", unsplashKey).catch(() => null);
      const enrichedRecipe = {
        ...recipe,
        sourceType: "ai" as const,
        ...(imageResult?.url ? { heroImageUrl: imageResult.url, imageSource: imageResult.source, imageQuality: imageResult.quality } : {}),
      };

      return Response.json({ mode: "generate", recipe: enrichedRecipe });
    }

    return Response.json({ error: "Unexpected AI response format" }, { status: 422 });
  } catch {
    return Response.json({ error: "Request failed — try again." }, { status: 500 });
  }
}
