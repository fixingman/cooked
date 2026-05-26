export interface PantryItem {
  id: string;
  name: string;
  addedAt: string;
  low?: boolean;
  category?: "fruit" | "vegetables" | "dairy" | "meat" | "grains" | "legumes" | "spices" | "baking" | "pantry" | "canned" | "dried" | "frozen" | "other";
}
