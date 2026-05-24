"use client";
import { Chip } from "@/components/ui/Chip";
import type { CategoryFilter } from "@/hooks/useRecipeFilter";

const GROUPS: { items: { value: CategoryFilter; label: string }[] }[] = [
  {
    items: [
      { value: "breakfast", label: "Breakfast" },
      { value: "lunch",     label: "Lunch" },
      { value: "dinner",    label: "Dinner" },
      { value: "snack",     label: "Snack" },
      { value: "dessert",   label: "Dessert" },
    ],
  },
  {
    items: [
      { value: "quick",     label: "Quick" },
      { value: "soup",      label: "Soup" },
      { value: "pasta",     label: "Pasta" },
      { value: "bake",      label: "Bake" },
      { value: "salad",     label: "Salad" },
      { value: "freezable", label: "Freezable" },
      { value: "thermomix", label: "Thermomix" },
    ],
  },
  {
    items: [
      { value: "high-protein", label: "High-protein" },
      { value: "vegetarian",   label: "Vegetarian" },
      { value: "vegan",        label: "Vegan" },
      { value: "gluten-free",  label: "Gluten-free" },
      { value: "dairy-free",   label: "Dairy-free" },
    ],
  },
  {
    items: [
      { value: "want-to-cook", label: "My list" },
      { value: "cooked",       label: "Cooked" },
    ],
  },
];

interface CategoryChipsProps {
  active: CategoryFilter[];
  onToggle: (v: CategoryFilter) => void;
  onClear: () => void;
}

export function CategoryChips({ active, onToggle, onClear }: CategoryChipsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
      <Chip label="All" active={active.length === 0} onClick={onClear} className="shrink-0 px-3 py-1 text-xs" />
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1.5 shrink-0">
          <span className="w-px h-4 bg-parchment-300 shrink-0 mx-0.5" aria-hidden />
          {group.items.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              active={active.includes(value)}
              onClick={() => onToggle(value)}
              className="shrink-0 px-3 py-1 text-xs"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
