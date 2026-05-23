import type { Recipe, Ingredient, CookingStep, Cuisine, MealTime, DietaryTag, Difficulty, RecipeSource } from "@/types/recipe";

function parseDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/PT?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 60) + parseInt(m[2] ?? "0");
}

function mapCuisine(values: string | string[] | undefined): Cuisine {
  const s = (Array.isArray(values) ? values.join(" ") : values ?? "").toLowerCase();
  if (s.includes("italian")) return "italian";
  if (s.includes("japanese") || s.includes("sushi")) return "japanese";
  if (s.includes("mexican") || s.includes("tex-mex")) return "mexican";
  if (s.includes("french")) return "french";
  if (s.includes("mediterr") || s.includes("greek")) return "mediterranean";
  if (s.includes("american") || s.includes("southern")) return "american";
  if (s.includes("indian")) return "indian";
  if (s.includes("thai")) return "thai";
  return "any";
}

function mapMealTimes(categories: string | string[] | undefined): MealTime[] {
  const s = (Array.isArray(categories) ? categories.join(" ") : categories ?? "").toLowerCase();
  const out: MealTime[] = [];
  if (s.includes("breakfast") || s.includes("brunch")) out.push("breakfast");
  if (s.includes("lunch")) out.push("lunch");
  if (s.includes("dinner") || s.includes("main course") || s.includes("entree") || s.includes("supper")) out.push("dinner");
  if (s.includes("snack") || s.includes("appetizer") || s.includes("side")) out.push("snack");
  if (s.includes("dessert") || s.includes("sweet") || s.includes("cake") || s.includes("cookie")) out.push("dessert");
  return out.length > 0 ? out : ["dinner"];
}

function mapDietaryTags(diet: string | string[] | undefined): DietaryTag[] {
  const values = Array.isArray(diet) ? diet : diet ? [diet] : [];
  const tags: DietaryTag[] = [];
  for (const v of values) {
    const s = v.toLowerCase();
    if (s.includes("vegetarian") && !s.includes("non")) tags.push("vegetarian");
    if (s.includes("vegan")) tags.push("vegan");
    if (s.includes("glutenfree") || s.includes("gluten-free") || s.includes("gluten free")) tags.push("gluten-free");
    if (s.includes("dairyfree") || s.includes("dairy-free") || s.includes("dairy free")) tags.push("dairy-free");
    if (s.includes("pescatarian")) tags.push("pescatarian");
  }
  return tags.filter((t, i) => tags.indexOf(t) === i);
}

const UNIT_WORDS = new Set([
  "cup", "cups", "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
  "g", "gram", "grams", "kg", "ml", "l", "liter", "liters", "oz", "ounce", "ounces",
  "lb", "lbs", "pound", "pounds", "clove", "cloves", "slice", "slices", "piece",
  "pieces", "bunch", "bunches", "can", "cans", "package", "packages", "pinch", "dash",
  "sprig", "sprigs", "head", "heads", "stalk", "stalks",
]);

const FRACTION_MAP: Record<string, number> = {
  "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 0.3333, "⅔": 0.6667, "⅛": 0.125,
};

function parseIngredients(strs: string[]): Ingredient[] {
  return strs.map((str, i) => {
    const s = str.trim();
    let quantity = 0;
    let unit = "";
    let name = s;

    const m = s.match(/^([½¼¾⅓⅔⅛\d]+(?:[./][\d]+)?)\s*(\w+)?(?:\s+(.+))?$/);
    if (m) {
      const rawQty = m[1];
      quantity = FRACTION_MAP[rawQty] ??
        (rawQty.includes("/")
          ? parseInt(rawQty) / parseInt(rawQty.split("/")[1])
          : parseFloat(rawQty) || 0);
      const potentialUnit = (m[2] ?? "").toLowerCase().replace(/[.,]$/, "");
      if (UNIT_WORDS.has(potentialUnit)) {
        unit = potentialUnit;
        name = m[3] ?? potentialUnit;
      } else {
        name = [m[2], m[3]].filter(Boolean).join(" ") || s;
      }
    }

    return { id: `ing-${i}`, name: name.trim() || s, quantity, unit };
  });
}

function parseSteps(instructions: unknown[]): CookingStep[] {
  const texts: string[] = [];

  function extract(items: unknown[]) {
    for (const item of items) {
      if (typeof item === "string") {
        texts.push(item);
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (obj["@type"] === "HowToSection" && Array.isArray(obj.itemListElement)) {
          extract(obj.itemListElement as unknown[]);
        } else if (typeof obj.text === "string") {
          texts.push(obj.text);
        }
      }
    }
  }
  extract(instructions);

  return texts
    .filter(t => t.trim().length > 0)
    .map((instruction, i) => ({
      id: `step-${i}`,
      order: i + 1,
      instruction: instruction.trim(),
      shortLabel: `Step ${i + 1}`,
    }));
}

