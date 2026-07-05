# Bug Archive

Resolved bugs moved here from `BUGS.md`. Ordered newest fix first.

---

### BUG-014 ✅ v0.29.1 — Homepage greeting hydration mismatch (server time ≠ client time)

**Symptom:** React errors #425 + #422 (recoverable text-content hydration mismatch) on `/`. Greeting could visibly flip on first paint.

**Root cause (surface):** `TimeGreeting` reads `new Date()` at render time. Server renders with UTC clock (Netlify), client hydrates with local clock → different hour bucket → text mismatch.

**Root cause (deeper):** Module-level seed in `useUserRecipes.ts` runs synchronously before React's `useState` initializer, writing 12 starters to localStorage. Server → 0 recipes → `GettingStartedSection`; client initial render → 12 recipes → `FeaturedHero`. React compared adjacent `<p>` elements positionally and reported structural mismatch.

**Fix:** Three-pronged:
1. `TimeGreeting` — render `" "` until `mounted` (no SSR clock read)
2. `page.tsx` — `getCurrentMeal()` deferred to `useMemo([mounted])`
3. `page.tsx` — `isSparse`, `carousels.featured`, `FeaturedHero`, and all carousel sections gated on `mounted`

**Verified:** `npm run smoke` → 0 hydration warnings on `/`.

**Files:** `src/components/home/TimeGreeting.tsx`, `src/app/page.tsx`

---

### BUG-013 ✅ v0.27.2 — Homepage carousel thumbnails appear blurry / low-res on load

**Symptom:** Recipe card thumbnails on the homepage carousels appeared blurry on initial load. After tapping through to a recipe and navigating back, that card's thumbnail became sharp.

**Root cause (1 — wrong `sizes`):** Carousel cards used `sizes="160px"` (their mobile width), but the desktop 4-col grid renders them at ~270px. The browser selected a ~320w candidate from the next/image srcset when a retina 270px card needs ~540w → upscaled ≈1.7× → blurry. Visiting the recipe detail loaded a large variant of the same URL; on back-navigation the browser swapped in the larger cached candidate — explaining the "sharp after interacting" behaviour exactly.

**Root cause (2 — BUG-008 recurring on home):** `MealTimeSection`, `ForYouSection`, `FeaturedHero`, and `ContinueCooking` rendered raw `heroImageUrl` and never loaded the Dropbox original, so genuinely low-res or expired external URLs were shown even when a full-quality Dropbox copy existed.

**Contributing factor:** The v0.27.1 `transition-transform` zoom wrapper promoted card images to a GPU compositing layer, rasterising the low-res image and amplifying the blur. Removed in commit `21d6e8f`.

**Fix:** `sizes="(max-width: 768px) 160px, 270px"` on carousel cards · `FoodImage` gains an optional `dropboxPath` prop that resolves via `useDropboxImage` and prefers the Dropbox copy (error state resets when the source swaps in); all four home components pass `heroImageDropboxPath`.

**Files:** `src/components/ui/FoodImage.tsx`, `src/components/home/MealTimeSection.tsx`, `src/components/home/ForYouSection.tsx`, `src/components/home/FeaturedHero.tsx`, `src/components/home/ContinueCooking.tsx`

---

### BUG-011 ✅ v0.19.7 — AI-generated recipe not saved, navigates to 404

**Symptom:** After saving an AI-generated recipe via the ImportRecipeModal, the app navigated to a 404 page and the recipe did not appear in the recipe list.

**Root cause (1 — data loss):** `useDropboxSync.setValue` wrote to `localStorage` inside the `setValueState` updater function. In React 18 concurrent mode, when the calling component unmounts before React processes the batched state update (which happened here because `onSave` triggered `setGeneratedRecipe(null)` → modal unmounts), React skips the updater entirely. The `localStorage.setItem` never ran, so the recipe was not persisted.

**Root cause (2 — double navigation):** `handleSave` in `ImportRecipeModal` called `router.push` unconditionally at the end. The AIPromptBar's `onSave` callback also called `router.push` to the same URL. The double push caused a second navigation cycle that could hit the recipe page before the first navigation's state settled.

