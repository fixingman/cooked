export type Difficulty = "easy" | "medium" | "hard";
export type RecipeSource = "builtin" | "url" | "image" | "authored";
export type MealTime = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
export type Cuisine = string;
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
  timesEstimated?: boolean;
  servings: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
  transFat?: number;
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
  sourceType?: RecipeSource;
  sourceUrl?: string;
  heroImageDropboxPath?: string;
  imageSource?: "scraped" | "photo-import" | "ai-found" | "none";
  imageQuality?: "ok" | "low" | "low-checked"; // "low-checked" = tried HF+Unsplash, source is the limit
  heroImageSourceUrl?: string; // Original scraped image URL before quality resolution/replacement
}

export interface CookingHistoryEntry {
  recipeId: string;
  cookedAt: string;
  rating?: number;
  notes?: string;
}

export interface RecipeState {
  recipeId: string;
  wantToCook: boolean;
  cookedAt?: string[];
  rating?: number;
}
