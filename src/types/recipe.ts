export type Difficulty = "easy" | "medium" | "hard";
export type MealTime = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
export type Cuisine =
  | "italian"
  | "japanese"
  | "mexican"
  | "french"
  | "mediterranean"
  | "american"
  | "indian"
  | "thai"
  | "any";
export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "pescatarian";

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  group?: string;
  optional?: boolean;
  unitImperial?: string;
  quantityImperial?: number;
}

export interface ThermomixStep {
  speed: number;           // 0–10
  tempC: number | "Varoma";
  timeSeconds: number;
  instruction: string;
  label?: string;          // e.g. "Blend", "Simmer"
}

export interface CookingStep {
  id: string;
  order: number;
  instruction: string;
  shortLabel: string;
  durationSeconds?: number;
  timerLabel?: string;
  temperature?: number;
  ingredients?: string[];
  thermomix?: ThermomixStep;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  heroImageUrl: string;
  authorName: string;
  cuisine: Cuisine;
  mealTimes: MealTime[];
  difficulty: Difficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  calories?: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  dietaryTags: DietaryTag[];
  description: string;
  chefNotes?: string;
  isFeatured?: boolean;
  ingredients: Ingredient[];
  steps: CookingStep[];
  relatedRecipeIds?: string[];
  thermomixAvailable?: boolean;
}

export interface CookingHistoryEntry {
  recipeId: string;
  cookedAt: string;
  rating?: number;
  notes?: string;
}
