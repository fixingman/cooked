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
  try {
    ({ prompt, recipes, pantryItems, flavorHints } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!prompt?.trim()) return Response.json({ error: "Prompt required" }, { status: 400 });

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

Choose the response mode:
- "suggest": if the library has relevant matches (user asks what to cook, mentions an ingredient or cuisine that's in the library, wants recommendations)
- "generate": if the request is for something new/specific not in the library, the library is empty, or the user explicitly asks to create/make/invent a recipe

For "suggest": return the top 1–3 most relevant recipe IDs with a concise 1-sentence reason each.
For "generate": return a complete new recipe.

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
