"use client";
import type { Recipe } from "@/types/recipe";

interface NutritionPanelProps {
  recipe: Pick<Recipe, "calories" | "protein" | "fat" | "carbs" | "fiber">;
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-parchment-200 border border-parchment-300 rounded-2xl px-4 py-3 min-w-[64px] flex-1">
      <span className="font-serif text-lg font-medium text-ink-900">{value}<span className="text-sm font-sans font-normal text-ink-400 ml-0.5">{unit}</span></span>
      <span className="text-label text-ink-400 uppercase tracking-widest text-[10px]">{label}</span>
    </div>
  );
}

export function NutritionPanel({ recipe }: NutritionPanelProps) {
  const { calories, protein, fat, carbs, fiber } = recipe;
  if (!calories && !protein && !fat && !carbs && !fiber) return null;

  return (
    <div className="py-5 border-b border-parchment-300">
      <p className="text-label uppercase tracking-widest text-ink-400 mb-3">Nutrition per serving</p>
      <div className="flex gap-2">
        {calories && <Stat label="Cal"     value={calories} unit="kcal" />}
        {protein  && <Stat label="Protein" value={protein}  unit="g" />}
        {carbs    && <Stat label="Carbs"   value={carbs}    unit="g" />}
        {fat      && <Stat label="Fat"     value={fat}      unit="g" />}
        {fiber    && <Stat label="Fiber"   value={fiber}    unit="g" />}
      </div>
    </div>
  );
}
