# Bug Tracker

Tracks active bugs, root-cause analysis, attempted fixes, and what still needs work.

---

## BUG-001 — Import: prep/cook time shows 0 min

**Site:** thermomix-recipes.net (confirmed), possibly others  
**Status:** Fix attempted in v0.15.5, unconfirmed  

### Symptom
Recipe imported with `prepTimeMinutes = 0` and `cookTimeMinutes = 0`. The recipe card may show a fallback of 30 min (from `totalTimeMinutes = totalFromSchema || prep+cook || 30`), but the detail page prep/cook fields both read 0.

### Root cause
`parseDuration` used a single regex `/PT?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i` that looks for digits before the letter M anywhere in the string. Full ISO 8601 durations (e.g. `P0Y0M0DT0H10M0.000S`) have two M characters: one for **months** (before the `T` separator) and one for **minutes** (after `T`). The regex matched the months `0M` first and returned 0.

### Attempted fixes
- **v0.15.4** — Added plain-number and natural-language fallbacks (`"10 minutes"`, `"1h30m"`). Did NOT fix full-ISO form.
- **v0.15.5** — Rewrote `parseDuration` to split on `T` first, then parse H/M only from the time portion after `T`. Correctly handles `P0Y0M0DT0H10M0.000S`, `PT10M`, `PT1H30M`, `P0DT30M`, plain `"30"`, `"30 minutes"`, `"1 hour 30 minutes"`.

### Still unknown
The page returns 403 to the server-side fetch so we cannot inspect its actual JSON-LD. If the JSON-LD simply omits `prepTime`/`cookTime` fields entirely (rather than using a malformed format), the 0-times come from `parseDuration(undefined) = 0`, not from a parsing bug. In that case the real fix is for Claude extraction to infer times from page text (see BUG-002 time-merge fix).

**File:** `src/lib/parseJsonLd.ts` → `parseDuration`

---

## BUG-002 — Import: 0 steps extracted from JSON-LD (0-step sites)

**Site:** thermomix-recipes.net, Cookidoo, any site using client-rendered steps  
**Status:** Partially fixed v0.15.4 + v0.15.5  

### Symptom
Recipe imports with 0 steps. No Thermomix adaptation possible. Settings enrichment sees 0 steps and correctly skips the recipe, but then the count shows "1 recipe missing" which is confusing.

### Root cause (two independent causes)
**A — Wrong JSON-LD field name:** thermomix-recipes.net uses `{ "@type": "HowToStep", "name": "Step text" }` instead of the standard `{ "text": "Step text" }`. `parseSteps` only read `.text`.

**B — Client-rendered steps:** Some sites (Cookidoo, etc.) have recipe metadata in JSON-LD but steps are rendered by JavaScript. `recipeInstructions` is empty in the static HTML. The import was returning the JSON-LD recipe directly even with 0 steps, skipping Claude extraction.

### Fixes applied
- **v0.15.4** — `parseSteps` now falls back to `obj.name` when `obj.text` is absent (guards with `length > 10` to skip decorative titles). Fixes cause A.
- **v0.15.4** — Import route: when JSON-LD found but `steps.length === 0`, calls Claude for full-page extraction and merges only the steps (keeping JSON-LD metadata). Fixes cause B.
- **v0.15.5** — When merging Claude steps onto JSON-LD metadata, also takes Claude's `prepTime`/`cookTime`/`totalTime` values if the JSON-LD had 0 times. This handles the case where times are also absent from the JSON-LD.

### Budget concern (introduced by v0.15.4)
The 0-step Claude path adds a **serial** Claude call before `finalise()`. Combined with the page fetch, total budget is: 8s (fetch) + 12s (Claude steps) + 12s (parallel enrichments) = **32s**. Netlify default function timeout may be 10s (free) or 26s (paid). To stay safe, `skipThermomix: true` is passed to `finalise()` in this path, removing one of the three parallel Claude calls: 8s + 12s + 8s = **28s**. Still tight. Thermomix must be added retroactively via Settings for 0-step sites.

**Files:** `src/lib/parseJsonLd.ts` → `parseSteps`, `src/app/api/recipes/import/route.ts`

---

## BUG-003 — Import: "Macros unavailable" chip on import

**Site:** thermomix-recipes.net  
**Status:** Likely caused by Netlify timeout (see BUG-002 budget concern)  

### Symptom
Import digest shows "Macros unavailable" even though the AI key is configured and works for other sites.

### Root cause hypothesis
For 0-step sites, the import route now does: fetch → Claude steps extraction → `finalise()`. If the total wall time exceeds the Netlify function limit, the response never reaches the client. The client gets a network error, sets `stage = "error"`, and never even shows the review screen. The user only sees this as "something went wrong" rather than a specific chip. 

If the function DOES complete, macros should be estimated by `estimateNutrition` (called in parallel in `finalise()`). The chip shows "Macros unavailable" only when `enrichments.nutrition = false` AND `r.calories` is falsy — meaning both the JSON-LD had no nutrition AND the AI estimation either wasn't called or returned `{}`.

### What's needed to confirm
Check the Netlify function log for the import request. If it shows a 504/timeout, the timeout is the root cause. If it shows 200, the AI estimation either failed or the JSON-LD had no nutrition and the AI returned `{}`.

**File:** `src/app/api/recipes/import/route.ts`

