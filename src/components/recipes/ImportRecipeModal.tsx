"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Loader2, Check, AlertCircle, ChefHat, Clock, Users, Globe, ArrowLeft, Camera, ImagePlus, Sparkles } from "lucide-react";
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
type ImportMode = "url" | "photo";

interface ImportRecipeModalProps {
  onClose: () => void;
  initialDraft?: Recipe;
  generatedDraft?: Recipe;
  onSave?: (recipe: Recipe) => void;
}

export function ImportRecipeModal({ onClose, initialDraft, generatedDraft, onSave }: ImportRecipeModalProps) {
  const router = useRouter();
  const { recipes, addRecipe, updateRecipe } = useUserRecipes();
  const { status: dropboxStatus, getValidAccessToken } = useDropboxAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // isEditMode: existing recipe being edited (preserve ID, no TM enrichment, no nav)
  // generatedDraft: AI-created recipe — starts at review but saves like a fresh import
  const isEditMode = !!initialDraft;
  const seedDraft = initialDraft ?? generatedDraft ?? null;
  const [stage, setStage] = useState<Stage>(seedDraft ? "review" : "input");
  const [importMode, setImportMode] = useState<ImportMode>("url");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<(Recipe & { sourceUrl?: string }) | null>(seedDraft);
  const [editTitle, setEditTitle] = useState(seedDraft?.title ?? "");
  const [editDesc, setEditDesc] = useState(seedDraft?.description ?? "");
  const [editMealTimes, setEditMealTimes] = useState<MealTime[]>(seedDraft?.mealTimes ?? []);
  const [saving, setSaving] = useState(false);
  const [heroImageBase64, setHeroImageBase64] = useState<string | null>(null);
  const [enrichments, setEnrichments] = useState<{ nutrition: boolean; nutritionSource?: "ai" | "json-ld" | "none"; thermomix: boolean; thermomixSuitable?: boolean } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tmEnrichState, setTmEnrichState] = useState<"idle" | "pending" | "done" | "failed">("idle");
  const [duplicateOf, setDuplicateOf] = useState<Recipe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialise synchronously from window so animation direction is correct on first render
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) { setUrlError("Please enter a URL."); return; }
    try { new URL(trimmed); } catch {
      setUrlError("That doesn't look like a valid URL. Try pasting the full address including https://");
      return;
    }
    setUrlError("");
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
      if (data.enrichments) setEnrichments(data.enrichments);
      checkDuplicate(data.recipe);
      setStage("review");
    } catch {
      setError("Network error — check your connection and try again.");
      setStage("error");
    }
  }

  const handlePhotoImport = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);

      const [, mimeType, base64] = dataUrl.match(/^data:([^;]+);base64,(.+)$/) ?? [];
      if (!base64) { setError("Could not read image data."); setStage("error"); return; }

      setStage("loading");
      setError("");
      try {
        const res = await fetch("/api/recipes/import-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (!res.ok || !data.recipe) {
          setError(data.error ?? "Could not extract a recipe from this image.");
          setStage("error");
          return;
        }
        setDraft(data.recipe);
        setEditTitle(data.recipe.title);
        setEditDesc(data.recipe.description);
        setEditMealTimes(data.recipe.mealTimes);
        if (data.heroImageBase64) setHeroImageBase64(data.heroImageBase64);
        if (data.enrichments) setEnrichments(data.enrichments);
        checkDuplicate(data.recipe);
        setStage("review");
      } catch {
        setError("Network error — check your connection and try again.");
        setStage("error");
      }
    };
    reader.readAsDataURL(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function checkDuplicate(recipe: Recipe & { sourceUrl?: string }) {
    const sourceUrl = recipe.sourceUrl;
    const byUrl = sourceUrl ? recipes.find(r => (r as Recipe & { sourceUrl?: string }).sourceUrl === sourceUrl) : null;
    const byTitle = recipes.find(r => r.title.toLowerCase().trim() === recipe.title.toLowerCase().trim());
    setDuplicateOf(byUrl ?? byTitle ?? null);
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

    // Fire Thermomix enrichment in the background after save — only if classify confirmed suitability.
    if (!isEditMode && finalRecipe.steps.length > 0 && enrichments?.thermomixSuitable !== false) {
      setTmEnrichState("pending");
      const recipeId = finalRecipe.id;
      fetch("/api/recipes/enrich-thermomix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: finalRecipe.steps }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.steps) {
            updateRecipe(recipeId, { steps: data.steps, thermomixAvailable: true });
            setTmEnrichState("done");
          } else {
            setTmEnrichState("failed");
          }
        })
        .catch(() => setTmEnrichState("failed"));
    }

    onSave?.(finalRecipe);
    await new Promise(r => setTimeout(r, 50));
    onClose();
    if (!isEditMode) router.push(`/recipes/${finalRecipe.slug}`);
  }

  let hostname = "";
  try { hostname = draft ? new URL((draft as Recipe & { sourceUrl?: string }).sourceUrl ?? "").hostname.replace(/^www\./, "") : ""; } catch {}

  const stageTitle = stage === "review"
    ? (isEditMode ? "Edit Recipe" : generatedDraft ? "Generated Recipe" : "Review Recipe")
    : "Import Recipe";

  // Variants encode their own transitions so enter (spring) and exit (ease) differ
  const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1];
  const panelVariants = isDesktop ? {
    hidden: { x: "100%", transition: { duration: 0.22, ease: EXIT_EASE } },
    visible: { x: 0, transition: { type: "spring" as const, stiffness: 340, damping: 38 } },
  } : {
    hidden: { y: "100%", transition: { duration: 0.22, ease: EXIT_EASE } },
    visible: { y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 38 } },
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel
          Mobile  : bottom sheet, max 90dvh, rounded top corners
          Desktop : full-height right panel, fixed top-0 + bottom-0, 480px wide, rounded left corners
      */}
      <motion.div
        key="panel"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={[
          "fixed z-50 flex flex-col bg-parchment-100 overflow-hidden",
          // Mobile bottom sheet
          "bottom-0 left-0 right-0 max-h-[90dvh] rounded-t-[1.5rem] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]",
          // Desktop right panel — top-0 + bottom-0 = full viewport height, no max-h conflict
          "md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[480px] md:max-h-none md:rounded-none md:rounded-tl-[1.5rem] md:rounded-bl-[1.5rem] md:shadow-[-8px_0_48px_rgba(0,0,0,0.14)]",
        ].join(" ")}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-parchment-300 rounded-full" />
        </div>

        {/* Header — fixed height, never scrolls */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-parchment-300">
          <div className="flex items-center gap-2">
            {stage === "review" && !isEditMode && (
              <button
                onClick={() => { setStage("input"); setDraft(null); setPhotoPreview(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment-200 transition-colors -ml-1"
              >
                <ArrowLeft size={17} className="text-ink-500" />
              </button>
            )}
            <h2 className="font-serif text-lg text-ink-900 font-semibold">{stageTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment-200 transition-colors"
          >
            <X size={18} className="text-ink-500" />
          </button>
        </div>

        {/* Body — flex-1 + min-h-0 = fills remaining height and scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Duplicate warning */}
          {stage === "review" && duplicateOf && (
            <div className="mx-5 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900">Already in your collection</p>
                <p className="text-xs text-amber-700 mt-0.5 truncate">&ldquo;{duplicateOf.title}&rdquo; was added before.</p>
              </div>
              <button
                onClick={() => { onClose(); router.push(`/recipes/${duplicateOf.slug}`); }}
                className="shrink-0 text-xs font-medium text-amber-700 underline underline-offset-2"
              >
                View
              </button>
            </div>
          )}

          {/* Hero banner (review only) — full-width, part of scroll */}
          {stage === "review" && draft && (
            <div className="relative w-full h-48 bg-parchment-200 shrink-0">
              {draft.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.heroImageUrl}
                  alt={draft.title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat size={40} className="text-ink-300" />
                </div>
              )}
              {hostname && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-ink-900/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Globe size={10} className="text-parchment-300" />
                  <span className="text-[11px] text-parchment-100">{hostname}</span>
                </div>
              )}
            </div>
          )}

          <div className="p-5 space-y-5">

            {/* Input */}
            {stage === "input" && (
              <>
                {/* Mode tabs */}
                <div className="flex gap-1 p-1 bg-parchment-200 rounded-xl">
                  <button
                    onClick={() => setImportMode("url")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      importMode === "url"
                        ? "bg-parchment-100 text-ink-900 shadow-sm"
                        : "text-ink-400 hover:text-ink-600"
                    }`}
                  >
                    <Link2 size={14} />
                    URL
                  </button>
                  <button
                    onClick={() => setImportMode("photo")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      importMode === "photo"
                        ? "bg-parchment-100 text-ink-900 shadow-sm"
                        : "text-ink-400 hover:text-ink-600"
                    }`}
                  >
                    <Camera size={14} />
                    Photo
                  </button>
                </div>

                {importMode === "url" ? (
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
                          onChange={e => { setUrl(e.target.value); if (urlError) setUrlError(""); }}
                          onKeyDown={e => e.key === "Enter" && handleImport()}
                          placeholder="https://example.com/recipe"
                          autoFocus
                          className={[
                            "w-full pl-9 pr-3 py-2.5 bg-parchment-200 border rounded-xl text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-1 transition-colors",
                            urlError
                              ? "border-red-300 focus:border-red-400 focus:ring-red-400/30"
                              : "border-parchment-300 focus:border-saffron-400 focus:ring-saffron-400/30",
                          ].join(" ")}
                        />
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleImport}
                        className="px-4 py-2.5 bg-saffron-500 text-white rounded-xl text-sm font-medium hover:bg-saffron-600 transition-colors shrink-0"
                      >
                        Import
                      </motion.button>
                    </div>
                    {urlError && <p className="text-xs text-red-500">{urlError}</p>}
                    <p className="text-xs text-ink-300">
                      Works with BBC Good Food, Allrecipes, Food52, Serious Eats, and more.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-ink-500">
                      Take a photo of a cookbook page, handwritten card, or recipe screenshot.
                    </p>
                    {/* Drop zone */}
                    <motion.div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handlePhotoImport(file);
                      }}
                      animate={{ borderColor: isDragging ? "#E8890C" : "#EDE5D8" }}
                      className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-parchment-300 bg-parchment-200 py-10 cursor-pointer hover:border-saffron-400 hover:bg-parchment-300/50 transition-colors overflow-hidden"
                    >
                      {photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                      ) : null}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-parchment-100 rounded-full flex items-center justify-center shadow-sm">
                          <ImagePlus size={22} className="text-ink-400" />
                        </div>
                        <p className="text-sm font-medium text-ink-700">
                          {photoPreview ? "Change photo" : "Drop photo here"}
                        </p>
                        <p className="text-xs text-ink-400">or tap to browse / use camera</p>
                      </div>
                    </motion.div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoImport(file);
                      }}
                    />
                    <p className="text-xs text-ink-300">JPEG, PNG, or WebP · Max ~5MB · Powered by Claude vision</p>
                  </>
                )}
              </>
            )}

            {/* Loading */}
            {stage === "loading" && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="w-14 h-14 bg-parchment-200 rounded-full flex items-center justify-center">
                  <Loader2 size={24} className="text-saffron-500 animate-spin" />
                </div>
                <div>
                  <p className="font-serif text-ink-900">
                    {importMode === "photo" ? "Reading photo…" : "Fetching recipe…"}
                  </p>
                  <p className="text-sm text-ink-400 mt-1">Extracting ingredients and steps</p>
                </div>
              </div>
            )}

            {/* Error */}
            {stage === "error" && (
              <>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setStage("input"); setPhotoPreview(null); }}
                  className="w-full py-2.5 bg-parchment-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-parchment-300 transition-colors"
                >
                  {importMode === "photo" ? "Try a different photo" : "Try a different URL"}
                </motion.button>
              </>
            )}

            {/* Review */}
            {stage === "review" && draft && (
              <>
                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-ink-500 flex-wrap py-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-ink-400" />
                    {formatMinutes(draft.totalTimeMinutes)}
                  </span>
                  <span className="text-parchment-300">·</span>
                  <span className="flex items-center gap-1">
                    <Users size={12} className="text-ink-400" />
                    {draft.servings} serving{draft.servings !== 1 ? "s" : ""}
                  </span>
                  <span className="text-parchment-300">·</span>
                  <span>{draft.ingredients.length} ingredients · {draft.steps.length} steps</span>
                </div>

                {/* AI enrichment status */}
                {enrichments && (() => {
                  const ns = enrichments.nutritionSource;
                  const hasMacros = ns === "ai" || ns === "json-ld" || (!ns && enrichments.nutrition) || !!(draft?.calories);
                  const macroLabel = ns === "ai" ? "Macros estimated" : ns === "json-ld" ? "Macros from recipe" : hasMacros ? "Macros available" : "Macros unavailable";
                  return (
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${hasMacros ? "bg-sage-100 text-sage-700" : "bg-parchment-200 text-ink-400"}`}>
                        <Sparkles size={10} />
                        {macroLabel}
                      </span>
                      {draft?.steps && draft.steps.length > 0 && enrichments?.thermomixSuitable !== false && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${tmEnrichState === "done" ? "bg-saffron-50 text-saffron-700" : tmEnrichState === "failed" ? "bg-parchment-200 text-ink-400" : "bg-parchment-200 text-ink-500"}`}>
                          <Sparkles size={10} />
                          {tmEnrichState === "done" ? "Thermomix steps added" : tmEnrichState === "failed" ? "No Thermomix adaptation" : tmEnrichState === "pending" ? "Adding Thermomix steps…" : "Thermomix steps — added after save"}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 bg-parchment-200 border border-parchment-300 rounded-xl text-sm font-serif text-ink-900 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/30"
                  />
                </div>

                {/* Meal type */}
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
                    rows={4}
                    className="mt-1.5 w-full px-3 py-2.5 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-700 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/30 resize-none"
                  />
                </div>

                {isEditMode && (
                  <p className="text-xs text-ink-400 bg-parchment-200 rounded-xl px-3 py-2.5">
                    To update ingredients and steps, re-import from the original URL.
                  </p>
                )}
              </>
            )}

          </div>
        </div>

        {/* Footer — fixed at bottom, never scrolls */}
        {(stage === "review" || stage === "input") && (
          <div className="shrink-0 px-5 pt-3 pb-5 md:pb-5 border-t border-parchment-300 bg-parchment-100">
            {stage === "review" ? (
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex-1 py-3 bg-parchment-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-parchment-300 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] py-3 bg-sage-500 text-white rounded-xl text-sm font-medium hover:bg-sage-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {saving
                    ? (heroImageBase64 && dropboxStatus === "connected" ? "Saving image…" : "Saving…")
                    : isEditMode ? "Save Changes" : "Save Recipe"}
                </motion.button>
              </div>
            ) : (
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
