import type { CookingStep, DietaryTag } from "@/types/recipe";

const TYPE_TAGS = ["soup", "pasta", "bake", "salad", "freezable"] as const;

const API_BASE = "https://api.anthropic.com/v1/messages";
const HEADERS = (key: string) => ({
  "x-api-key": key,
  "anthropic-version": "2023-06-01",
  "content-type": "application/json",
});

export async function estimateTimeSplit(
  recipe: { title: string; steps: { instruction: string }[] },
  totalTimeMinutes: number,
  apiKey: string,
): Promise<{ prepTimeMinutes: number; cookTimeMinutes: number } | null> {
  const prompt = `Recipe: "${recipe.title}" — total time ${totalTimeMinutes} min, ${recipe.steps.length} steps.
Estimate prep time vs cook/bake time. Return ONLY JSON: {"prepTimeMinutes": number, "cookTimeMinutes": number}
Both must sum close to ${totalTimeMinutes}. Use multiples of 5.`;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: HEADERS(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 50,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data?.content?.[0]?.text as string | undefined) ?? "";
    const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
    const json = JSON.parse(raw);
    const prep = typeof json.prepTimeMinutes === "number" ? Math.round(json.prepTimeMinutes) : null;
    const cook = typeof json.cookTimeMinutes === "number" ? Math.round(json.cookTimeMinutes) : null;
    if (prep !== null && cook !== null && prep >= 0 && cook >= 0) {
      return { prepTimeMinutes: prep, cookTimeMinutes: cook };
    }
    return null;
  } catch {
    return null;
  }
}

export async function estimateNutrition(
  recipe: { title: string; servings: number; ingredients: { quantity: number; unit: string; name: string }[] },
  apiKey: string,
): Promise<{ calories?: number; protein?: number; fat?: number; carbs?: number; fiber?: number; sugar?: number; sodium?: number; saturatedFat?: number; cholesterol?: number; transFat?: number }> {
  const ingredientList = recipe.ingredients
    .map(i => `${i.quantity > 0 ? i.quantity : ""} ${i.unit} ${i.name}`.trim())
    .join(", ");

  const prompt = `Estimate nutrition per serving for this recipe.
Title: ${recipe.title}
Servings: ${recipe.servings}
Ingredients: ${ingredientList}

Return ONLY a JSON object with numeric values per serving (integers except transFat which can be a decimal):
{"calories": number, "protein": number, "fat": number, "carbs": number, "fiber": number, "sugar": number, "sodium": number, "saturatedFat": number, "cholesterol": number, "transFat": number}
Use 0 for transFat if negligible. sodium is in mg, cholesterol is in mg, all others in g except calories in kcal.`;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: HEADERS(apiKey),
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
    const dec = (k: string) => (typeof json[k] === "number" && json[k] > 0 ? Math.round(json[k] * 10) / 10 : undefined);
    return {
      calories: num("calories"), protein: num("protein"), fat: num("fat"),
      carbs: num("carbs"), fiber: num("fiber"), sugar: num("sugar"),
      sodium: num("sodium"), saturatedFat: num("saturatedFat"),
      cholesterol: num("cholesterol"), transFat: dec("transFat"),
    };
  } catch {
    return {};
  }
}

