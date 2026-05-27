"use client";
import React from "react";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Clock, Users, BarChart2, Star, CheckCircle, X, ShoppingBasket, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RecipeHero } from "@/components/recipe-detail/RecipeHero";
import { ImagePickerModal } from "@/components/recipe-detail/ImagePickerModal";
import { ServingsAdjuster } from "@/components/recipe-detail/ServingsAdjuster";
import { IngredientList } from "@/components/recipe-detail/IngredientList";
import { InstructionSteps } from "@/components/recipe-detail/InstructionSteps";
import { StartCookingButton } from "@/components/recipe-detail/StartCookingButton";
import { NutritionPanel } from "@/components/recipe-detail/NutritionPanel";
import { CookedStatus } from "@/components/recipe-detail/CookedStatus";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { Badge } from "@/components/ui/Badge";
import { useServingsScale } from "@/hooks/useServingsScale";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useCookingHistory } from "@/hooks/useCookingHistory";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxImage } from "@/hooks/useDropboxImage";
import { usePantry } from "@/hooks/usePantry";
import { PantryModal } from "@/components/pantry/PantryModal";
import { getRecipe } from "@/lib/recipes";
import { formatMinutes } from "@/lib/formatTime";
import { normalizeForMatch, cleanForPantry } from "@/lib/ingredientUtils";
import type { Recipe } from "@/types/recipe";

interface PageProps {
  params: { slug: string };
}

export default function RecipeDetailPage({ params }: PageProps) {
  const { slug } = params;
  const builtIn = getRecipe(slug);
  const isUserSlug = slug.startsWith("user-");

  // For user recipes: undefined = still loading, null = not found
  const [userRecipe, setUserRecipe] = useState<Recipe | null | undefined>(
    isUserSlug ? undefined : null
  );

  useEffect(() => {
    if (!isUserSlug) return;
    try {
      const stored = localStorage.getItem("cooked-user-recipes");
      const found = stored
        ? (JSON.parse(stored) as Recipe[]).find(r => r.slug === slug) ?? null
        : null;
      setUserRecipe(found);
    } catch {
      setUserRecipe(null);
    }
  }, [isUserSlug, slug]);

  // Still waiting for user recipe lookup
  if (isUserSlug && userRecipe === undefined) {
    return <RecipeDetailSkeleton />;
  }

  const recipe = builtIn ?? userRecipe;
  if (!recipe) notFound();

  return <RecipeDetailClient recipe={recipe} isUserRecipe={isUserSlug} />;
}

function RecipeDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[55vw] max-h-[480px] min-h-[260px] bg-parchment-200" />
      <div className="px-4 md:px-6 pb-6 max-w-2xl mx-auto pt-6 space-y-4">
        <div className="h-4 bg-parchment-200 rounded-full w-2/3" />
        <div className="h-4 bg-parchment-200 rounded-full w-1/2" />
        <div className="h-20 bg-parchment-200 rounded-xl" />
      </div>
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <div className="py-5 border-b border-parchment-300">
      <div className="h-3 w-36 bg-parchment-200 rounded-full animate-pulse mb-3" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-[68px] bg-parchment-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function RecipeDetailClient({ recipe: initialRecipe, isUserRecipe }: { recipe: Recipe; isUserRecipe: boolean }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [showEdit, setShowEdit] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Enrichment pending state — initialised from sessionStorage flag set by ImportRecipeModal
  const [enriching, setEnriching] = useState(() => {
    if (!isUserRecipe || typeof window === "undefined") return false;
    try { return !!sessionStorage.getItem(`cooked-enriching-${initialRecipe.id}`); } catch { return false; }
  });

  // Subscribe to background enrichment updates from useUserRecipes.updateRecipe
  useEffect(() => {
    if (!isUserRecipe) return;
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      if (id !== initialRecipe.id) return;
      try {
        const stored = localStorage.getItem("cooked-user-recipes");
        const updated = stored ? (JSON.parse(stored) as Recipe[]).find(r => r.id === id) : null;
        if (!updated) return;
        setRecipe(updated);
        const nutritionDone = !!(updated.calories || updated.protein);
        const tmDone = updated.thermomixAvailable || updated.steps.length === 0;
        if (nutritionDone && tmDone) {
          setEnriching(false);
          try { sessionStorage.removeItem(`cooked-enriching-${id}`); } catch {}
        }
      } catch {}
    };
    window.addEventListener("cooked:recipe-updated", handler);
    return () => window.removeEventListener("cooked:recipe-updated", handler);
  }, [isUserRecipe, initialRecipe.id]);

  // Fallback: clear skeletons after 90s in case enrichment silently failed
  useEffect(() => {
    if (!enriching) return;
    const t = setTimeout(() => {
      setEnriching(false);
      try { sessionStorage.removeItem(`cooked-enriching-${initialRecipe.id}`); } catch {}
    }, 90_000);
    return () => clearTimeout(t);
  }, [enriching, initialRecipe.id]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { removeRecipe } = useUserRecipes();
  const { addEntry, deleteLastEntry, deleteRecipeHistory } = useCookingHistory();
  const { deleteState, markCooked, unmarkCooked, hasCooked, getState } = useRecipeStates();
  const { servings, scale, increment, decrement } = useServingsScale(recipe.servings);
  const { items: pantryItems, addItem: addToPantry } = usePantry();
  const dropboxImage = useDropboxImage(recipe.heroImageDropboxPath);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [showAddToPantry, setShowAddToPantry] = useState(false);

  const cooked = hasCooked(recipe.id);
  const state = getState(recipe.id);
  const cookCount = state?.cookedAt?.length ?? 0;
  const personalRating = state?.rating ?? 0;
  const markingRef = useRef(false);

  function handleMarkCooked() {
    if (markingRef.current) return;
    markingRef.current = true;
    setTimeout(() => { markingRef.current = false; }, 1000);
    const cookedAt = new Date().toISOString();
    markCooked(recipe.id, cookedAt);
    addEntry({ recipeId: recipe.id, cookedAt });
  }

  function handleDelete() {
    removeRecipe(recipe.id);
    deleteRecipeHistory(recipe.id);
    deleteState(recipe.id);
    router.push("/recipes");
  }

  return (
    <div className="relative">
      <RecipeHero
        recipe={recipe}
        onEdit={isUserRecipe ? () => setShowEdit(true) : undefined}
        onDelete={isUserRecipe ? () => setShowDeleteConfirm(true) : undefined}
        onChangeImage={isUserRecipe ? () => setShowImagePicker(true) : undefined}
      />

      {/* Content */}
      <div className="px-4 md:px-6 pb-6 max-w-2xl mx-auto">
        <AttributionRow recipe={recipe} />
        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-parchment-300">
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <Clock size={14} className="text-ink-400" />
            <span className="text-ink-400">Prep</span>
            <span className="font-medium">{formatMinutes(recipe.prepTimeMinutes)}</span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-400">Cook</span>
            <span className="font-medium">{formatMinutes(recipe.cookTimeMinutes)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <Users size={14} className="text-ink-400" />
            <span>Serves {recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <BarChart2 size={14} className="text-ink-400" />
            <Badge label={recipe.difficulty} variant="difficulty" />
          </div>
          {recipe.rating > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star size={13} className="text-saffron-500" fill="currentColor" />
              <span className="font-medium text-ink-700">{recipe.rating}</span>
              {recipe.reviewCount > 0 && (
                <span className="text-ink-400">({recipe.reviewCount.toLocaleString()})</span>
              )}
            </div>
          )}
          {/* Cooked CTA */}
          {cooked ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-sm group"
            >
              <CheckCircle size={13} className="text-sage-500 shrink-0" fill="currentColor" strokeWidth={0} />
              <span className="font-medium text-sage-700">
                Cooked {cookCount === 1 ? "once" : `${cookCount}×`}
              </span>
              {personalRating > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: personalRating }).map((_, i) => (
                    <Star key={i} size={10} className="text-saffron-500" fill="currentColor" />
                  ))}
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { unmarkCooked(recipe.id); deleteLastEntry(recipe.id); }}
                title="Remove last cook"
                aria-label="Remove last cook"
                className="w-4 h-4 rounded-full bg-ink-200 hover:bg-red-100 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={9} className="text-ink-500 hover:text-red-500" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkCooked}
              title="Mark this recipe as cooked"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-sage-600 transition-colors group"
            >
              <CheckCircle size={13} className="group-hover:text-sage-500 transition-colors" />
              <span>Mark as cooked</span>
            </motion.button>
          )}
        </div>

        {/* Description */}
        <div className="py-5 border-b border-parchment-300">
          <p className="font-serif text-ink-700 leading-relaxed text-[1.05rem]">{recipe.description}</p>
        </div>

        {enriching && !recipe.calories && !recipe.protein
          ? <NutritionSkeleton />
          : <NutritionPanel recipe={recipe} />
        }

        {/* Servings */}
        <div className="py-5 border-b border-parchment-300">
          <ServingsAdjuster servings={servings} onIncrement={increment} onDecrement={decrement} />
        </div>

        {/* Ingredients */}
        <div className="py-5 border-b border-parchment-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-ink-900">Ingredients</h2>
            <button
              onClick={() => setShowAddToPantry(v => !v)}
              className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors"
            >
              <ShoppingBasket size={14} />
              <span>Add to pantry</span>
              {showAddToPantry ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <AnimatePresence>
            {showAddToPantry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-4"
              >
                <AddToPantryPanel
                  ingredients={recipe.ingredients.map(i => i.name)}
                  pantryItems={pantryItems}
                  onAdd={addToPantry}
                  onOpenPantry={() => { setShowAddToPantry(false); setPantryOpen(true); }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <IngredientList
            ingredients={recipe.ingredients}
            scale={scale}
            pantryNames={new Set(pantryItems.map(i => normalizeForMatch(i.name)))}
          />
        </div>

        {/* Method */}
        <div className="py-5 border-b border-parchment-300">
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-5">Method</h2>
          <InstructionSteps steps={recipe.steps} />
        </div>

        {/* Thermomix enrichment pending */}
        {enriching && !recipe.thermomixAvailable && recipe.steps.length > 0 && (
          <div className="flex items-center gap-2 py-3 text-xs text-ink-400 border-b border-parchment-300">
            <Loader2 size={12} className="animate-spin shrink-0" />
            Preparing Thermomix steps…
          </div>
        )}

        {/* Chef notes */}
        {recipe.chefNotes && (
          <div className="py-5 bg-saffron-300/15 rounded-card px-4 mt-2 mb-4">
            <p className="text-label uppercase tracking-widest text-saffron-600 mb-2">Chef&apos;s Notes</p>
            <p className="font-serif text-ink-700 text-sm leading-relaxed italic">{recipe.chefNotes}</p>
          </div>
        )}

        <CookedStatus recipeId={recipe.id} />

        <StartCookingButton slug={recipe.slug} thermomixAvailable={recipe.thermomixAvailable} />
      </div>

      {showEdit && (
        <ImportRecipeModal
          onClose={() => setShowEdit(false)}
          initialDraft={recipe}
          onSave={(updated) => setRecipe(updated)}
        />
      )}

      {showImagePicker && (
        <ImagePickerModal
          recipe={recipe}
          currentSrc={dropboxImage ?? recipe.heroImageUrl ?? null}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmSheet
          recipeTitle={recipe.title}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}

      <AnimatePresence>
        {pantryOpen && <PantryModal onClose={() => setPantryOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AddToPantryPanel({
  ingredients,
  pantryItems,
  onAdd,
  onOpenPantry,
}: {
  ingredients: string[];
  pantryItems: import("@/types/pantry").PantryItem[];
  onAdd: (name: string) => void;
  onOpenPantry: () => void;
}) {
  const normalizedPantry = new Set(pantryItems.map(i => normalizeForMatch(i.name)));
  // Only show items whose core ingredient isn't already in pantry
  const available = ingredients.filter(n => !normalizedPantry.has(normalizeForMatch(n)));
  const [selected, setSelected] = useState<Set<string>>(() => new Set(available));

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function handleAdd() {
    Array.from(selected).forEach(name => onAdd(cleanForPantry(name)));
    setSelected(new Set());
  }

  if (available.length === 0) {
    return (
      <div className="bg-parchment-200/60 rounded-xl p-3 flex items-center justify-between">
        <p className="text-sm text-ink-400">All ingredients are already in your pantry.</p>
        <button onClick={onOpenPantry} className="text-sm text-ink-500 hover:text-ink-800 transition-colors ml-3 shrink-0">
          View pantry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-parchment-200/60 rounded-xl p-3 space-y-2">
      <ul className="space-y-0.5 max-h-48 overflow-y-auto">
        {available.map(name => {
          const checked = selected.has(name);
          return (
            <li key={name}>
              <button
                onClick={() => toggle(name)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-parchment-300 transition-colors text-left"
              >
                <span className={[
                  "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  checked ? "bg-saffron-500 border-saffron-500" : "border-parchment-400 bg-parchment-100",
                ].join(" ")}>
                  {checked && <CheckCircle size={10} className="text-white" fill="currentColor" strokeWidth={0} />}
                </span>
                <span className="text-sm text-ink-800">{cleanForPantry(name)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2 pt-1">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          disabled={selected.size === 0}
          className="flex-1 py-2 bg-saffron-500 text-white rounded-xl text-sm font-medium hover:bg-saffron-600 disabled:opacity-40 transition-colors"
        >
          Add {selected.size > 0 ? `${selected.size} item${selected.size !== 1 ? "s" : ""}` : "to pantry"}
        </motion.button>
        <button
          onClick={onOpenPantry}
          className="px-3 py-2 text-sm text-ink-500 hover:text-ink-800 transition-colors"
        >
          View pantry
        </button>
      </div>
    </div>
  );
}

function AttributionRow({ recipe }: { recipe: Recipe }) {
  const { accountName } = useDropboxAuth();

  if (!recipe.sourceType) return null;

  let content: React.ReactNode = null;

  if (recipe.sourceType === "url" && recipe.sourceUrl) {
    let hostname = "";
    try { hostname = new URL(recipe.sourceUrl).hostname.replace(/^www\./, ""); } catch {}
    content = (
      <a
        href={recipe.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-ink-600 transition-colors"
      >
        From: {hostname}
      </a>
    );
  } else if (recipe.sourceType === "authored") {
    content = <>By {accountName ?? "Me"}</>;
  } else if (recipe.sourceType === "image") {
    content = <>Scanned from photo</>;
  } else if (recipe.sourceType === "builtin") {
    content = <>By {recipe.authorName}</>;
  }

  if (!content) return null;

  return (
    <p className="text-xs text-ink-400 pt-3 pb-1">
      {content}
    </p>
  );
}

function DeleteConfirmSheet({ recipeTitle, onCancel, onConfirm }: {
  recipeTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        key="sheet"
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 38 } }}
        exit={{ opacity: 0, y: "100%", transition: { duration: 0.2 } }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-parchment-100 rounded-t-[1.5rem] shadow-card-lg p-5 pb-8 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:w-full md:max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-5 md:hidden">
          <div className="w-10 h-1 bg-parchment-300 rounded-full" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-ink-900 mb-1">Delete this recipe?</h2>
        <p className="text-sm text-ink-500 mb-6">
          &ldquo;{recipeTitle}&rdquo; will be removed. This can&apos;t be undone.
        </p>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="flex-1 py-3 bg-parchment-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-parchment-300 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Delete Recipe
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
