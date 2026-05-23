"use client";
import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { Recipe } from "@/types/recipe";

type NutritionKeys = "calories" | "protein" | "fat" | "carbs" | "fiber" | "sugar" | "sodium" | "saturatedFat" | "cholesterol" | "transFat";
type NutritionPanelProps = { recipe: Pick<Recipe, NutritionKeys> };

type WarningLevel = "amber" | "red";

const WARNINGS: Record<string, { amber: number; red?: number; unit: string; reason: string }> = {
  sugar:        { amber: 10,  red: 20,  unit: "g",  reason: "High sugar can spike blood glucose and contribute to metabolic issues." },
  sodium:       { amber: 460, red: 920, unit: "mg", reason: "High sodium raises blood pressure and cardiovascular risk." },
  saturatedFat: { amber: 4,   red: 8,   unit: "g",  reason: "Excess saturated fat raises LDL (bad) cholesterol." },
  cholesterol:  { amber: 60,  red: 120, unit: "mg", reason: "High dietary cholesterol may affect cardiovascular health." },
  transFat:     { amber: 0.5, unit: "g",             reason: "Trans fats raise LDL and lower HDL — no safe level is established." },
};

function getWarning(key: string, value: number | undefined): WarningLevel | null {
  if (!value) return null;
  const t = WARNINGS[key];
  if (!t) return null;
  if (t.red !== undefined && value >= t.red) return "red";
  if (value >= t.amber) return "amber";
  return null;
}

function Stat({
  label, value, unit, warning, reason,
}: {
  label: string; value: number; unit: string;
  warning?: WarningLevel | null; reason?: string;
}) {
  const [open, setOpen] = useState(false);

  const bg    = warning === "red"   ? "bg-red-50 border-red-200"
              : warning === "amber" ? "bg-amber-50 border-amber-200"
              : "bg-parchment-200 border-parchment-300";
  const valCl = warning === "red"   ? "text-red-700"
              : warning === "amber" ? "text-amber-700"
              : "text-ink-900";
  const iconCl = warning === "red" ? "text-red-500" : "text-amber-500";

  return (
    <div
      className={`flex flex-col items-center border rounded-2xl px-3 py-3 min-w-[64px] flex-1 transition-colors ${bg} ${warning ? "cursor-pointer" : ""}`}
      onClick={() => warning && setOpen(o => !o)}
    >
      <div className="flex items-center gap-1">
        <span className={`font-serif text-lg font-medium ${valCl}`}>
          {value}<span className="text-sm font-sans font-normal text-ink-400 ml-0.5">{unit}</span>
        </span>
        {warning && <AlertTriangle size={11} className={iconCl} />}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">{label}</span>
      {open && reason && (
        <p className={`text-[10px] leading-snug text-center mt-1.5 ${warning === "red" ? "text-red-700" : "text-amber-700"}`}>
          {reason}
        </p>
      )}
    </div>
  );
}

export function NutritionPanel({ recipe }: NutritionPanelProps) {
  const { calories, protein, fat, carbs, fiber, sugar, sodium, saturatedFat, cholesterol, transFat } = recipe;
  const [expanded, setExpanded] = useState(false);

  if (!calories && !protein && !fat && !carbs) return null;

  const secondary: Array<{ key: string; label: string; value: number | undefined; unit: string }> = [
    { key: "fiber",        label: "Fiber",    value: fiber,        unit: "g"  },
    { key: "sugar",        label: "Sugar",    value: sugar,        unit: "g"  },
    { key: "sodium",       label: "Sodium",   value: sodium,       unit: "mg" },
    { key: "saturatedFat", label: "Sat. fat", value: saturatedFat, unit: "g"  },
    { key: "cholesterol",  label: "Chol.",    value: cholesterol,  unit: "mg" },
    { key: "transFat",     label: "Trans fat",value: transFat,     unit: "g"  },
  ].filter(s => s.value !== undefined && s.value !== null);

  const flagCount = secondary.filter(s => getWarning(s.key, s.value)).length;
  const hasSecondary = secondary.length > 0;

  return (
    <div className="py-5 border-b border-parchment-300">
      <p className="text-label uppercase tracking-widest text-ink-400 mb-3">Nutrition per serving</p>

      <div className="flex gap-2">
        {calories && <Stat label="Cal"     value={calories} unit="kcal" />}
        {protein  && <Stat label="Protein" value={protein}  unit="g" />}
        {carbs    && <Stat label="Carbs"   value={carbs}    unit="g" />}
        {fat      && <Stat label="Fat"     value={fat}      unit="g" />}
      </div>

      {hasSecondary && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
              flagCount > 0 && !expanded
                ? "text-amber-600 hover:text-amber-700"
                : "text-ink-400 hover:text-ink-600"
            }`}
          >
            {flagCount > 0 && !expanded && (
              <AlertTriangle size={12} className="text-amber-500" />
            )}
            {flagCount > 0 && !expanded
              ? `${flagCount} value${flagCount > 1 ? "s" : ""} to review — see details`
              : expanded ? "Less" : "More"
            }
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {expanded && (
            <div className="flex gap-2 flex-wrap mt-2">
              {secondary.map(s => (
                <Stat
                  key={s.key}
                  label={s.label}
                  value={s.value!}
                  unit={s.unit}
                  warning={getWarning(s.key, s.value)}
                  reason={WARNINGS[s.key]?.reason}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
