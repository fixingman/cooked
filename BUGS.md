# Bug Tracker

Active bugs only. Resolved bugs kept for reference with their fix summary.

---

## Open

### BUG-003 — "Macros unavailable" on thermomix-recipes.net

**Status:** Fix shipped v0.16.2 (deferred TM enrichment), pending confirmation

**Root cause:** Thermomix 24s timeout consumed the 26s Netlify budget, killing nutrition silently. Earlier partial fix (v0.16.0) reduced TM timeout to 18s but TM still ran in-route. Full fix in v0.16.2 defers TM entirely to client post-save.

**Files:** `src/app/api/recipes/import/route.ts`, `src/components/recipes/ImportRecipeModal.tsx`

---

### BUG-008 — Recipe card shows stock thumbnail, detail shows correct image

**Status:** Fix shipped v0.15.11, pending confirmation

**Symptom:** Recipe cards show Unsplash stock photos; tapping through shows the correct original in the hero. "Image Quality" scan reports "All images look good."

**Root cause:** Before v0.15.9, `"unknown"` HEAD quality triggered Unsplash replacement — `heroImageUrl` was overwritten with stock URL while `heroImageDropboxPath` kept the original. Card used `heroImageUrl` only. `needsRefresh` only checked `imageQuality === "low"` so `ai-found` recipes were never flagged.

**Fixes (v0.15.11):** `RecipeCard` calls `useDropboxImage` for `ai-found + dropboxPath` recipes. `needsRefresh` now also flags them. Root cause prevented in v0.15.9.

**Files:** `src/components/recipes/RecipeCard.tsx`, `src/components/settings/ImageRefreshSection.tsx`

---

## Resolved

### BUG-001 ✅ v0.16.0 — Import: prep/cook time shows 0 min
JSON-LD-with-steps hit early return in import route; Claude time-merge only ran in the 0-step path. Fixed: `estimateTimeSplit()` added to `finalise()` parallel calls; falls back to `totalTimeMinutes` as `cookTimeMinutes`. `src/lib/recipeEnrichment.ts`, `src/app/api/recipes/import/route.ts`

### BUG-002 ✅ v0.15.4–v0.15.5 — Import: 0 steps
JSON-LD `recipeInstructions` absent on JS-rendered sites. Fixed: Claude full-page extraction fallback for 0-step JSON-LD.

### BUG-004 ✅ v0.15.7–v0.15.8 — Thermomix cooking mode never appears
Empty steps (H1) fixed v0.15.4. Netlify 10s timeout (H3) fixed v0.15.7. catch→null masked timeouts as "not suitable" (H6) fixed v0.15.8.

### BUG-005 ✅ v0.15.7 — Settings Thermomix enrichment: "No recipes could be adapted"
Netlify 10s timeout. Fixed: `maxDuration = 30`, client 28s timeout, error feedback split.

### BUG-006 ✅ v0.15.7 — Back button: cook mode stuck in history
`<Link>` push vs `router.back()`. Fixed: exit button uses `router.back()`.

### BUG-007 ✅ v0.15.8 — Thermomix enrichment: "Steps not suitable" for genuine TM recipes
Error masking (catch→null→422 looked like "not suitable"). Fixed: throws on error, 500 vs 422, timeout 24s, max_tokens 2048, prompt clarified.

### BUG-009 ✅ v0.15.12 — CompletionScreen buttons push cook mode onto history
`<Link>` push meant back after "View Recipe" returned to cook mode. Fixed: both buttons use `router.replace()`. `src/components/cooking/CompletionScreen.tsx`

### BUG-010 ✅ v0.16.0 — Low-res image not replaced when CDN omits content-length
HEAD request with no `content-length` caused `checkImageQuality` to return "ok" for undersized files. Fixed: Range GET fallback (`bytes=0-34999`) reads `content-range` total to determine actual size. `src/lib/imageUtils.ts`
