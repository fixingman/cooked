"use client";
import { Chip } from "@/components/ui/Chip";
import type { CategoryFilter } from "@/hooks/useRecipeFilter";

const GROUPS: { label: string; items: { value: CategoryFilter; label: string }[] }[] = [
  {
    label: "Meal time",
    items: [
      { value: "breakfast", label: "Breakfast" },
      { value: "lunch",     label: "Lunch" },
      { value: "dinner",    label: "Dinner" },
      { value: "snack",     label: "Snack" },
      { value: "dessert",   label: "Dessert" },
    ],
  },
  {
    label: "Type",
    items: [
      { value: "quick",     label: "Quick ≤30m" },
      { value: "soup",      label: "Soup" },
      { value: "pasta",     label: "Pasta" },
      { value: "bake",      label: "Bake" },
      { value: "salad",     label: "Salad" },
      { value: "thermomix", label: "Thermomix" },
    ],
  },
  {
    label: "Diet",
    items: [
      { value: "vegetarian",  label: "Vegetarian" },
      { value: "vegan",       label: "Vegan" },
      { value: "gluten-free", label: "Gluten-free" },
      { value: "dairy-free",  label: "Dairy-free" },
    ],
  },
  {
    label: "My list",
    items: [
      { value: "want-to-cook", label: "Want to Cook" },
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
    <div className="space-y-2.5">
      {/* All chip */}
      <div className="flex gap-2">
        <Chip label="All" active={active.length === 0} onClick={onClear} />
      </div>

      {GROUPS.map(({ label, items }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="text-[10px] font-medium uppercase tracking-widest text-ink-300 w-14 shrink-0 text-right">
            {label}
          </span>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {items.map(({ value, label: chipLabel }) => (
              <Chip
                key={value}
                label={chipLabel}
                active={active.includes(value)}
                onClick={() => onToggle(value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