function extractImage(image: unknown): string {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (Array.isArray(image) && image.length > 0) {
    const first = image[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return (first as Record<string, string>).url ?? "";
  }
  if (typeof image === "object") return (image as Record<string, string>).url ?? "";
  return "";
}

function extractAuthor(author: unknown): string {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (Array.isArray(author)) return extractAuthor(author[0]);
  if (typeof author === "object") return (author as Record<string, string>).name ?? "";
  return "";
}

export function slugifyTitle(title: string, id: string): string {
  return `user-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)}-${id.slice(0, 8)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findRecipeSchema(data: any): any | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeSchema(item);
      if (found) return found;
    }
    return null;
  }
  const type = data["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return data;
  if (Array.isArray(data["@graph"])) return findRecipeSchema(data["@graph"]);
  return null;
}

function parseNutrient(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return isNaN(n) || n === 0 ? undefined : Math.round(n);
}

export interface RecipeDraft extends Recipe {
  sourceUrl: string;
  sourceType: RecipeSource;
}

export function buildRecipeFromSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>,
  sourceUrl: string,
  id: string,
): RecipeDraft {
  const title = (schema.name as string | undefined) ?? "Imported Recipe";
  const prepTimeMinutes = parseDuration(schema.prepTime as string | undefined);
  const cookTimeMinutes = parseDuration(schema.cookTime as string | undefined);
  const totalFromSchema  = parseDuration(schema.totalTime as string | undefined);
  const totalTimeMinutes = totalFromSchema || (prepTimeMinutes + cookTimeMinutes) || 30;

  const rawYield = schema.recipeYield;
  const servings = Array.isArray(rawYield)
    ? (parseInt(String(rawYield[0])) || 4)
    : (parseInt(String(rawYield ?? "4")) || 4);

  const ingredients = parseIngredients(
    Array.isArray(schema.recipeIngredient) ? (schema.recipeIngredient as string[]) : []
  );
  const steps = parseSteps(
    Array.isArray(schema.recipeInstructions) ? (schema.recipeInstructions as unknown[]) : []
  );

  const difficulty: Difficulty =
    totalTimeMinutes <= 20 ? "easy" : totalTimeMinutes >= 90 ? "hard" : "medium";

  let hostname = "";
  try { hostname = new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch {}

  const schemaTypeTags = (schema.typeTags as string[] | undefined) ?? [];
  const baseDietaryTags = mapDietaryTags(schema.suitableForDiet as string | string[] | undefined);

  return {
    id,
    slug: slugifyTitle(title, id),
    title,
    heroImageUrl: extractImage(schema.image),
    authorName: extractAuthor(schema.author) || hostname,
    cuisine: mapCuisine(schema.recipeCuisine as string | string[] | undefined),
    mealTimes: mapMealTimes(schema.recipeCategory as string | string[] | undefined),
    difficulty,
    prepTimeMinutes,
    cookTimeMinutes,
    totalTimeMinutes,
    servings,
    calories:     parseNutrient((schema.nutrition as Record<string, string> | undefined)?.calories),
    protein:      parseNutrient((schema.nutrition as Record<string, string> | undefined)?.proteinContent),
    fat:          parseNutrient((schema.nutrition as Record<string, string> | undefined)?.fatContent),
    carbs:        parseNutrient((schema.nutrition as Record<string, string> | undefined)?.carbohydrateContent),
    fiber:        parseNutrient((schema.nutrition as Record<string, string> | undefined)?.fiberContent),
    sugar:        parseNutrient((schema.nutrition as Record<string, string> | undefined)?.sugarContent),
    sodium:       parseNutrient((schema.nutrition as Record<string, string> | undefined)?.sodiumContent),
    saturatedFat: parseNutrient((schema.nutrition as Record<string, string> | undefined)?.saturatedFatContent),
    cholesterol:  parseNutrient((schema.nutrition as Record<string, string> | undefined)?.cholesterolContent),
    transFat:     parseNutrient((schema.nutrition as Record<string, string> | undefined)?.transFatContent),
    rating: 0,
    reviewCount: 0,
    tags: schemaTypeTags,
    dietaryTags: baseDietaryTags,
    description: (schema.description as string | undefined) ?? `Imported from ${hostname}`,
    chefNotes: (schema.chefNotes as string | undefined) ?? undefined,
    isFeatured: false,
    ingredients,
    steps,
    thermomixAvailable: false,
    sourceType: "url",
    sourceUrl,
  };
}

export function parseRecipeFromHtml(html: string, sourceUrl: string, id: string): RecipeDraft | null {
  const jsonLdBlocks: string[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) jsonLdBlocks.push(match[1]);

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      const schema = findRecipeSchema(parsed);
      if (schema) return buildRecipeFromSchema(schema, sourceUrl, id);
    } catch {}
  }
  return null;
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
