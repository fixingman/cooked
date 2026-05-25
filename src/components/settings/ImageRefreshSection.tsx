"use client";
import { useState, useCallback } from "react";
import { ImageUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { uploadBinary } from "@/lib/dropbox/client";
import type { Recipe } from "@/types/recipe";

function needsRefresh(r: Recipe): boolean {
  if (!r.imageSource || r.imageSource === "none" || r.imageQuality === "low") return true;
  // Unsplash replaced original but original is stored in Dropbox — restore heroImageUrl
  if (r.imageSource === "ai-found" && !!r.heroImageDropboxPath) return true;
  return false;
}

export function ImageRefreshSection() {
  const { recipes, addRecipe } = useUserRecipes();
  const { getValidAccessToken, status: dropboxStatus } = useDropboxAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ updated: number; skipped: number } | null>(null);

  const pending = recipes.filter(needsRefresh);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    const toProcess = recipes.filter(needsRefresh);
    setProgress({ done: 0, total: toProcess.length });
    let updated = 0;
    let skipped = 0;

    for (const recipe of toProcess) {
      try {
        const res = await fetch("/api/recipes/refresh-image", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ imageUrl: recipe.heroImageUrl, title: recipe.title, cuisine: recipe.cuisine }),
        });
        if (!res.ok) { skipped++; continue; }
        const data = await res.json() as { imageUrl: string | null; imageSource: Recipe["imageSource"]; imageQuality: Recipe["imageQuality"]; heroImageBase64?: string };

        let updatedRecipe: Recipe = { ...recipe, imageSource: data.imageSource, imageQuality: data.imageQuality };
        if (data.imageUrl && data.imageUrl !== recipe.heroImageUrl) {
          updatedRecipe = { ...updatedRecipe, heroImageUrl: data.imageUrl };
        }

        // Upload new image to Dropbox if available and connected
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
        updated++;
      } catch {
        skipped++;
      }
      setProgress(p => p ? { ...p, done: p.done + 1 } : null);
    }

    setRunning(false);
    setProgress(null);
    setResult({ updated, skipped });
  }, [recipes, running, addRecipe, getValidAccessToken, dropboxStatus]);

  if (recipes.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ImageUp size={18} className="text-ink-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink-800">Image Quality</p>
            <p className="text-xs text-ink-400 mt-0.5">
              {pending.length === 0 ? "All recipe images look good" : `${pending.length} recipe${pending.length !== 1 ? "s" : ""} need image refresh`}
            </p>
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <Loader2 size={13} className="animate-spin" />
              Checking {progress.done + 1} of {progress.total}…
            </div>
            <div className="mt-2 h-1 bg-parchment-300 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-saffron-500 rounded-full"
                animate={{ width: `${((progress.done / progress.total) * 100)}%` }}
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
              ? <><CheckCircle2 size={13} className="text-sage-500" /><span className="text-ink-600">{result.updated} image{result.updated !== 1 ? "s" : ""} refreshed{result.skipped > 0 ? `, ${result.skipped} skipped` : ""}</span></>
              : <><AlertCircle size={13} className="text-ink-400" /><span className="text-ink-400">No images updated</span></>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
