"use client";
import { useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useSettings } from "@/hooks/useSettings";
import type { Recipe } from "@/types/recipe";

const TmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-500">
    <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function needsEnrichment(r: Recipe): boolean {
  return !r.thermomixAvailable && r.steps.length > 0;
}

export function ThermomixEnrichSection() {
  const { recipes, addRecipe } = useUserRecipes();
  const { settings } = useSettings();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ updated: number; noSteps: number; failed: number } | null>(null);

  const pending = recipes.filter(needsEnrichment);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    const toProcess = recipes.filter(needsEnrichment);
    setProgress({ done: 0, total: toProcess.length });
    let updated = 0;
    let noSteps = 0;
    let failed = 0;

    for (const recipe of toProcess) {
      try {
        const res = await fetch("/api/recipes/enrich-thermomix", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ steps: recipe.steps }),
          signal: AbortSignal.timeout(28_000),
        });
        if (res.status === 422) { noSteps++; setProgress(p => p ? { ...p, done: p.done + 1 } : null); continue; }
        if (!res.ok) { failed++; setProgress(p => p ? { ...p, done: p.done + 1 } : null); continue; }
        const data = await res.json() as { steps: Recipe["steps"]; thermomixAvailable: true };
        addRecipe({ ...recipe, steps: data.steps, thermomixAvailable: true });
        updated++;
      } catch {
        failed++;
      }
      setProgress(p => p ? { ...p, done: p.done + 1 } : null);
    }

    setRunning(false);
    setProgress(null);
    setResult({ updated, noSteps, failed });
  }, [recipes, running, addRecipe]);

  if (!settings.thermomixEnabled || recipes.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <TmIcon />
          <div>
            <p className="text-sm font-medium text-ink-800">Thermomix Steps</p>
            <p className="text-xs text-ink-400 mt-0.5">
              {pending.length === 0
                ? "All recipes have Thermomix steps"
                : `${pending.length} recipe${pending.length !== 1 ? "s" : ""} missing Thermomix adaptation`}
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={running || pending.length === 0}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-ink-900 text-parchment-100 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {running ? "Generating…" : "Generate"}
        </button>
      </div>

      <AnimatePresence>
        {running && progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <Loader2 size={13} className="animate-spin" />
              Generating {progress.done + 1} of {progress.total}…
            </div>
            <div className="mt-2 h-1 bg-parchment-300 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-saffron-500 rounded-full"
                animate={{ width: `${(progress.done / progress.total) * 100}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {result && !running && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-xs"
          >
            {result.updated > 0
              ? <><CheckCircle2 size={13} className="text-sage-500" /><span className="text-ink-600">{result.updated} updated{result.noSteps > 0 ? ` · ${result.noSteps} no TM steps` : ""}{result.failed > 0 ? ` · ${result.failed} failed` : ""}</span></>
              : result.failed > 0
                ? <><AlertCircle size={13} className="text-amber-400" /><span className="text-amber-700">{result.failed} timed out — try again</span></>
                : <><AlertCircle size={13} className="text-ink-400" /><span className="text-ink-400">Steps not suitable for Thermomix</span></>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
