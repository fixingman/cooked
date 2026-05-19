"use client";
import { Chip } from "@/components/ui/Chip";
import type { CategoryFilter } from "@/hooks/useRecipeFilter";

const categories: { value: CategoryFilter; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "breakfast",  label: "Breakfast" },
  { value: "lunch",      label: "Lunch" },
  { value: "dinner",     label: "Dinner" },
  { value: "dessert",    label: "Dessert" },
  { value: "snack",      label: "Snack" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "thermomix",  label: "Thermomix" },
];

interface CategoryChipsProps {
  active: CategoryFilter;
  onChange: (v: CategoryFilter) => void;
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {categories.map(({ value, label }) => (
        <Chip
          key={value}
          label={label}
          active={active === value}
          onClick={() => onChange(value)}
        />
      ))}
    </div>
  );
}