// Sentinel: distinguishes "Claude found no TM steps" (null) from API/parse error (throws).
export async function generateThermomixSteps(
  steps: CookingStep[],
  apiKey: string,
  { timeoutMs = 20_000 }: { timeoutMs?: number } = {},
): Promise<CookingStep[] | null> {
  if (steps.length === 0) return null;

  const stepLines = steps.map((s, i) => `${i + 1}. ${s.instruction}`).join("\n");

  const prompt = `You are adapting a recipe for the Thermomix TM6. For each numbered step below, provide Thermomix parameters if the step involves any mechanical or thermal operation: mixing, blending, chopping, cooking, steaming, sautéing, emulsifying, kneading. Skip ONLY steps that are purely manual with no machine equivalent: plating, resting, marinating, chilling, seasoning to taste, serving.

If a step already describes a Thermomix operation (e.g. "Blend 10 sec/speed 7" or "Cook 5 min/100°C/speed 1"), extract the parameters directly from the text — do not skip it.

Steps:
${stepLines}

Return ONLY a JSON array for steps that CAN use the Thermomix:
[
  {
    "stepNumber": 1,
    "speed": 0,
    "tempC": 0,
    "timeSeconds": 0,
    "instruction": "Thermomix-specific instruction",
    "label": "one word e.g. Blend/Simmer/Steam/Chop/Sauté"
  }
]

Speed guide: 0=no mixing (heat only), 1=gentle stir, 3=mix, 5=blend, 7=chop, 10=crush.
tempC guide: 0=no heat, 37-100=cooking, "Varoma"=steaming (~115°C).
timeSeconds: extract from text (e.g. "5 sec" → 5, "2 min" → 120). Use 30 if unspecified but the step clearly uses the machine.
Return [] only if truly no steps involve the Thermomix.`;

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const data = await res.json();
  const text = (data?.content?.[0]?.text as string | undefined) ?? "";
  const raw = text.match(/\[[\s\S]*\]/)?.[0] ?? text.trim();
  const items = JSON.parse(raw) as { stepNumber: number; speed: number; tempC: number | "Varoma"; timeSeconds: number; instruction: string; label?: string }[];
  if (!Array.isArray(items) || items.length === 0) return null;

  const byIndex = new Map(items.map(t => [t.stepNumber - 1, t]));
  const updated = steps.map((s, i) => {
    const tm = byIndex.get(i);
    if (!tm) return s;
    return {
      ...s,
      thermomix: {
        speed: tm.speed,
        tempC: tm.tempC,
        timeSeconds: tm.timeSeconds,
        instruction: tm.instruction,
        label: tm.label,
      },
    };
  });
  if (!updated.some(s => s.thermomix)) return null;
  return updated;
}

export async function classifyRecipe(
  recipe: { title: string; description: string; tags: string[]; dietaryTags: DietaryTag[]; ingredients: { name: string }[]; cuisine?: string },
  apiKey: string,
  pageText?: string,
): Promise<{ typeTags: string[]; dietaryTags: DietaryTag[]; chefNotes?: string; cuisine?: string }> {
  const ingredientSample = recipe.ingredients.slice(0, 8).map(i => i.name).join(", ");
  const context = pageText ? `\n\nPage text excerpt:\n${pageText.slice(0, 2500)}` : "";
  const needsCuisine = !recipe.cuisine || recipe.cuisine === "any";

  const prompt = `Analyse this recipe and return a JSON object with four fields.

Recipe: "${recipe.title}"
Description: ${recipe.description}
Ingredients (sample): ${ingredientSample}${context}

1. "typeTags": array of applicable type tags from this list only — ["soup","pasta","bake","salad","freezable"]. Include a tag only if it clearly describes the dish. Use "freezable" only if the recipe explicitly says it freezes well. Can be empty.

2. "dietaryTags": array of applicable tags from ["vegetarian","vegan","gluten-free","dairy-free","pescatarian"]. Only include if clearly true based on ingredients.

3. "chefNotes": any chef tips, notes, variations, or serving suggestions found in the text. Concise prose (2–4 sentences). null if none.

4. "cuisine": ${needsCuisine ? 'the cuisine of this dish as a single lowercase word or short phrase (e.g. "italian", "mexican", "middle eastern", "british"). Infer from the dish name, ingredients, and context. Use "any" only if truly impossible to determine.' : 'null (cuisine already known)'}.

Return ONLY valid JSON: {"typeTags": [...], "dietaryTags": [...], "chefNotes": "..." or null, "cuisine": "..." or null}`;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: HEADERS(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { typeTags: [], dietaryTags: [] };
    const data = await res.json();
    const text = (data?.content?.[0]?.text as string | undefined) ?? "";
    const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
    const json = JSON.parse(raw);
    const typeTags = (json.typeTags as unknown[])?.filter((t): t is string => TYPE_TAGS.includes(t as never)) ?? [];
    const dietary = (json.dietaryTags as unknown[])?.filter((t): t is DietaryTag =>
      ["vegetarian","vegan","gluten-free","dairy-free","pescatarian"].includes(t as string)) ?? [];
    const chefNotes = typeof json.chefNotes === "string" && json.chefNotes.trim() ? json.chefNotes.trim() : undefined;
    const cuisine = needsCuisine && typeof json.cuisine === "string" && json.cuisine.trim() && json.cuisine !== "null"
      ? json.cuisine.trim().toLowerCase().slice(0, 25)
      : undefined;
    return { typeTags, dietaryTags: dietary, chefNotes, cuisine };
  } catch {
    return { typeTags: [], dietaryTags: [] };
  }
}
