"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import type { Ingredient } from "@/types/recipe";
import type { Substitute } from "@/lib/recipeEnrichment";

interface SubstituteSheetProps {
  ingredient: Ingredient;
  recipeTitle: string;
  cuisine?: string;
  dietaryPreferences: string[];
  onClose: () => void;
}

type State =
  | { phase: "loading" }
  | { phase: "results"; subs: Substitute[] }
  | { phase: "empty" }
  | { phase: "error" };

export function SubstituteSheet({ ingredient, recipeTitle, cuisine, dietaryPreferences, onClose }: SubstituteSheetProps) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recipes/ingredient-substitutes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredient: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            recipeTitle,
            cuisine,
            ...(dietaryPreferences.length ? { dietaryPreferences } : {}),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setState({ phase: "error" }); return; }
        const subs: Substitute[] = data.substitutes ?? [];
        setState(subs.length ? { phase: "results", subs } : { phase: "empty" });
      } catch {
        if (!cancelled) setState({ phase: "error" });
      }
    })();
    return () => { cancelled = true; };
  }, [ingredient, recipeTitle, cuisine, dietaryPreferences]);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 38 } }}
        exit={{ opacity: 0, y: "100%", transition: { duration: 0.2 } }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-parchment-100 rounded-t-[1.5rem] shadow-card-lg flex flex-col max-h-[85dvh] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:w-full md:max-w-md md:max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — never scrolls */}
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex justify-center mb-4 md:hidden">
            <div className="w-10 h-1 bg-parchment-300 rounded-full" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-label uppercase tracking-widest text-ink-400 flex items-center gap-1.5">
                <Sparkles size={11} className="text-saffron-500" /> AI-suggested
              </p>
              <h2 className="font-serif text-lg font-semibold text-ink-900 mt-1">
                Substitutes for {ingredient.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-ink-400 hover:bg-parchment-200 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-8">
          {state.phase === "loading" && (
            <div className="flex items-center gap-2 text-sm text-ink-400 py-6 justify-center">
              <Loader2 size={15} className="animate-spin text-saffron-500" />
              Finding good swaps…
            </div>
          )}

          {state.phase === "error" && (
            <p className="text-sm text-ink-500 py-6 text-center">
              Couldn&apos;t find substitutes right now — try again in a moment.
            </p>
          )}

          {state.phase === "empty" && (
            <p className="text-sm text-ink-500 py-6 text-center">
              No good swaps for this one — it&apos;s best kept as is.
            </p>
          )}

          {state.phase === "results" && (
            <ul className="space-y-2.5">
              {state.subs.map((s, i) => (
                <li key={i} className="bg-parchment-200 border border-parchment-300 rounded-xl px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink-900">{s.name}</span>
                    {s.ratio && (
                      <span className="text-xs text-ink-500 tabular-nums shrink-0 bg-parchment-100 border border-parchment-300 rounded-chip px-2 py-0.5">
                        {s.ratio}
                      </span>
                    )}
                  </div>
                  {s.note && <p className="text-xs text-ink-500 mt-1 leading-relaxed">{s.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
