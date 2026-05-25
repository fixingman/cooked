# Bug Tracker

Active bugs only. Resolved bugs kept for reference with their fix summary.

---

## Open

### BUG-001 — Import: prep/cook time shows 0 min

**Site:** thermomix-recipes.net  
**Status:** Fix shipped v0.15.5, pending confirmation — page returns 403 to server

**Root cause:** `parseDuration` matched months-`M` before `T` separator instead of minutes-`M` after it. Full-form `P0Y0M0DT0H10M0.000S` gave 0 minutes.  
**Fix:** Rewrote `parseDuration` to split on `T` first. Also merges Claude's inferred times when JSON-LD has zeros (v0.15.5).

**File:** `src/lib/parseJsonLd.ts` → `parseDuration`

---

### BUG-002 — Import: 0 steps from JSON-LD (0-step sites)

**Status:** Fix shipped v0.15.4–v0.15.5, pending confirmation

**Root cause A:** thermomix-recipes.net uses `name` instead of `text` on HowToStep. **Fix:** `parseSteps` falls back to `obj.name`.  
**Root cause B:** Cookidoo-style client-rendered steps — JSON-LD has metadata but empty `recipeInstructions`. **Fix:** Claude extraction for steps + time merge.

---

### BUG-003 — "Macros unavailable" on thermomix-recipes.net

**Status:** Fix shipped v0.15.7, pending confirmation

**Root cause:** Netlify 10s timeout killed parallel AI calls.  
**Fix:** `maxDuration = 30` on all AI routes.

---

### BUG-008 — Recipe card shows stock thumbnail but detail shows correct image

**Status:** Fix shipped v0.15.11, pending confirmation

**Symptom:** Two recipe cards show Unsplash stock photos. Tapping through to the recipe shows the correct original photo in the hero. "Recipe Images → Image Quality" says "All recipe images look good."

**Root cause:** Before v0.15.9, `"unknown"` HEAD quality (CDN blocking HEAD requests) triggered Unsplash replacement. Affected recipes ended up with `heroImageUrl = unsplash URL` + `heroImageDropboxPath = original`. The detail page uses `dropboxImage ?? heroImageUrl` so it correctly shows the Dropbox original. The card only used `heroImageUrl` — the Unsplash stock.

The `needsRefresh` check only flags `imageQuality === "low"` — `imageSource === "ai-found"` recipes were never flagged, so the scan reported "All images look good" even though the card URLs were wrong.

**Fixes (v0.15.11):**
- `RecipeCard`: calls `useDropboxImage` only when `imageSource === "ai-found" && heroImageDropboxPath` exists — targeted, only fires for affected recipes, cached 4h.
- `needsRefresh`: now also flags `ai-found + heroImageDropboxPath` recipes so the Settings scan offers to restore them.
- Root cause already prevented in v0.15.9 (unknown quality keeps original URL).

**Files:** `src/components/recipes/RecipeCard.tsx`, `src/components/settings/ImageRefreshSection.tsx`

---

## Resolved

### BUG-004 ✅ v0.15.7–v0.15.8 — Thermomix cooking mode never appears
H1 (empty steps) fixed v0.15.4. H3 (Netlify 10s timeout) fixed v0.15.7. H6 (catch→null masked timeouts as "not suitable") fixed v0.15.8.

### BUG-005 ✅ v0.15.7 — Settings Thermomix enrichment: "No recipes could be adapted"
Netlify 10s timeout. Fixed: `maxDuration = 30`, client 28s timeout, error feedback split.

### BUG-006 ✅ v0.15.7 — Back button: cook mode stuck in history
`<Link>` push vs `router.back()`. Fixed: exit button uses `router.back()`.

### BUG-007 ✅ v0.15.8 — Thermomix enrichment: "Steps not suitable" for genuine TM recipes
Error masking (catch→null→422 looked like "not suitable"). Fixed: throws on error, 500 vs 422, timeout 24s, max_tokens 2048, prompt clarified.

### BUG-009 ✅ v0.15.12 — CompletionScreen buttons push cook mode onto history
"Browse More" and "View Recipe" used `<Link>` (pushes history). Back after "View Recipe" returned to cook mode. Fixed: both buttons use `router.replace()`. `src/components/cooking/CompletionScreen.tsx`
