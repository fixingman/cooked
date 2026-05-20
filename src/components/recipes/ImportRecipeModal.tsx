"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Loader2, Check, AlertCircle, ChefHat, Clock, Users, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { uploadBinary } from "@/lib/dropbox/client";
import { formatMinutes } from "@/lib/formatTime";
import type { Recipe, MealTime } from "@/types/recipe";

const MEAL_TIMES: { value: MealTime; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch",     label: "Lunch" },
  { value: "dinner",    label: "Dinner" },
  { value: "snack",     label: "Snack" },
  { value: "dessert",   label: "Dessert" },
];

type Stage = "input" | "loading" | "review" | "error";

interface ImportRecipeModalProps {
  onClose: () => void;
  initialDraft?: Recipe;
  onSave?: (recipe: Recipe) => void;
}

export function ImportRecipeModal({ onClose, initialDraft, onSave }: ImportRecipeModalProps) {
  const router = useRouter();
  const { addRecipe } = useUserRecipes();
  const { status: dropboxStatus, getValidAccessToken } = useDropboxAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialDraft;
  const [stage, setStage] = useState<Stage>(isEditMode ? "review" : "input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<(Recipe & { sourceUrl?: string }) | null>(initialDraft ?? null);
  const [editTitle, setEditTitle] = useState(initialDraft?.title ?? "");
  const [editDesc, setEditDesc] = useState(initialDraft?.description ?? "");
  const [editMealTimes, setEditMealTimes] = useState<MealTime[]>(initialDraft?.mealTimes ?? []);
  const [saving, setSaving] = useState(false);
  const [heroImageBase64, setHeroImageBase64] = useState<string | null>(null);

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStage("loading");
    setError("");
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.recipe) {
        setError(data.error ?? "Could not extract a recipe from this page.");
        setStage("error");
        return;
      }
      setDraft(data.recipe);
      setEditTitle(data.recipe.title);
      setEditDesc(data.recipe.description);
      setEditMealTimes(data.recipe.mealTimes);
      if (data.heroImageBase64) setHeroImageBase64(data.heroImageBase64);
      setStage("review");
    } catch {
      setError("Network error — check your connection and try again.");
      setStage("error");
    }
  }

  function toggleMealTime(mt: MealTime) {
    setEditMealTimes(prev =>
      prev.includes(mt) ? prev.filter(m => m !== mt) : [...prev, mt]
    );
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    let finalRecipe: Recipe = {
      ...draft,
      title: editTitle.trim() || draft.title,
      description: editDesc.trim() || draft.description,
      mealTimes: editMealTimes.length > 0 ? editMealTimes : draft.mealTimes,
    };
    addRecipe(finalRecipe);

    // Archive hero image to Dropbox if available
    if (!isEditMode && heroImageBase64 && dropboxStatus === "connected") {
      try {
        const token = await getValidAccessToken();
        if (token) {
          const imagePath = `/images/${finalRecipe.id}.jpg`;
          await uploadBinary(token, imagePath, heroImageBase64);
          finalRecipe = { ...finalRecipe, heroImageDropboxPath: imagePath };
          addRecipe(finalRecipe);
        }
      } catch {}
    }

    onSave?.(finalRecipe);
    await new Promise(r => setTimeout(r, 50));
    onClose();
    if (!isEditMode) {
      router.push(`/recipes/${finalRecipe.slug}`);
    }
  }

  let hostname = "";
  try { hostname = draft ? new URL((draft as Recipe & { sourceUrl?: string }).sourceUrl ?? "").hostname.replace(/^www\./, "") : ""; } catch {}

  const stageTitle = stage === "review"
    ? (isEditMode ? "Edit Recipe" : "Review recipe")
    : "Import Recipe";

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — flex column so header + footer stay fixed, body scrolls */}
      <motion.div
        key="sheet"
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 38 } }}
        exit={{ opacity: 0, y: "100%", transition: { duration: 0.2 } }}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-parchment-100 rounded-t-[1.5rem] shadow-card-lg overflow-hidden max-h-[90dvh] md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:w-full md:max-w-lg md:max-h-[85dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — not in scroll area */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-parchment-300 rounded-full" />
        </div>

        {/* Header — not in scroll area */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-parchment-300 shrink-0">
          <h2 className="font-serif text-lg text-ink-900 font-semibold">{stageTitle}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment-200 transition-colors"
          >
            <X size={18} className="text-ink-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5 space-y-4">

            {/* ── Input stage ── */}
            {stage === "input" && (
              <>
                <p className="text-sm text-ink-500">
                  Paste a link from any recipe website — we&apos;ll extract the ingredients and steps for you.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleImport()}
                      placeholder="https://example.com/recipe"
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/30"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleImport}
                    disabled={!url.trim()}
                    className="px-4 py-2.5 bg-saffron-500 text-white rounded-xl text-sm font-medium hover:bg-saffron-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    Import
                  </motion.button>
                </div>
                <p className="text-xs text-ink-300">
                  Works with BBC Good Food, Allrecipes, Food52, Serious Eats, and more.
                </p>
              </>
            )}

            {/* ── Loading stage ── */}
            {stage === "loading" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="w-14 h-14 bg-parchment-200 rounded-full flex items-center justify-center">
                  <Loader2 size={24} className="text-saffron-500 animate-spin" />
                </div>
                <div>
                  <p className="font-serif text-ink-900">Fetching recipe…</p>
                  <p className="text-sm text-ink-400 mt-1">Reading ingredients and steps</p>
                </div>
              </div>
            )}

            {/* ── Error stage ── */}
            {stage === "error" && (
              <>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStage("input")}
                  className="w-full py-2.5 bg-parchment-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-parchment-300 transition-colors"
                >
                  Try a different URL
                </motion.button>
              </>
            )}

            {/* ── Review stage ── */}
            {stage === "review" && draft && (
              <>
                {/* Image + title side by side if image exists */}
                {draft.heroImageUrl ? (
                  <div className="flex gap-3 items-start">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-parchment-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.heroImageUrl}
                        alt={draft.title}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      {hostname && (
                        <div className="flex items-center gap-1 text-xs text-ink-400 mb-1">
                          <Globe size={11} />
                          <span className="truncate">{hostname}</span>
                        </div>
                      )}
                      <p className="font-serif text-base text-ink-900 leading-snug line-clamp-3">{draft.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-parchment-200 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-parchment-300 flex items-center justify-center shrink-0">
                      <ChefHat size={22} className="text-ink-300" />
                    </div>
                    <p className="font-serif text-base text-ink-900 leading-snug">{draft.title}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-ink-500 px-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatMinutes(draft.totalTimeMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {draft.servings} serving{draft.servings !== 1 ? "s" : ""}
                  </span>
                  <span className="text-ink-400">
                    {draft.ingredients.length} ingredients · {draft.steps.length} steps
                  </span>
                </div>

                {/* Editable title */}
                <div>
                  <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-parchment-200 border border-parchment-300 rounded-xl text-sm font-serif text-ink-900 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/30"
                  />
                </div>

                {/* Meal type chips */}
                <div>
                  <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">Meal type</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {MEAL_TIMES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => toggleMealTime(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          editMealTimes.includes(value)
                            ? "bg-ink-900 text-parchment-100"
                            : "bg-parchment-200 text-ink-500 hover:bg-parchment-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full px-3 py-2 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-700 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/30 resize-none"
                  />
                </div>

                {isEditMode && (
                  <p className="text-xs text-ink-400 bg-parchment-200 rounded-lg px-3 py-2.5">
                    To update ingredients and steps, re-import this recipe from its original URL.
                  </p>
                )}
              </>
            )}

          </div>
        </div>

        {/* ── Sticky footer — action buttons always visible ── */}
        {(stage === "review" || stage === "input") && (
          <div className="shrink-0 px-5 pt-3 pb-5 border-t border-parchment-300 bg-parchment-100">
            {stage === "review" && (
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => isEditMode ? onClose() : (setStage("input"), setDraft(null))}
                  className="flex-1 py-3 bg-parchment-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-parchment-300 transition-colors"
                >
                  {isEditMode ? "Cancel" : "Back"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] py-3 bg-sage-500 text-white rounded-xl text-sm font-medium hover:bg-sage-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {saving ? (heroImageBase64 && dropboxStatus === "connected" ? "Saving image…" : "Saving…") : isEditMode ? "Save Changes" : "Save Recipe"}
                </motion.button>
              </div>
            )}
            {stage === "input" && (
              <p className="text-center text-xs text-ink-300">
                Your imported recipes are saved to your own Dropbox.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
