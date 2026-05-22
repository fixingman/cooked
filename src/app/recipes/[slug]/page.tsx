"use client";
import React from "react";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Users, BarChart2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RecipeHero } from "@/components/recipe-detail/RecipeHero";
import { ServingsAdjuster } from "@/components/recipe-detail/ServingsAdjuster";
import { IngredientList } from "@/components/recipe-detail/IngredientList";
import { InstructionSteps } from "@/components/recipe-detail/InstructionSteps";
import { StartCookingButton } from "@/components/recipe-detail/StartCookingButton";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { Badge } from "@/components/ui/Badge";
import { useServingsScale } from "@/hooks/useServingsScale";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useCookingHistory } from "@/hooks/useCookingHistory";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { getRecipe } from "@/lib/recipes";
import { formatMinutes } from "@/lib/formatTime";
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

function RecipeDetailClient({ recipe: initialRecipe, isUserRecipe }: { recipe: Recipe; isUserRecipe: boolean }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { removeRecipe } = useUserRecipes();
  const { deleteRecipeHistory } = useCookingHistory();
  const { deleteState } = useRecipeStates();
  const { servings, scale, increment, decrement } = useServingsScale(recipe.servings);

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
        </div>

        {/* Description */}
        <div className="py-5 border-b border-parchment-300">
          <p className="font-serif text-ink-700 leading-relaxed text-[1.05rem]">{recipe.description}</p>
        </div>

        {/* Servings */}
        <div className="py-5 border-b border-parchment-300">
          <ServingsAdjuster servings={servings} onIncrement={increment} onDecrement={decrement} />
        </div>

        {/* Ingredients */}
        <div className="py-5 border-b border-parchment-300">
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-4">Ingredients</h2>
          <IngredientList ingredients={recipe.ingredients} scale={scale} />
        </div>

        {/* Method */}
        <div className="py-5 border-b border-parchment-300">
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-5">Method</h2>
          <InstructionSteps steps={recipe.steps} />
        </div>

        {/* Chef notes */}
        {recipe.chefNotes && (
          <div className="py-5 bg-saffron-300/15 rounded-card px-4 mt-2 mb-4">
            <p className="text-label uppercase tracking-widest text-saffron-600 mb-2">Chef&apos;s Notes</p>
            <p className="font-serif text-ink-700 text-sm leading-relaxed italic">{recipe.chefNotes}</p>
          </div>
        )}

        <StartCookingButton slug={recipe.slug} thermomixAvailable={recipe.thermomixAvailable} />
      </div>

      {showEdit && (
        <ImportRecipeModal
          onClose={() => setShowEdit(false)}
          initialDraft={recipe}
          onSave={(updated) => setRecipe(updated)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmSheet
          recipeTitle={recipe.title}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
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