**Fix:** `useDropboxSync.setValue` now computes the new value and writes to `localStorage` synchronously (before `setValueState`), so the write is guaranteed regardless of whether React processes the state update. `handleSave` now only calls `router.push` when no `onSave` handler is provided — callers with `onSave` are responsible for navigation.

**Files:** `src/hooks/useDropboxSync.ts`, `src/components/recipes/ImportRecipeModal.tsx`

---

### BUG-008 ✅ v0.19.14 — Recipe card shows stock thumbnail, detail shows correct image

**Symptom:** Recipe cards show Unsplash stock photos; tapping through shows the correct original in the hero.

**Root cause (original):** Before v0.15.9, `"unknown"` HEAD quality triggered Unsplash replacement — `heroImageUrl` was overwritten with stock URL while `heroImageDropboxPath` kept the original. Card used `heroImageUrl` only.

**Root cause (recurring, v0.19.14):** `RecipeCard` only called `useDropboxImage` when `imageSource === "ai-found"`. URL-imported (`scraped`) recipes with a `heroImageDropboxPath` used `heroImageUrl` directly — if that external URL expired or was blocked, `FoodImage.onError` fired and showed the hardcoded stock fallback. `RecipeHero` called `useDropboxImage` for all recipes, so the detail page always showed the Dropbox copy correctly.

**Fix:** `RecipeCard` now calls `useDropboxImage(recipe.heroImageDropboxPath)` unconditionally, mirroring `RecipeHero`.

**Files:** `src/components/recipes/RecipeCard.tsx`

---

### BUG-010 ✅ v0.16.0 — Low-res image not replaced when CDN omits content-length
HEAD request with no `content-length` caused `checkImageQuality` to return "ok" for undersized files. Fixed: Range GET fallback (`bytes=0-34999`) reads `content-range` total to determine actual size. `src/lib/imageUtils.ts`

---

### BUG-003 ✅ v0.16.2 — "Macros unavailable" on thermomix-recipes.net
Thermomix 24s timeout consumed the 26s Netlify budget, killing nutrition silently. Fixed: deferred TM enrichment to client post-save. `src/app/api/recipes/import/route.ts`, `src/components/recipes/ImportRecipeModal.tsx`

---

### BUG-001 ✅ v0.16.0 — Import: prep/cook time shows 0 min
JSON-LD-with-steps hit early return in import route; Claude time-merge only ran in the 0-step path. Fixed: `estimateTimeSplit()` added to `finalise()` parallel calls; falls back to `totalTimeMinutes` as `cookTimeMinutes`. `src/lib/recipeEnrichment.ts`, `src/app/api/recipes/import/route.ts`

---

### BUG-002 ✅ v0.15.4–v0.15.5 — Import: 0 steps
JSON-LD `recipeInstructions` absent on JS-rendered sites. Fixed: Claude full-page extraction fallback for 0-step JSON-LD.

---

### BUG-009 ✅ v0.15.12 — CompletionScreen buttons push cook mode onto history
`<Link>` push meant back after "View Recipe" returned to cook mode. Fixed: both buttons use `router.replace()`. `src/components/cooking/CompletionScreen.tsx`

---

### BUG-007 ✅ v0.15.8 — Thermomix enrichment: "Steps not suitable" for genuine TM recipes
Error masking (catch→null→422 looked like "not suitable"). Fixed: throws on error, 500 vs 422, timeout 24s, max_tokens 2048, prompt clarified.

---

### BUG-004 ✅ v0.15.7–v0.15.8 — Thermomix cooking mode never appears
Empty steps (H1) fixed v0.15.4. Netlify 10s timeout (H3) fixed v0.15.7. catch→null masked timeouts as "not suitable" (H6) fixed v0.15.8.

---

### BUG-005 ✅ v0.15.7 — Settings Thermomix enrichment: "No recipes could be adapted"
Netlify 10s timeout. Fixed: `maxDuration = 30`, client 28s timeout, error feedback split.

---

### BUG-006 ✅ v0.15.7 — Back button: cook mode stuck in history
`<Link>` push vs `router.back()`. Fixed: exit button uses `router.back()`.
