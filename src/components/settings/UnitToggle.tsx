"use client";
import { cn } from "@/lib/cn";
import type { UnitSystem } from "@/types/settings";

interface UnitToggleProps {
  value: UnitSystem;
  onChange: (v: UnitSystem) => void;
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="flex bg-parchment-200 border border-parchment-300 rounded-xl p-1 w-fit">
      {(["metric", "imperial"] as UnitSystem[]).map((unit) => (
        <button
          key={unit}
          onClick={() => onChange(unit)}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200",
            value === unit
              ? "bg-parchment-100 text-ink-900 shadow-card"
              : "text-ink-500 hover:text-ink-700"
          )}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}
