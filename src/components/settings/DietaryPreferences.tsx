"use client";
import { Chip } from "@/components/ui/Chip";
import type { DietaryTag } from "@/types/recipe";

const tags: { value: DietaryTag; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan",      label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "pescatarian", label: "Pescatarian" },
];

interface DietaryPreferencesProps {
  selected: DietaryTag[];
  onToggle: (tag: DietaryTag) => void;
}

export function DietaryPreferences({ selected, onToggle }: DietaryPreferencesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ value, label }) => (
        <Chip
          key={value}
          label={label}
          active={selected.includes(value)}
          onClick={() => onToggle(value)}
        />
      ))}
    </div>
  );
}
