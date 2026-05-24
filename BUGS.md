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

### BUG-004 — Thermomix cooking mode never appears on imported recipes

**Status:** Fix shipped v0.15.7–v0.15.8, pending confirmation

**Symptom:** "No Thermomix adaptation" on import digest. "Cook with Thermomix" button never appears.

**Architecture:** `generateThermomixSteps(steps, apiKey)` runs in `finalise()`. On success, recipe gets `thermomixAvailable: true` and steps gain `.thermomix` data. `StartCookingButton` renders dual CTA only when `thermomixAvailable && settings.thermomixEnabled`.

**Hypotheses and status:**

| # | Hypothesis | Status |
|---|---|---|
| H1 | Steps empty → `generateThermomixSteps` returns null immediately | Fix shipped v0.15.4 (parseSteps name fix + 0-step Claude fallback) |
| H2 | `thermomixEnabled` setting off | Unlikely — user sees Settings Thermomix section (gated on that flag) |
| H3 | Netlify default 10s function timeout kills Claude call before 12s completes | Fix shipped v0.15.7 — `maxDuration = 30` on all AI routes |
| H4 | Claude returns `[]` — steps genuinely not Thermomix-suitable | Still possible for simple/manual recipes |
| H5 | Dropbox "remote wins" merge overwrites enriched recipe on reconnect | Still possible if Dropbox has a pre-enrichment copy |
| H6 | `generateThermomixSteps` catch block returned null on timeout/parse error, indistinguishable from "no TM steps" | Fix shipped v0.15.8 — function now throws on error; route returns 500 vs 422 |

**What to verify after v0.15.8 deploys:**
1. Import any recipe from BBC Good Food or Allrecipes
2. Import chip should say "Thermomix steps added" (not "No Thermomix adaptation")
3. On recipe detail, scroll down — "Cook with Thermomix" button should appear
4. For thermomix-recipes.net recipes: Settings → Thermomix → Generate should now succeed (not show "Steps not suitable")

**Files:** `src/app/api/recipes/import/route.ts`, `src/lib/recipeEnrichment.ts`, `src/components/recipe-detail/StartCookingButton.tsx`

---

### BUG-005 — Settings Thermomix enrichment: "No recipes could be adapted"

**Status:** Fix shipped v0.15.7, pending confirmation

**Root cause:** Netlify 10s timeout killed `generateThermomixSteps` before Claude responded. Client caught network error, showed "No recipes could be adapted."  
**Fix:** `maxDuration = 30` on enrich-thermomix route. Client-side fetch timeout set to 28s. Result display now distinguishes "timed out — try again" from "steps not suitable for Thermomix" (422).

---

### BUG-007 — Thermomix enrichment: "Steps not suitable" for genuine Thermomix recipes

**Site:** thermomix-recipes.net (e.g. Zucchini Pesto)  
**Status:** Fix shipped v0.15.8, pending confirmation

**Symptom:** Settings → Thermomix → Generate shows "Steps not suitable for Thermomix" for a recipe whose steps are already written in Thermomix format (e.g. "Chop 5 sec/speed 5").

**Root causes:**

1. **Error masking:** `generateThermomixSteps` catch block returned `null` on timeout/parse error. The route returned 422 ("no steps") instead of 500 ("error"). The client displayed "Steps not suitable" for what was actually a timeout or JSON parse failure.

2. **Claude API timeout too short:** 12s `AbortSignal.timeout` inside a 30s Netlify function. Under load, Claude could exceed 12s, hitting the timeout → catch → null → 422.

3. **`max_tokens: 1024` too low:** For a multi-step recipe with verbose Thermomix instructions, Claude's JSON output could be truncated, causing `JSON.parse` to throw → catch → null → 422.

4. **Prompt ambiguity:** Steps from thermomix-recipes.net are already written as Thermomix operations. The prompt said "extract parameters directly" but also "Skip steps with no machine equivalent" — Claude may have skipped pre-adapted steps.

**Fixes (v0.15.8):**
- `generateThermomixSteps` now throws on API/parse errors instead of returning null. null = genuinely no TM steps; throw = error.
- `enrich-thermomix` route returns 500 on throw, 422 only on genuine null.
- Claude timeout raised 12s → 24s. `max_tokens` raised 1024 → 2048.
- Prompt: added "do not skip it" for pre-adapted steps; `timeSeconds` fallback of 30 if unspecified.
- Import route wraps with `.catch(() => null)` so a thrown error doesn't fail the whole import.

**Files:** `src/lib/recipeEnrichment.ts`, `src/app/api/recipes/enrich-thermomix/route.ts`, `src/app/api/recipes/import/route.ts`

---

## Resolved

### BUG-006 — Back button: cook mode stuck in history ✅ Confirmed fixed v0.15.7

**Symptom:** recipe → cook → X → recipe → browser back → cook (instead of list/home).

**Root cause:** Cook mode exit used `<Link href={...}>` which pushes a new history entry. History became `[..., list, recipe, cook, recipe]`. Back from recipe goes to cook.

**Fix:** Exit button now calls `router.back()`. History stays `[..., list, recipe, cook]` → back() → `[..., list, recipe]` → back → list. Clean stack.

**File:** `src/components/cooking/CookingShell.tsx`
