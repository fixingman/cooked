# Bug Tracker

Active bugs only. Resolved bugs kept for reference with their fix summary.

---

## Open

### BUG-001 — Import: prep/cook time shows 0 min (only totalTime imported)

**Site:** thermomix-recipes.net  
**Status:** Fix shipped v0.16.0, pending confirmation

**Root cause (original):** `parseDuration` matched months-`M` before `T` separator. Fixed v0.15.5.  
**Root cause (new):** When JSON-LD has steps, the import hits the early-return at line 184 and goes straight to `finalise()`. The Claude time-merge at lines 196-199 only runs in the 0-step path — so prep/cook stay 0 even when totalTime is present.

**Fix (v0.16.0):** Added `estimateTimeSplit()` to parallel calls in `finalise()`. AI estimates prep+cook split from total time. Fallback: if AI fails, totalTimeMinutes is used as cookTimeMinutes.

**Files:** `src/lib/recipeEnrichment.ts` (new function), `src/app/api/recipes/import/route.ts`

---

### BUG-002 ✅ v0.15.4–v0.15.5 — Import: 0 steps (confirmed resolved)

---

### BUG-003 — "Macros unavailable" on thermomix-recipes.net

**Status:** Fix shipped v0.16.0, pending confirmation

**Root cause (original):** Netlify 10s timeout. Fixed v0.15.7 with maxDuration=30.  
**Root cause (new):** `generateThermomixSteps` had a 24s timeout. Netlify enforces 26s hard limit. That left only 2s buffer — any overhead killed the function and nutrition returned `{}` silently.

**Fix (v0.16.0):** Import route now calls Thermomix with `{ timeoutMs: 18_000 }`, giving 8s headroom for nutrition + classification within the 26s budget.

**Files:** `src/lib/recipeEnrichment.ts` (optional timeout param), `src/app/api/recipes/import/route.ts`

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

### BUG-010 — Low-res imported image not replaced by Unsplash when CDN omits content-length

**Status:** Fix shipped v0.16.0, pending confirmation

**Symptom:** A recipe with a low-res hero image (e.g. thermobliss.com) is imported without Unsplash replacement, even though UNSPLASH_ACCESS_KEY is set.

**Root cause:** `checkImageQuality` does a HEAD request. Many CDNs return 200 OK with `content-type: image/jpeg` but **no `content-length` header**. Without content-length, the code skips the size check and returns "ok". A file that is actually 20KB is rated "ok" and never sent to Unsplash.

**Fix (v0.16.0):** When HEAD returns no content-length, do a Range GET (`bytes=0-34999`). A 206 response includes `content-range: bytes 0-X/TOTAL` revealing the total file size. If total < 35KB → "low" → Unsplash fallback triggers normally.

**File:** `src/lib/imageUtils.ts` → `checkImageQuality`

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
