export interface PantryItem {
  id: string;
  name: string;
  addedAt: string;
  low?: boolean;
  category?: "produce" | "dairy" | "meat" | "grains" | "spices" | "baking" | "pantry" | "canned" | "frozen" | "other";
}
