import type { DietaryTag, MealTime } from "./recipe";

export type UnitSystem = "metric" | "imperial";

export interface UserSettings {
  units: UnitSystem;
  dietaryPreferences: DietaryTag[];
  favoriteMealTimes: MealTime[];
  aiEnabled: boolean;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  units: "metric",
  dietaryPreferences: [],
  favoriteMealTimes: [],
  aiEnabled: false,
  microphoneEnabled: false,
  cameraEnabled: false,
  darkMode: false,
};
