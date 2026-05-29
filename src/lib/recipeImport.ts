import { buildRecipeFromSchema } from "@/lib/parseJsonLd";
import {
  estimateTimeSplit,
  classifyRecipe,
  translateRecipe,
  looksNonEnglish,
} from "@/lib/recipeEnrichment";
import { resolveRecipeImage } from "@/lib/imageUtils";
import type { Recipe, DietaryTag, MealTime } from "@/types/recipe";

export async function extractWithClaude(
  pageText: string,
  sourceUrl: string,
  id: string,
  apiKey: string,
): Promise<Recipe | null> {
  const prompt = `Extract a recipe from the text below and return ONLY a valid JSON object with these exact fields (use null for missing values).

The input may be a full recipe page, a structured recipe, or informal cooking notes (e.g. a bullet list of steps). In all cases:
- Infer a concise recipe title if none is explicitly given
- Extract all ingredients, including ones mentioned only within the instructions (e.g. "add 2 onions" → ingredient: "2 onions")
- Use metric units throughout: g for solids, ml for liquids, L for large volumes. Convert any imperial measures (cups → ml, oz → g, lb → g, tsp → ml, tbsp → ml). Keep "tsp" and "tbsp" as-is for small amounts under 15ml.
- Write clean step-by-step instructions
- Translate everything to English if the text is in another language

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
  "suitableForDiet": ["VegetarianDiet", "VeganDiet", etc — only if clearly stated],
  "typeTags": ["soup"|"pasta"|"bake"|"salad" — only tags that clearly apply, can be empty array],
  "chefNotes": "any chef tips, notes, variations or serving suggestions — concise prose, or null"
}

Return ONLY the JSON object, no explanation, no markdown fences.

Text:
${pageText.slice(0, 40_000)}`;

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
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text = data?.content?.[0]?.text as string | undefined;
  if (!text) return null;

  try {
    const schema = JSON.parse(text.trim());
    return buildRecipeFromSchema(schema, sourceUrl, id);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return null;
    try {
      const schema = JSON.parse(jsonMatch[0]);
      return buildRecipeFromSchema(schema, sourceUrl, id);
    } catch { return null; }
  }
}

export async function buildImportResponse(
  recipe: Recipe,
  pageText: string,
  opts: { apiKey: string | undefined; unsplashKey: string | undefined },
) {
  const r = recipe;
  const { apiKey, unsplashKey } = opts;

  const rawSourceImageUrl = r.heroImageUrl || null; // Capture before resolveRecipeImage may replace it
  const needsTimeSplit = r.prepTimeMinutes === 0 && r.cookTimeMinutes === 0 && r.totalTimeMinutes > 0;
  const needsTranslation = !!apiKey && looksNonEnglish(r);

  // Nutrition estimation is deferred to client-side post-save (like Thermomix enrichment).
  // JSON-LD nutrition is preserved if already present in the source.
  const [imageResult, classification, timeSplit, translation] = await Promise.all([
    resolveRecipeImage(r.heroImageUrl, r.title, r.cuisine, unsplashKey),
    apiKey
      ? classifyRecipe(r, apiKey, pageText)
      : Promise.resolve({
          typeTags: [] as string[],
          dietaryTags: [] as DietaryTag[],
          mealTimes: [] as MealTime[],
          chefNotes: undefined as string | undefined,
          cuisine: undefined as string | undefined,
          thermomixSuitable: true,
        }),
    apiKey && needsTimeSplit ? estimateTimeSplit(r, r.totalTimeMinutes, apiKey) : Promise.resolve(null),
    needsTranslation ? translateRecipe(r, apiKey!) : Promise.resolve(null),
  ]);

  const nutritionSource: "json-ld" | "none" = r.calories || r.protein ? "json-ld" : "none";

  const mergedTags = Array.from(new Set([...r.tags, ...classification.typeTags]));
  const mergedDietary = Array.from(new Set([...r.dietaryTags, ...classification.dietaryTags]));
  const aiMealTimes = classification.mealTimes ?? [];
  const mergedMealTimes = aiMealTimes.length > 0
    ? Array.from(new Set([
        ...r.mealTimes.filter(m => !(r.mealTimes.length === 1 && m === "dinner" && !aiMealTimes.includes("dinner"))),
        ...aiMealTimes,
      ]))
    : r.mealTimes;

  let heroImageBase64: string | null = null;
  if (imageResult.url) {
    try {
      const imgRes = await fetch(imageResult.url, { signal: AbortSignal.timeout(8_000) });
      if (imgRes.ok) {
        const ct = imgRes.headers.get("content-type") ?? "image/jpeg";
        if (ct.startsWith("image/")) {
          const buf = await imgRes.arrayBuffer();
          heroImageBase64 = `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
        }
      }
    } catch {}
  }

  const enriched: Recipe = {
    ...r,
    tags: mergedTags,
    dietaryTags: mergedDietary,
    mealTimes: mergedMealTimes,
    heroImageUrl: imageResult.url ?? r.heroImageUrl,
    imageSource: imageResult.source,
    imageQuality: imageResult.quality,
    ...(rawSourceImageUrl ? { heroImageSourceUrl: rawSourceImageUrl } : {}),
    ...(classification.chefNotes && !r.chefNotes ? { chefNotes: classification.chefNotes } : {}),
    ...(classification.cuisine && (!r.cuisine || r.cuisine === "any") ? { cuisine: classification.cuisine } : {}),
    ...(needsTimeSplit
      ? timeSplit
        ? { prepTimeMinutes: timeSplit.prepTimeMinutes, cookTimeMinutes: timeSplit.cookTimeMinutes }
        : { cookTimeMinutes: r.totalTimeMinutes }
      : {}),
    ...(translation ? {
      title: translation.title,
      description: translation.description,
      ingredients: r.ingredients.map((ing, i) => ({ ...ing, name: translation.ingredientNames[i] ?? ing.name })),
      steps: r.steps.map((step, i) => ({ ...step, instruction: translation.stepInstructions[i] ?? step.instruction })),
      ...(translation.chefNotes ? { chefNotes: translation.chefNotes } : {}),
    } : {}),
  };

  return {
    recipe: enriched,
    ...(heroImageBase64 ? { heroImageBase64 } : {}),
    enrichments: {
      nutritionSource,
      thermomix: false,
      thermomixSuitable: classification.thermomixSuitable,
    },
  };
}

export const RECIPE_SIGNAL_WORDS = [
  "ingredient", "ingredienser", "ingrediënten", "ingrédient",
  "zutat", "ingrediente", "oppskrift", "recept", "ricetta", "рецепт",
];
