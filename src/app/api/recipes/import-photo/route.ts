import { buildRecipeFromSchema } from "@/lib/parseJsonLd";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function extractFromPhoto(
  imageBase64: string,
  mimeType: string,
  id: string,
  apiKey: string,
) {
  const prompt = `Extract the recipe from this image and return ONLY a valid JSON object with these exact fields (use null for missing values):

{
  "name": "recipe title",
  "description": "1-2 sentence description",
  "author": null,
  "prepTime": "ISO 8601 duration e.g. PT15M",
  "cookTime": "ISO 8601 duration e.g. PT30M",
  "totalTime": "ISO 8601 duration",
  "recipeYield": "number of servings as integer",
  "recipeIngredient": ["ingredient string with quantity and unit", ...],
  "recipeInstructions": ["step 1 text", "step 2 text", ...],
  "recipeCuisine": "cuisine type",
  "recipeCategory": "meal type e.g. Dinner, Breakfast, Dessert",
  "image": null,
  "suitableForDiet": []
}

Return ONLY the JSON object, no explanation, no markdown fences.`;

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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text = data?.content?.[0]?.text as string | undefined;
  if (!text) return null;

  try {
    const schema = JSON.parse(text.trim());
    return buildRecipeFromSchema(schema, "", id);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return null;
    try {
      const schema = JSON.parse(jsonMatch[0]);
      return buildRecipeFromSchema(schema, "", id);
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI features are not configured on this server." }, { status: 503 });
  }

  let imageBase64: string;
  let mimeType: string;
  try {
    ({ imageBase64, mimeType } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return Response.json({ error: "imageBase64 is required" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(mimeType)) {
    return Response.json({ error: "Unsupported image format. Use JPEG, PNG, or WebP." }, { status: 400 });
  }

  const id = crypto.randomUUID();

  let recipe;
  try {
    recipe = await extractFromPhoto(imageBase64, mimeType, id, apiKey);
  } catch {
    return Response.json({ error: "AI extraction timed out. Try again." }, { status: 504 });
  }

  if (!recipe) {
    return Response.json(
      { error: "Could not extract a recipe from this image. Try a clearer photo of the recipe page." },
      { status: 422 }
    );
  }

  // Override sourceType to image and run nutrition in parallel
  const recipeWithSource = { ...recipe, sourceType: "image" as const };

  const nutrition = !recipeWithSource.calories && !recipeWithSource.protein
    ? await estimateNutrition(recipeWithSource as Parameters<typeof estimateNutrition>[0], apiKey)
    : {};

  return Response.json({
    recipe: { ...recipeWithSource, ...nutrition },
    heroImageBase64: `data:${mimeType};base64,${imageBase64}`,
  });
}