---

## BUG-004 — Thermomix cooking mode never appears on any imported recipe

**Status:** Root cause unconfirmed — multiple hypotheses  

### Symptom
"No Thermomix adaptation" always shown on import digest. "Cook with Thermomix" button never appears on any recipe detail page.

### Architecture (how it should work)
1. `generateThermomixSteps(steps, apiKey)` called inside `finalise()` — 12s timeout
2. Claude returns structured Thermomix params per step; if any step gets params, returns updated steps array
3. `enriched` object gets `{ steps: updatedSteps, thermomixAvailable: true }`
4. API returns `enrichments: { thermomix: true }` → import chip shows "Thermomix steps added"
5. `draft` (full recipe with thermomixAvailable + steps with `.thermomix` data) saved via `addRecipe`
6. Stored in localStorage as JSON (all fields round-trip correctly through JSON)
7. Recipe detail page reads from localStorage: `JSON.parse(stored).find(r => r.slug === slug)`
8. `<StartCookingButton thermomixAvailable={recipe.thermomixAvailable} />` renders dual CTAs when `thermomixAvailable && settings.thermomixEnabled`

### Hypotheses

**H1 — Steps were always empty (most likely for thermomix-recipes.net)**  
Before v0.15.4 parseSteps fix, all recipes from thermomix-recipes.net had 0 steps. `generateThermomixSteps` returns `null` immediately when `steps.length === 0`. The chip was always "No Thermomix adaptation". This is now fixed for that site.

**H2 — Thermomix setting not enabled**  
`StartCookingButton` only shows the dual CTA when `settings.thermomixEnabled && thermomixAvailable`. Default is `thermomixEnabled: false`. If the user hasn't toggled it on in Settings → Cooking Modes, the button never shows regardless of `thermomixAvailable`. However the user reports seeing the Thermomix section in Settings (which is gated on `thermomixEnabled`), so this setting is probably on.

**H3 — Function timeout kills Thermomix generation**  
For sites where JSON-LD has steps, the parallel enrichment block runs 3 Claude calls simultaneously. If any of them stalls (or Anthropic API is slow), the 12s `AbortSignal.timeout` cancels the request, `generateThermomixSteps` returns `null`, `thermomixAdded = false`. This would cause the chip to always say "No Thermomix adaptation" even though the recipe data is fine. Macros working (for sites with JSON-LD nutrition) would NOT rule this out, since nutrition AI is skipped when `!needsNutrition(r)`.

**H4 — Claude returns `[]` for the recipe's steps**  
For some recipes (very manual ones: plate, marinate, season, serve) Claude may correctly determine no Thermomix equivalent exists and return `[]`. `generateThermomixSteps` returns `null` when Claude returns `[]`. Not universal — a pesto recipe has blending and cooking steps that are classic Thermomix.

**H5 — Dropbox merge overwrites enriched recipe**  
`mergeRecipes` uses "remote wins" for ID conflicts. If Dropbox held an older copy of the recipe (imported before Thermomix enrichment worked), re-merging on Dropbox reconnect would overwrite the enriched local recipe, erasing `thermomixAvailable: true` and step `.thermomix` data. This would explain "it worked once but disappeared."

### Diagnostic steps needed
1. Import any recipe from a well-known site (e.g. BBC Good Food, Allrecipes)
2. Check the import chip — does it say "Thermomix steps added" or "No Thermomix adaptation"?
3. If "Thermomix steps added": go to recipe detail, scroll down past the ingredients — does the dual button appear?
4. If "No Thermomix adaptation" for a normal site: H3 is likely — check Netlify function logs

### What v0.15.5 changes for this bug
- For 0-step sites (thermomix-recipes.net): steps are now extracted via Claude. Thermomix skipped on import (`skipThermomix: true`). Must use Settings → Thermomix enrichment after saving.
- For normal sites: no change. Thermomix generation still runs in the parallel block. If H3 is real, it still fails.

**Files:** `src/app/api/recipes/import/route.ts`, `src/components/settings/ThermomixEnrichSection.tsx`, `src/components/recipe-detail/StartCookingButton.tsx`

---

## BUG-005 — Settings Thermomix enrichment: "No recipes could be adapted"

**Status:** Open  

### Symptom
Settings → Thermomix shows "1 recipe missing Thermomix adaptation". Clicking Generate returns "No recipes could be adapted."

### Root cause hypothesis
The `/api/recipes/enrich-thermomix` endpoint calls `generateThermomixSteps(steps, apiKey)` with the recipe's steps. If the recipe was saved with empty steps (pre-v0.15.4 import), `needsEnrichment` checks `r.steps.length > 0` — a 0-step recipe would NOT appear in the pending list. So the recipe showing in the list has steps but enrichment is failing.

Possible reasons enrichment returns 422:
- Claude returns `[]` for the specific recipe's steps (H4 from BUG-004)
- The 12s timeout fires before Claude responds (cold start on Netlify)
- `ANTHROPIC_API_KEY` env var issue (but other AI features work, so unlikely)

### What to try
Re-import the recipe after v0.15.5 is deployed. The new import will have steps (via the name-field fix or Claude extraction). Then run Settings enrichment on the fresh recipe.

**File:** `src/app/api/recipes/enrich-thermomix/route.ts`, `src/components/settings/ThermomixEnrichSection.tsx`
