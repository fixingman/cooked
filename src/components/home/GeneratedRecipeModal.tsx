"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Minus, Plus, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { uploadBinary } from "@/lib/dropbox/client";
import type { Recipe } from "@/types/recipe";

interface Props {
  draft: Recipe;
  onClose: () => void;
  onSave: (r: Recipe) => void;
  onRegenerate: () => void;
}

const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1];

export function GeneratedRecipeModal({ draft, onClose, onSave, onRegenerate }: Props) {
  const { addRecipe, updateRecipe } = useUserRecipes();
  const { getValidAccessToken } = useDropboxAuth();

  const [title, setTitle] = useState(draft.title);
  const [servings, setServings] = useState(draft.servings ?? 4);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    const finalRecipe: Recipe = { ...draft, title: title.trim() || draft.title, servings };

    // Upload hero image to Dropbox in the background
    if (finalRecipe.heroImageUrl && !finalRecipe.heroImageDropboxPath) {
      (async () => {
        try {
          const token = await getValidAccessToken();
          if (!token) return;
          const imgRes = await fetch(finalRecipe.heroImageUrl!);
          if (!imgRes.ok) return;
          const buf = await imgRes.arrayBuffer();
          const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
          const arr = new Uint8Array(buf);
          const b64 = btoa(Array.from(arr, c => String.fromCharCode(c)).join(""));
          const dataUrl = `data:${mime};base64,${b64}`;
          const ext = mime.includes("png") ? "png" : "jpg";
          const dbPath = `/images/${finalRecipe.id}.${ext}`;
          await uploadBinary(token, dbPath, dataUrl);
          updateRecipe(finalRecipe.id, { heroImageDropboxPath: dbPath });
        } catch {}
      })();
    }

    // Deferred enrichments (fire-and-forget)
    if (!finalRecipe.calories && !finalRecipe.protein) {
      fetch("/api/recipes/estimate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: finalRecipe.title, servings, ingredients: finalRecipe.ingredients }),
      })
        .then(r => r.json())
        .then(data => { if (data.nutrition) updateRecipe(finalRecipe.id, data.nutrition); })
        .catch(() => {});
    }

    if (!finalRecipe.totalTimeMinutes) {
      fetch("/api/recipes/estimate-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: finalRecipe.title, servings, ingredients: finalRecipe.ingredients, steps: finalRecipe.steps }),
      })
        .then(r => r.json())
        .then(data => { if (data.times) updateRecipe(finalRecipe.id, { ...data.times, timesEstimated: true }); })
        .catch(() => {});
    }

    addRecipe(finalRecipe);
    onSave(finalRecipe);
  }

  // Group ingredients by group field
  const grouped = draft.ingredients.reduce<Record<string, typeof draft.ingredients>>((acc, ing) => {
    const g = ing.group ?? "";
    if (!acc[g]) acc[g] = [];
    acc[g].push(ing);
    return acc;
  }, {});
  const groups = Object.entries(grouped);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-parchment-100 z-50 flex flex-col shadow-2xl rounded-l-panel overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%", transition: { duration: 0.22, ease: EXIT_EASE } }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-300 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-saffron-500" />
            <span className="text-label text-ink-400 uppercase tracking-widest text-[11px]">AI Recipe</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment-200 transition-colors">
            <X size={16} className="text-ink-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero image */}
          {draft.heroImageUrl && (
            <div className="relative h-48 w-full shrink-0">
              <Image src={draft.heroImageUrl} alt={title} fill className="object-cover" />
            </div>
          )}

          <div className="px-5 py-5 space-y-5">
            {/* AI badge + title */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                <Sparkles size={10} />
                Give it your own touch
              </span>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full font-display text-2xl text-ink-900 bg-transparent border-b border-parchment-300 focus:border-saffron-400 focus:outline-none pb-1 transition-colors"
              />
            </div>

            {/* Servings */}
            <div className="flex items-center gap-3">
              <span className="text-label text-ink-400 uppercase tracking-widest text-[11px]">Serves</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-7 h-7 flex items-center justify-center rounded-full border border-parchment-300 hover:bg-parchment-200 transition-colors">
                  <Minus size={12} className="text-ink-600" />
                </button>
                <span className="font-serif text-lg w-6 text-center text-ink-900">{servings}</span>
                <button onClick={() => setServings(s => s + 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-parchment-300 hover:bg-parchment-200 transition-colors">
                  <Plus size={12} className="text-ink-600" />
                </button>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <p className="text-label text-ink-400 uppercase tracking-widest text-[11px] mb-3">Ingredients</p>
              {groups.map(([group, ings]) => (
                <div key={group} className="mb-3">
                  {group && <p className="text-[11px] text-ink-400 uppercase tracking-widest mb-1.5">{group}</p>}
                  <div className="space-y-1.5">
                    {ings.map(ing => (
                      <div key={ing.id} className="flex items-baseline gap-2 text-sm">
                        <span className="text-ink-500 shrink-0 min-w-[3rem] text-right tabular-nums">
                          {ing.quantity > 0 ? ing.quantity : ""}
                          {ing.unit ? <span className="italic text-ink-400"> {ing.unit}</span> : null}
                        </span>
                        <span className="text-ink-800">{ing.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div>
              <p className="text-label text-ink-400 uppercase tracking-widest text-[11px] mb-3">Steps</p>
              <ol className="space-y-4">
                {draft.steps.map((step, i) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="font-serif text-ink-400 shrink-0 w-5 pt-0.5">{i + 1}</span>
                    <p className="text-sm text-ink-800 leading-relaxed">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-parchment-300 flex gap-3 shrink-0">
          <button
            onClick={onRegenerate}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-parchment-300 text-sm font-medium text-ink-600 hover:bg-parchment-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-sage-500 text-parchment-100 rounded-xl py-2.5 text-sm font-semibold hover:bg-sage-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save to library"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
