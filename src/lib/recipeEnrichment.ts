import type { CookingStep, DietaryTag, MealTime } from "@/types/recipe";

const TYPE_TAGS = ["soup", "pasta", "bake", "salad", "freezable"] as const;

const API_BASE = "https://api.anthropic.com/v1/messages";
const HEADERS = (key: string) => ({
  "x-api-key": key,
  "anthropic-version": "2023-06-01",
  "content-type": "application/json",
});

// Detects non-English content by checking for diacritics common in European languages
// but rare in English. Free, instant — only fires the translation call when needed.
export function looksNonEnglish(recipe: { title: string; ingredients: { name: string }[] }): boolean {
  const sample = recipe.title + " " + recipe.ingredients.slice(0, 6).map(i => i.name).join(" ");
  return /[åäöéèêëàâùûôîïçüßñøæœ]/i.test(sample);
}

export async function translateRecipe(
  recipe: {
    title: string;
    description: string;
    ingredients: { name: string }[];
    steps: { instruction: string }[];
    chefNotes?: string;
  },
  apiKey: string,
): Promise<{
  title: string;
  description: string;
  ingredientNames: string[];
  stepInstructions: string[];
  chefNotes?: string;
} | null> {
  const payload = {
    title: recipe.title,
    description: recipe.description,
    ingredientNames: recipe.ingredients.map(i => i.name),
    stepInstructions: recipe.steps.map(s => s.instruction),
    ...(recipe.chefNotes ? { chefNotes: recipe.chefNotes } : {}),
  };

  const prompt = `Translate the following recipe fields to English. Keep ingredient quantities and units as-is (e.g. "2 dl" stays "2 dl"). Return ONLY a JSON object with the same structure.

${JSON.stringify(payload, null, 2)}

Return ONLY valid JSON matching the input structure exactly.`;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: HEADERS(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data?.content?.[0]?.text as string | undefined) ?? "";
    const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
    const json = JSON.parse(raw);
    if (!json.title || !Array.isArray(json.ingredientNames) || !Array.isArray(json.stepInstructions)) return null;
    return {
      title: json.title,
      description: json.description ?? recipe.description,
      ingredientNames: json.ingredientNames,
      stepInstructions: json.stepInstructions,
      chefNotes: typeof json.chefNotes === "string" ? json.chefNotes : undefined,
    };
  } catch {
    return null;
  }
}

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
        model: "claude-haiku-4-5-20251001",
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 128,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(8_000),
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
  recipe: { title: string; description: string; tags: string[]; dietaryTags: DietaryTag[]; mealTimes: MealTime[]; ingredients: { name: string }[]; cuisine?: string },
  apiKey: string,
  pageText?: string,
): Promise<{ typeTags: string[]; dietaryTags: DietaryTag[]; mealTimes: MealTime[]; chefNotes?: string; cuisine?: string; thermomixSuitable: boolean }> {
  const ingredientSample = recipe.ingredients.slice(0, 8).map(i => i.name).join(", ");
  const context = pageText ? `\n\nPage text excerpt:\n${pageText.slice(0, 2500)}` : "";
  const needsCuisine = !recipe.cuisine || recipe.cuisine === "any";

  const prompt = `Analyse this recipe and return a JSON object with five fields.

Recipe: "${recipe.title}"
Description: ${recipe.description}
Ingredients (sample): ${ingredientSample}${context}

1. "typeTags": array of applicable type tags from this list only — ["soup","pasta","bake","salad","freezable"]. Include a tag only if it clearly describes the dish. Use "freezable" only if the recipe explicitly says it freezes well. Can be empty.

2. "dietaryTags": array of applicable tags from ["vegetarian","vegan","gluten-free","dairy-free","pescatarian"]. Only include if clearly true based on ingredients.

3. "mealTimes": array of applicable meal times from ["breakfast","lunch","dinner","snack","dessert"]. A salad or light dish → lunch. A hearty main → dinner. Sweet dish → dessert. Snack/finger food → snack. Can include multiple. Must include at least one.

4. "chefNotes": any chef tips, notes, variations, or serving suggestions found in the text. Concise prose (2–4 sentences). null if none.

5. "cuisine": ${needsCuisine ? 'the cuisine of this dish as a single lowercase word or short phrase (e.g. "italian", "mexican", "middle eastern", "british"). Infer from the dish name, ingredients, and context. Use "any" only if truly impossible to determine.' : 'null (cuisine already known)'}.

6. "thermomixSuitable": true if this recipe has steps involving mechanical or thermal operations a Thermomix could perform (mixing, blending, chopping, cooking, steaming, sautéing, kneading). false if it is purely assembly, a salad, or has no cooking operations.

Return ONLY valid JSON: {"typeTags": [...], "dietaryTags": [...], "mealTimes": [...], "chefNotes": "..." or null, "cuisine": "..." or null, "thermomixSuitable": true or false}`;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: HEADERS(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 320,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { typeTags: [], dietaryTags: [], mealTimes: [], thermomixSuitable: true };
    const data = await res.json();
    const text = (data?.content?.[0]?.text as string | undefined) ?? "";
    const raw = text.match(/\{[\s\S]+\}/)?.[0] ?? text.trim();
    const json = JSON.parse(raw);
    const MEAL_TIMES = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;
    const typeTags = (json.typeTags as unknown[])?.filter((t): t is string => TYPE_TAGS.includes(t as never)) ?? [];
    const dietary = (json.dietaryTags as unknown[])?.filter((t): t is DietaryTag =>
      ["vegetarian","vegan","gluten-free","dairy-free","pescatarian"].includes(t as string)) ?? [];
    const mealTimes = (json.mealTimes as unknown[])?.filter((t): t is MealTime => MEAL_TIMES.includes(t as never)) ?? [];
    const chefNotes = typeof json.chefNotes === "string" && json.chefNotes.trim() ? json.chefNotes.trim() : undefined;
    const cuisine = needsCuisine && typeof json.cuisine === "string" && json.cuisine.trim() && json.cuisine !== "null"
      ? json.cuisine.trim().toLowerCase().slice(0, 25)
      : undefined;
    const thermomixSuitable = json.thermomixSuitable !== false;
    return { typeTags, dietaryTags: dietary, mealTimes, chefNotes, cuisine, thermomixSuitable };
  } catch {
    return { typeTags: [], dietaryTags: [], mealTimes: [], thermomixSuitable: true };
  }
}
