import { parseRecipeFromHtml, buildRecipeFromSchema, stripHtmlToText } from "@/lib/parseJsonLd";

const ALLOWED_PROTOCOLS = ["http:", "https:"];

async function fetchImageAsBase64(imageUrl: string | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

async function extractWithClaude(
  pageText: string,
  sourceUrl: string,
  id: string,
  apiKey: string,
) {
  const prompt = `Extract the recipe from the following webpage text and return ONLY a valid JSON object with these exact fields (use null for missing values):

{
  "name": "recipe title",
  "description": "1-2 sentence description",
  "author": "author name or site name",
  "prepTime": "ISO 8601 duration e.g. PT15M",
  "cookTime": "ISO 8601 duration e.g. PT30M",
  "totalTime": "ISO 8601 duration",
  "recipeYield": "number of servings as integer",
  "recipeIngredient": ["ingredient string with quantity and unit", ...],
  "recipeInstructions": ["step 1 text", "step 2 text", ...],
  "recipeCuisine": "cuisine type",
  "recipeCategory": "meal type e.g. Dinner, Breakfast, Dessert",
  "image": "image URL if found",
  "suitableForDiet": ["VegetarianDiet", "VeganDiet", etc — only if clearly stated]
}

Return ONLY the JSON object, no explanation, no markdown fences.

Webpage text (truncated):
${pageText.slice(0, 40_000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text = data?.content?.[0]?.text as string | undefined;
  if (!text) return null;

  try {
    const schema = JSON.parse(text.trim());
    return buildRecipeFromSchema(schema, sourceUrl, id);
  } catch {
    // Claude may have wrapped in markdown — try extracting JSON block
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return null;
    try {
      const schema = JSON.parse(jsonMatch[0]);
      return buildRecipeFromSchema(schema, sourceUrl, id);
    } catch { return null; }
  }
}

async function estimateNutrition(
  recipe: { title: string; servings: number; ingredients: { quantity: number; unit: string; name: string }[] },
  apiKey: string,
): Promise<{ calories?: number; protein?: number; fat?: number; carbs?: number; fiber?: number }> {
  const ingredientList = recipe.ingredients
    .map(i => `${i.quantity > 0 ? i.quantity : ""} ${i.unit} ${i.name}`.trim())
    .join(", ");

  const prompt = `Estimate nutrition per serving for this recipe.
Title: ${recipe.title}
Servings: ${recipe.servings}
Ingredients: ${ingredientList}

Return ONLY a JSON object with integer values per serving: {"calories": number, "protein": number, "fat": number, "carbs": number, "fiber": number}`;

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
        max_tokens: 128,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const text = (data?.content?.[0]?.text as string | undefined) ?? "";
    const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
    const json = JSON.parse(raw);
    const num = (k: string) => (typeof json[k] === "number" && json[k] > 0 ? Math.round(json[k]) : undefined);
    return { calories: num("calories"), protein: num("protein"), fat: num("fat"), carbs: num("carbs"), fiber: num("fiber") };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  let parsed: URL;
  try { parsed = new URL(url); }
  catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return Response.json({ error: "Only HTTP/HTTPS URLs are supported" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) throw new Error("Not an HTML page");
    html = await res.text();
  } catch (err) {
    return Response.json(
      { error: `Could not fetch page: ${err instanceof Error ? err.message : "Network error"}` },
      { status: 422 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  function needsNutrition(r: { calories?: number; protein?: number }) {
    return !r.calories && !r.protein;
  }

  async function finalise(recipe: ReturnType<typeof parseRecipeFromHtml> & object) {
    const [heroImageBase64, nutrition] = await Promise.all([
      fetchImageAsBase64((recipe as { heroImageUrl?: string }).heroImageUrl),
      apiKey && needsNutrition(recipe as { calories?: number; protein?: number })
        ? estimateNutrition(recipe as Parameters<typeof estimateNutrition>[0], apiKey)
        : Promise.resolve({}),
    ]);
    const enriched = { ...recipe, ...nutrition };
    return Response.json({ recipe: enriched, ...(heroImageBase64 ? { heroImageBase64 } : {}) });
  }

  // Try JSON-LD first
  const jsonLdRecipe = parseRecipeFromHtml(html, url, id);
  if (jsonLdRecipe) return finalise(jsonLdRecipe);

  // Claude fallback — only if API key is configured
  if (apiKey) {
    try {
      const pageText = stripHtmlToText(html);
      if (!pageText.toLowerCase().includes("ingredient")) {
        return Response.json({ error: "This page doesn't appear to contain a recipe." }, { status: 422 });
      }
      const claudeRecipe = await extractWithClaude(pageText, url, id, apiKey);
      if (claudeRecipe) return finalise(claudeRecipe);
    } catch {}
  }

  return Response.json(
    { error: "No recipe data found on this page. Try a URL from a dedicated recipe site." },
    { status: 422 }
  );
}
