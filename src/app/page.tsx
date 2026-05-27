"use client";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { TimeGreeting } from "@/components/home/TimeGreeting";
import { AIPromptBar } from "@/components/home/AIPromptBar";
import { PantryWidget } from "@/components/home/PantryWidget";
import { ForYouSection } from "@/components/home/ForYouSection";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { MealTimeSection } from "@/components/home/MealTimeSection";
import { ContinueCooking } from "@/components/home/ContinueCooking";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { usePantry } from "@/hooks/usePantry";
import { rankRecipes, hasEnoughSignal } from "@/lib/rankRecipes";
import { normalizeForMatch } from "@/lib/ingredientUtils";
import type { RankSignals } from "@/lib/rankRecipes";
import type { MealTime } from "@/types/recipe";

function BookmarkletHandler({ onOpen }: { onOpen: (url: string, text?: string) => void }) {
  const router = useRouter();
  useEffect(() => {
    // Read directly from window.location — avoids useSearchParams race with router.replace
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("import");
    const url = params.get("url") ?? "";
    const text = params.get("text") ?? "";
    const token = params.get("token") ?? "";
    if (mode !== "paste" && !token) return;
    router.replace("/");
    if (token) {
      fetch(`/api/bookmarklet/get?token=${encodeURIComponent(token)}`)
        .then(r => r.json())
        .then(d => onOpen(url, d.text ?? text))
        .catch(() => onOpen(url, text));
    } else {
      onOpen(url, text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function getCurrentMeal(): { mealTime: MealTime; label: string } {
  const hour = new Date().getHours();
  if (hour < 11) return { mealTime: "breakfast", label: "For Breakfast" };
  if (hour < 17) return { mealTime: "lunch",     label: "For Lunch" };
  return                { mealTime: "dinner",     label: "For Dinner" };
}

function getSecondaryMeal(primary: MealTime): { mealTime: MealTime; label: string } {
  if (primary === "dinner") return { mealTime: "breakfast", label: "For Breakfast" };
  return { mealTime: "dinner", label: "For Dinner" };
}

export default function HomePage() {
  const [bookmarkletImport, setBookmarkletImport] = useState<{ open: boolean; url: string; text?: string }>({ open: false, url: "" });
  const { recipes: userRecipes } = useUserRecipes();
  const { favouriteIds } = useFavourites();
  const { states, hasCooked } = useRecipeStates();
  const { items: pantryItems } = usePantry();

  const allRecipes = useMemo(() => [...userRecipes], [userRecipes]);

  const primary = getCurrentMeal();
  const secondary = getSecondaryMeal(primary.mealTime);

  const pantryNames = useMemo(
    () => new Set(pantryItems.map(i => normalizeForMatch(i.name))),
    [pantryItems]
  );

  const signals: RankSignals = useMemo(
    () => ({ pantryNames, favouriteIds: new Set(favouriteIds), states }),
    [pantryNames, favouriteIds, states]
  );

  // Featured hero — top-ranked recipe matching the current meal time;
  // falls back to top-ranked overall if no meal-time matches exist.
  const featuredRecipe = useMemo(() => {
    if (allRecipes.length === 0) return null;
    const mealMatches = rankRecipes(
      allRecipes.filter(r => r.mealTimes.includes(primary.mealTime)),
      signals
    );
    return mealMatches[0] ?? rankRecipes(allRecipes, signals)[0] ?? null;
  }, [allRecipes, primary.mealTime, signals]);

  // Meal-time carousels — ranked within filter, featured excluded to avoid repetition
  const primaryRecipes = useMemo(
    () => rankRecipes(
      allRecipes.filter(r => r.mealTimes.includes(primary.mealTime) && r.id !== featuredRecipe?.id),
      signals
    ),
    [allRecipes, primary.mealTime, featuredRecipe, signals]
  );
  const secondaryRecipes = useMemo(
    () => rankRecipes(
      allRecipes.filter(r => r.mealTimes.includes(secondary.mealTime)),
      signals
    ),
    [allRecipes, secondary.mealTime, signals]
  );

  const wantToCookRecipes = useMemo(() => {
    const ids = new Set(states.filter(s => s.wantToCook).map(s => s.recipeId));
    return rankRecipes(allRecipes.filter(r => ids.has(r.id)), signals);
  }, [allRecipes, states, signals]);

  const untriedFavourites = useMemo(
    () => rankRecipes(
      allRecipes.filter(r => favouriteIds.includes(r.id) && !hasCooked(r.id)),
      signals
    ),
    [allRecipes, favouriteIds, hasCooked, signals]
  );

  // "For You" — full ranked list minus recently cooked, shown at bottom
  const forYouRecipes = useMemo(() => {
    if (!hasEnoughSignal(signals)) return [];
    const threeDaysAgo = Date.now() - 3 * 86_400_000;
    const eligible = allRecipes.filter(r => {
      const state = signals.states.find(s => s.recipeId === r.id);
      if (!state?.cookedAt?.length) return true;
      const mostRecent = new Date(state.cookedAt[state.cookedAt.length - 1]).getTime();
      return mostRecent < threeDaysAgo;
    });
    return rankRecipes(eligible, signals).slice(0, 8);
  }, [allRecipes, signals]);

  return (
    <div className="px-4 py-6 md:px-8 max-w-6xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <BookmarkletHandler onOpen={(url, text) => setBookmarkletImport({ open: true, url, text })} />
      </Suspense>
      <TimeGreeting />
      <AIPromptBar />
      {featuredRecipe && <FeaturedHero recipe={featuredRecipe} />}
      <PantryWidget />
      <MealTimeSection
        recipes={wantToCookRecipes}
        label="In Your List"
        seeAllHref="/recipes?category=want-to-cook"
      />
      <MealTimeSection recipes={primaryRecipes} label={primary.label} mealTime={primary.mealTime} />
      <ContinueCooking />
      <MealTimeSection
        recipes={untriedFavourites}
        label="From Your Favourites"
        seeAllHref="/recipes"
      />
      <MealTimeSection recipes={secondaryRecipes} label={secondary.label} mealTime={secondary.mealTime} />
      {hasEnoughSignal(signals) && forYouRecipes.length >= 2 && (
        <ForYouSection recipes={forYouRecipes} pantryNames={pantryNames} />
      )}
      <div className="h-4" />
      <AnimatePresence>
        {bookmarkletImport.open && (
          <ImportRecipeModal
            initialMode="text"
            initialPasteUrl={bookmarkletImport.url}
            initialPasteText={bookmarkletImport.text}
            onClose={() => setBookmarkletImport({ open: false, url: "" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
