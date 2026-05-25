"use client";
import { useState, useCallback } from "react";
import { ImageUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { uploadBinary } from "@/lib/dropbox/client";
import type { Recipe } from "@/types/recipe";

// "low-checked" intentionally excluded — means we tried HF+Unsplash and source is the limit
function needsRefresh(r: Recipe): boolean {
  if (!r.imageSource || r.imageSource === "none" || r.imageQuality === "low") return true;
  if (r.imageSource === "ai-found" && !!r.heroImageDropboxPath) return true;
  return false;
}

export function ImageRefreshSection() {
  const { recipes, addRecipe } = useUserRecipes();
  const { getValidAccessToken, status: dropboxStatus } = useDropboxAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; warmingUp?: boolean } | null>(null);
  const [result, setResult] = useState<{ updated: string[]; couldntImprove: number } | null>(null);

  const pending = recipes.filter(needsRefresh);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    const toProcess = recipes.filter(needsRefresh);
    setProgress({ done: 0, total: toProcess.length });
    const updatedTitles: string[] = [];
    let couldntImprove = 0;

    for (const recipe of toProcess) {
      try {
        const fetchRefresh = () => fetch("/api/recipes/refresh-image", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ imageUrl: recipe.heroImageUrl, title: recipe.title, cuisine: recipe.cuisine }),
        });

        let res = await fetchRefresh();
        if (!res.ok) { couldntImprove++; setProgress(p => p ? { ...p, done: p.done + 1 } : null); continue; }

        let data = await res.json() as {
          imageUrl: string | null;
          imageSource: Recipe["imageSource"];
          imageQuality: Recipe["imageQuality"];
          heroImageBase64?: string;
          hfLoading?: boolean;
          waitSeconds?: number;
        };

        if (data.hfLoading && data.waitSeconds) {
          setProgress(p => p ? { ...p, warmingUp: true } : null);
          await new Promise(resolve => setTimeout(resolve, (data.waitSeconds! + 3) * 1000));
          setProgress(p => p ? { ...p, warmingUp: false } : null);
          res = await fetchRefresh();
          if (!res.ok) { couldntImprove++; setProgress(p => p ? { ...p, done: p.done + 1 } : null); continue; }
          data = await res.json();
        }

        const urlChanged = !!data.imageUrl && data.imageUrl !== recipe.heroImageUrl;
        const qualityImproved = data.imageQuality !== "low";

        if (!urlChanged && !qualityImproved) {
          // Neither HF nor Unsplash could improve this — mark as checked so it stops appearing
          addRecipe({ ...recipe, imageSource: data.imageSource ?? recipe.imageSource ?? "scraped", imageQuality: "low-checked" });
          couldntImprove++;
          setProgress(p => p ? { ...p, done: p.done + 1 } : null);
          continue;
        }

        let updatedRecipe: Recipe = { ...recipe, imageSource: data.imageSource, imageQuality: data.imageQuality };
        if (urlChanged) updatedRecipe = { ...updatedRecipe, heroImageUrl: data.imageUrl! };

        if (data.heroImageBase64 && dropboxStatus === "connected") {
          try {
            const token = await getValidAccessToken();
            if (token) {
              const imagePath = `/recipes/images/${recipe.id}.jpg`;
              await uploadBinary(token, imagePath, data.heroImageBase64);
              updatedRecipe = { ...updatedRecipe, heroImageDropboxPath: imagePath };
            }
          } catch {}
        }

        addRecipe(updatedRecipe);
        updatedTitles.push(recipe.title);
      } catch {
        couldntImprove++;
      }
      setProgress(p => p ? { ...p, done: p.done + 1 } : null);
    }

    setRunning(false);
    setProgress(null);
    setResult({ updated: updatedTitles, couldntImprove });
  }, [recipes, running, addRecipe, getValidAccessToken, dropboxStatus]);

  if (recipes.length === 0) return null;

  // After a run, show result state instead of stale pending count
  const subtitle = result
    ? null // shown below
    : pending.length === 0
      ? "All recipe images look good"
      : `${pending.length} recipe${pending.length !== 1 ? "s" : ""} need${pending.length === 1 ? "s" : ""} image refresh`;

  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ImageUp size={18} className="text-ink-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink-800">Image Quality</p>
            {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={run}
          disabled={running || pending.length === 0}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-ink-900 text-parchment-100 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {running ? "Checking…" : "Refresh"}
        </button>
      </div>

      <AnimatePresence>
        {running && progress && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <Loader2 size={13} className="animate-spin" />
              {progress.warmingUp
                ? "Warming up AI upscaler…"
                : `Checking ${progress.done + 1} of ${progress.total}…`}
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
            key="result"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-1.5"
          >
            {result.updated.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={13} className="text-sage-500 shrink-0 mt-0.5" />
                <span className="text-ink-600">
                  Improved: {result.updated.join(", ")}
                </span>
              </div>
            )}
            {result.couldntImprove > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle size={13} className="text-ink-400 shrink-0 mt-0.5" />
                <span className="text-ink-400">
                  {result.couldntImprove} image{result.couldntImprove !== 1 ? "s" : ""} could not be improved — quality is limited by the source.
                </span>
              </div>
            )}
            {result.updated.length === 0 && result.couldntImprove === 0 && (
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={13} className="text-sage-500" />
                <span className="text-ink-600">All images look good.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
