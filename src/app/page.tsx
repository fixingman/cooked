"use client";
import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { TimeGreeting } from "@/components/home/TimeGreeting";
import { AIPromptBar } from "@/components/home/AIPromptBar";
import { PantryWidget } from "@/components/home/PantryWidget";
import { ForYouSection } from "@/components/home/ForYouSection";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { MealTimeSection } from "@/components/home/MealTimeSection";
import { ContinueCooking } from "@/components/home/ContinueCooking";
import { GettingStartedSection } from "@/components/home/GettingStartedSection";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { usePantry } from "@/hooks/usePantry";
import { useSettings } from "@/hooks/useSettings";
import { rankRecipes, hasEnoughSignal, pantryMatchCount } from "@/lib/rankRecipes";
import { normalizeForMatch } from "@/lib/ingredientUtils";
import type { RankSignals } from "@/lib/rankRecipes";
import type { MealTime } from "@/types/recipe";

function BookmarkletHandler({ onOpen }: { onOpen: (url: string, text?: string) => void }) {
  useEffect(() => {
    const hash = window.location.hash;
    console.log('[Cooked BM] hash on load:', hash.slice(0, 120));
    if (!hash.startsWith('#bm?')) return;
    const params = new URLSearchParams(hash.slice(4));
    const url = params.get('url') ?? '';
    const text = params.get('text') ?? '';
    console.log('[Cooked BM] parsed', { urlLen: url.length, textLen: text.length, textPreview: text.slice(0, 80) });
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    onOpen(url, text || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ShareHandler({ onOpen }: { onOpen: (url: string) => void }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareUrl = params.get("share_url");
    if (!shareUrl?.startsWith("http")) return;
    window.history.replaceState(null, '', window.location.pathname);
    onOpen(shareUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function getCurrentMeal(): { mealTime: MealTime; label: string; heroLabel: string } {
  const hour = new Date().getHours();
  if (hour < 11) return { mealTime: "breakfast", label: "For Breakfast", heroLabel: "This Morning's Pick" };
  if (hour < 17) return { mealTime: "lunch",     label: "For Lunch",     heroLabel: "Lunchtime Pick" };
  return                { mealTime: "dinner",     label: "For Dinner",    heroLabel: "Tonight's Pick" };
}

function getSecondaryMeal(primary: MealTime): { mealTime: MealTime; label: string } {
  if (primary === "dinner") return { mealTime: "breakfast", label: "For Breakfast" };
  return { mealTime: "dinner", label: "For Dinner" };
}

export default function HomePage() {
  const [bookmarkletImport, setBookmarkletImport] = useState<{ open: boolean; url: string; text?: string }>({ open: false, url: "" });
  const [shareImport, setShareImport] = useState<{ open: boolean; url: string }>({ open: false, url: "" });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const aiPromptRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { recipes: userRecipes } = useUserRecipes();
  const { favouriteIds } = useFavourites();
  const { states, hasCooked } = useRecipeStates();
  const { items: pantryItems } = usePantry();
  const { settings } = useSettings();

  // Silent dietary filter — applied before any carousel sees the recipe list.
  const allRecipes = useMemo(() => {
    const prefs = settings.dietaryPreferences;
    const base = [...userRecipes];
    if (!prefs.length) return base;
    return base.filter(r => prefs.every(d => r.dietaryTags.includes(d)));
  }, [userRecipes, settings.dietaryPreferences]);
  const isSparse = allRecipes.length < 5;

  // Deferred to after mount — server and client clocks can differ, causing hydration mismatch.
  const primary = useMemo(
    () => mounted ? getCurrentMeal() : { mealTime: "dinner" as MealTime, label: "For Dinner", heroLabel: "Tonight's Pick" },
    [mounted]
  );
  const secondary = useMemo(() => getSecondaryMeal(primary.mealTime), [primary.mealTime]);

  const pantryNames = useMemo(
    () => new Set(pantryItems.map(i => normalizeForMatch(i.name))),
    [pantryItems]
  );

  const signals: RankSignals = useMemo(
    () => ({ pantryNames, favouriteIds: new Set(favouriteIds), states }),
    [pantryNames, favouriteIds, states]
  );

  // All carousels computed in priority order, each excluding already-placed recipes.
  // ContinueCooking is history-based and exempt from dedup.
  const carousels = useMemo(() => {
    const used = new Set<string>();

    // 1. Featured hero — top-ranked for current meal time, falls back to overall top
    const mealMatches = rankRecipes(
      allRecipes.filter(r => r.mealTimes.includes(primary.mealTime)),
      signals
    );
    const featured = mealMatches[0] ?? rankRecipes(allRecipes, signals)[0] ?? null;
    if (featured) used.add(featured.id);

    // 2. In Your List (wantToCook)
    const wantToCookIds = new Set(states.filter(s => s.wantToCook).map(s => s.recipeId));
    const wantToCook = rankRecipes(
      allRecipes.filter(r => !used.has(r.id) && wantToCookIds.has(r.id)),
      signals
    );
    wantToCook.forEach(r => used.add(r.id));

    // 3. Primary meal-time carousel — most contextually relevant, takes priority over pantry
    const primaryRecipes = rankRecipes(
      allRecipes.filter(r => !used.has(r.id) && r.mealTimes.includes(primary.mealTime)),
      signals
    );
    primaryRecipes.forEach(r => used.add(r.id));

    // 4. Ready to Cook — high pantry match ratio (≥40%, ≥2 ingredients matched)
    const readyToCook = pantryNames.size >= 3
      ? rankRecipes(
          allRecipes.filter(r => {
            if (used.has(r.id) || r.ingredients.length === 0) return false;
            const matched = pantryMatchCount(r, pantryNames);
            return matched >= 2 && matched / r.ingredients.length >= 0.4;
          }),
          signals
        ).slice(0, 8)
      : [];
    readyToCook.forEach(r => used.add(r.id));

    // 5. From Your Favourites (untried)
    const untriedFavourites = rankRecipes(
      allRecipes.filter(r => !used.has(r.id) && favouriteIds.includes(r.id) && !hasCooked(r.id)),
      signals
    );
    untriedFavourites.forEach(r => used.add(r.id));

    // 6. Secondary meal-time carousel
    const secondaryRecipes = rankRecipes(
      allRecipes.filter(r => !used.has(r.id) && r.mealTimes.includes(secondary.mealTime)),
      signals
    );
    secondaryRecipes.forEach(r => used.add(r.id));

    // 7. For You — ranked leftovers, excluding recently cooked
    const forYou = hasEnoughSignal(signals)
      ? (() => {
          const threeDaysAgo = Date.now() - 3 * 86_400_000;
          return rankRecipes(
            allRecipes.filter(r => {
              if (used.has(r.id)) return false;
              const state = signals.states.find(s => s.recipeId === r.id);
              if (!state?.cookedAt?.length) return true;
              return new Date(state.cookedAt[state.cookedAt.length - 1]).getTime() < threeDaysAgo;
            }),
            signals
          ).slice(0, 8);
        })()
      : [];

    return { featured, readyToCook, wantToCook, primaryRecipes, untriedFavourites, secondaryRecipes, forYou };
  }, [allRecipes, primary.mealTime, secondary.mealTime, signals, pantryNames, favouriteIds, hasCooked, states]);

  function handleInspire() {
    aiPromptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    (aiPromptRef.current?.querySelector("input, textarea, button") as HTMLElement | null)?.focus?.();
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-6xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <BookmarkletHandler onOpen={(url, text) => setBookmarkletImport({ open: true, url, text })} />
        <ShareHandler onOpen={(url) => setShareImport({ open: true, url })} />
      </Suspense>
      <TimeGreeting />
      <div ref={aiPromptRef}>
        <AIPromptBar />
      </div>
      {mounted && isSparse && (
        <GettingStartedSection
          onImport={() => setImportModalOpen(true)}
          onInspire={handleInspire}
        />
      )}
      {mounted && carousels.featured && (
        <FeaturedHero recipe={carousels.featured} label={primary.heroLabel} />
      )}
      <div className={mounted && carousels.featured ? "-mt-4" : ""}>
        <PantryWidget />
      </div>
      {mounted && !isSparse && (
        <>
          <MealTimeSection
            recipes={carousels.wantToCook}
            label="In Your List"
            seeAllHref="/recipes?category=want-to-cook"
            illustration="/illustrations/whisk.svg?v=2"
          />
          <MealTimeSection recipes={carousels.primaryRecipes} label={primary.label} mealTime={primary.mealTime} illustration="/illustrations/frying_pan.svg?v=2" />
          <MealTimeSection
            recipes={carousels.readyToCook}
            label="Ready to Cook"
            pantryNames={pantryNames}
            illustration="/illustrations/garlic.svg?v=2"
          />
          <ContinueCooking />
          <MealTimeSection
            recipes={carousels.untriedFavourites}
            label="From Your Favourites"
            seeAllHref="/recipes"
            illustration="/illustrations/fork_spoon.svg?v=2"
          />
          <MealTimeSection recipes={carousels.secondaryRecipes} label={secondary.label} mealTime={secondary.mealTime} illustration="/illustrations/mortar.svg?v=2" />
          {carousels.forYou.length >= 2 && (
            <ForYouSection recipes={carousels.forYou} pantryNames={pantryNames} />
          )}
        </>
      )}
      <div className="h-4" />
      <AnimatePresence>
        {importModalOpen && (
          <ImportRecipeModal
            initialMode="url"
            onClose={() => setImportModalOpen(false)}
          />
        )}
        {bookmarkletImport.open && (
          <ImportRecipeModal
            initialMode="text"
            initialPasteUrl={bookmarkletImport.url}
            initialPasteText={bookmarkletImport.text}
            onClose={() => setBookmarkletImport({ open: false, url: "" })}
          />
        )}
        {shareImport.open && (
          <ImportRecipeModal
            initialMode="url"
            initialPasteUrl={shareImport.url}
            autoImport
            onClose={() => setShareImport({ open: false, url: "" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
