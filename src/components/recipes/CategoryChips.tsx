"use client";
import { Chip } from "@/components/ui/Chip";
import type { CategoryFilter } from "@/hooks/useRecipeFilter";

const categories: { value: CategoryFilter; label: string }[] = [
  { value: "want-to-cook", label: "Want to Cook" },
  { value: "breakfast",    label: "Breakfast" },
  { value: "lunch",        label: "Lunch" },
  { value: "dinner",       label: "Dinner" },
  { value: "dessert",      label: "Dessert" },
  { value: "snack",        label: "Snack" },
  { value: "vegetarian",   label: "Vegetarian" },
  { value: "thermomix",    label: "Thermomix" },
];

interface CategoryChipsProps {
  active: CategoryFilter[];
  onToggle: (v: CategoryFilter) => void;
  onClear: () => void;
}

export function CategoryChips({ active, onToggle, onClear }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      <Chip
        label="All"
        active={active.length === 0}
        onClick={onClear}
      />
      {categories.map(({ value, label }) => (
        <Chip
          key={value}
          label={label}
          active={active.includes(value)}
          onClick={() => onToggle(value)}
        />
      ))}
    </div>
  );
}
