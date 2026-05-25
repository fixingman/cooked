export interface PantryItem {
  id: string;
  name: string;
  addedAt: string;
  low?: boolean;
  category?: "produce" | "dairy" | "meat" | "pantry" | "frozen" | "other";
}
