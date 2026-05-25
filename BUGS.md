# Bug Tracker

Active bugs only. Resolved bugs kept for reference with their fix summary.

---

## Open

### BUG-001 — Import: prep/cook time shows 0 min

**Site:** thermomix-recipes.net  
**Status:** Fix shipped v0.15.5, pending confirmation — page returns 403 to server so cannot verify

**Root cause:** `parseDuration` regex matched months-`M` before the ISO 8601 `T` separator instead of minutes-`M` after it. Full-form string `P0Y0M0DT0H10M0.000S` gave 0 minutes.

**Fix (v0.15.5):** Rewrote `parseDuration` to split on `T` first, parse H/M only from the time portion. Handles `P0Y0M0DT0H10M0.000S`, `PT10M`, `PT1H30M`, plain `"30"`, `"30 minutes"`.

**Still unknown:** If thermomix-recipes.net JSON-LD simply omits `prepTime`/`cookTime` entirely (rather than using a malformed format), times would still be 0 — not a parsing bug. The 0-step Claude extraction path (v0.15.5) also merges Claude's inferred times when JSON-LD has zeros.

**File:** `src/lib/parseJsonLd.ts` → `parseDuration`

---

### BUG-002 — Import: 0 steps from JSON-LD (0-step sites)

**Status:** Fix shipped v0.15.4–v0.15.5, pending confirmation

**Root cause A:** thermomix-recipes.net uses `{ "name": "Step text" }` on HowToStep instead of `{ "text": "Step text" }`. `parseSteps` only read `.text`.  
**Fix:** `parseSteps` falls back to `obj.name` when `obj.text` absent (guards `length > 10`).

**Root cause B:** Client-rendered steps (Cookidoo-style) — JSON-LD has metadata but empty `recipeInstructions`. Route returned JSON-LD recipe directly with 0 steps.  
**Fix:** When `jsonLdRecipe.steps.length === 0`, calls Claude for full-page extraction and merges steps onto JSON-LD metadata. Also takes Claude's times if JSON-LD had zeros.

**Budget:** 0-step path skips Thermomix generation (`skipThermomix: true`) to stay within function budget. Thermomix must be added via Settings retroactive enrichment.

---

### BUG-003 — "Macros unavailable" on thermomix-recipes.net

**Status:** Fix shipped v0.15.7, pending confirmation

**Root cause:** Netlify default 10s function timeout killed the parallel AI calls (nutrition, Thermomix, classify) before they completed.  
**Fix:** `export const maxDuration = 30` on import, import-photo, enrich-thermomix, and refresh-image routes.

---

## Resolved

### BUG-004 — Thermomix cooking mode never appears on imported recipes ✅ Confirmed fixed v0.15.7–v0.15.8

**Root causes:** (H1) Steps empty in JSON-LD — fixed v0.15.4. (H3) Netlify 10s timeout killing Claude call — fixed v0.15.7 (`maxDuration = 30`). (H6) Catch block returned null on timeout/parse error, masking errors as "no TM steps" — fixed v0.15.8 (throws instead of null; route returns 500 vs 422).

---

### BUG-005 — Settings Thermomix enrichment: "No recipes could be adapted" ✅ Confirmed fixed v0.15.7

**Root cause:** Netlify 10s timeout killed `generateThermomixSteps` before Claude responded.  
**Fix:** `maxDuration = 30` on enrich-thermomix route. Client-side fetch timeout set to 28s. Result display distinguishes timeout from "not suitable" (422).

---

### BUG-006 — Back button: cook mode stuck in history ✅ Confirmed fixed v0.15.7

**Root cause:** Cook mode exit used `<Link href={...}>` which pushes a new history entry.  
**Fix:** Exit button now calls `router.back()`. Clean history stack.

**File:** `src/components/cooking/CookingShell.tsx`

---

### BUG-007 — Thermomix enrichment: "Steps not suitable" for genuine Thermomix recipes ✅ Confirmed fixed v0.15.8

**Root causes:** Error masking (catch → null → 422 looked like "not suitable"); 12s Claude timeout too short; `max_tokens: 1024` truncating JSON output; prompt ambiguity on pre-adapted steps.  
**Fix:** `generateThermomixSteps` now throws on errors (route returns 500 vs 422); timeout raised to 24s; `max_tokens` raised to 2048; prompt clarified.

**Files:** `src/lib/recipeEnrichment.ts`, `src/app/api/recipes/enrich-thermomix/route.ts`
