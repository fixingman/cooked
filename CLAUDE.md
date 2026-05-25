# Cooked — Claude Instructions

## Reference docs
- Architecture, design system, hooks, routes: **`MEMORY.md`**
- Feature backlog and shipped log: **`BACKLOG.md`**
- Always update both when shipping a feature or changing architecture.

---

## Stack
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Netlify · Dropbox PKCE sync

---

## Version bump — MANDATORY on every commit to main

Three files must always match:
1. `package.json` → `"version": "A.B.C"`
2. `src/app/settings/page.tsx` → `vA.B.C — Your cooking companion`
3. `src/components/layout/SideNav.tsx` → `vA.B.C`

| Segment | When |
|---|---|
| **A** major | Re-architecture, new backend, auth, breaking data model |
| **B** minor | New user-facing feature, new route, meaningful UX change |
| **C** patch | Bug fix, polish, copy, build/lint, refactor |

**Version history:**
- `0.1.0` Full UI prototype · `0.2.0` Thermomix · `0.3.0` UX polish · `0.4.0` Multi-select filters
- `0.4.1` Timer/nav fixes · `0.5.0` Dropbox sync · `0.6.0` URL import + sharing · `0.6.1` Upload fix
- `0.7.0` Edit/delete recipes · `0.7.1` Sync throttle · `0.8.0` Attribution + image hosting
- `0.8.1` Import modal desktop panel · `0.8.2` Error handling + 404 · `0.8.3` Performance
- `0.8.4` Back button / content flash / card animations · `0.9.0` Recipe States (wantToCook/hasCooked)
- `0.10.0` Smart homepage carousels Phase A · `0.10.1` Wake lock · `0.10.2` Web Worker timer + PWA cache
- `0.10.3` Nutrition panel + AI fill-in · `0.11.0` Mark as Cooked + rating + cooking notes
- `0.11.1` Cap recently cooked to 3 · `0.12.0` Photo import (Claude vision)
- `0.12.1`–`0.12.5` Bug fixes + cooking mode de-clutter · `0.12.6` Undo mark as cooked
- `0.12.7` Full macro breakdown + hide rating until rated
- `0.12.8`–`0.12.11` Bug fixes: deleteLastEntry index fix, double-tap guard, photo import silent failure, back button skip /cook
- `0.13.0` Thermomix steps + macro nutrition on URL/photo import, enrichment status chips
- `0.13.1` Grouped recipe filter chips — meal time, type, diet, my list · `0.13.2` AI classification + chef's notes on import
- `0.13.3` Sort icon · `0.13.4` Sticky back nav + PWA top gap (viewport-fit cover)
- `0.14.0` Extended nutrition panel — sugar/sodium/sat.fat/cholesterol/trans fat with health warnings
- `0.14.1` Fix nutrition parsing — decimal stripping bug + fiberContent missing from JSON-LD parser
- `0.14.2` Fix Thermomix step ID matching for imported recipes
- `0.14.3` Hide built-in recipes from lists · chef's notes UI polish · back button single-press fix
- `0.14.4` Remove built-ins completely (incl. FeaturedHero) · revert chef's notes to amber · toast redesign
- `0.14.5` Fix Thermomix step matching (index-based, not ID-copy) · handle 0-step JSON-LD (Cookidoo)
- `0.15.0` Image quality + source — thumbnail URL stripping, Unsplash fallback, retroactive scan in Settings
- `0.15.1` Logo → home nav · compact single-row category chips · High-protein + Freezable filters
- `0.15.2` Retroactive Thermomix enrichment in Settings · tighter API timeouts · Netlify 26s function timeout
- `0.15.3` HF swin2SR upscaling in image refresh · image URL revert-on-non-image · Unsplash on unknown quality · Dropbox offline resilience + merge strategies
- `0.15.4` Fix HowToStep `name` fallback in parseSteps · Claude step extraction for 0-step JSON-LD recipes
- `0.15.5` parseDuration full-ISO fix (T-split) · 0-step time merge from Claude · budget-aware Thermomix skip · BUGS.md
- `0.15.6` Nutrition: "based on N servings" label + consistent "Show full breakdown" · Cooking mode: contextual ingredients via text-match (no more showing all)
- `0.15.7` Nutrition: ~Xg per serving from weight ingredients · Back button: router.back() in cook mode · maxDuration=30 on all AI routes · Thermomix enrichment error breakdown
- `0.15.8` Thermomix enrichment: fix error masking (throws vs null), timeout 12s→24s, max_tokens 1024→2048, prompt fix for pre-adapted steps · BUG-007
- `0.15.9` Fix image replacement: "unknown" HEAD quality no longer triggers Unsplash fallback — only confirmed "low" does
- `0.15.10` Fix ingredient unit "gr" not recognised → name corruption · Thermomix panel order: Time|Temp|Speed
- `0.15.11` Fix recipe card showing Unsplash stock when Dropbox original exists · needsRefresh flags ai-found+Dropbox recipes
- `0.15.12` Fix CompletionScreen buttons pushing cook mode onto history — use router.replace()
- `0.15.13` Sort no-amount ingredients to bottom · TM zero-value badges show "—" · ingredient sort in StepIngredients
- `0.15.14` Code cleanup: remove dead recipe lib functions · consistent design tokens (ProgressRing constants, shadow-sage-cta, min-h-0) · type guard in import-photo route
- `0.15.15` Fix IngredientList Map for-of TS error breaking Netlify build
- `0.15.16` Ingredient list: right-aligned qty column, unit in italic
- `0.16.0` Import: AI prep/cook time split + totalTime fallback · Thermomix timeout 18s in import · image quality Range-GET fallback for missing content-length

---

## Dropbox sync architecture
3-layer offline-first: `localStorage (instant) → React state → Dropbox (debounced 1500ms)`
- Downloads: once per 15 min per path. Tab switches / navigation do NOT trigger downloads.
- Auth: PKCE OAuth, App folder scope, tokens in localStorage, refresh via `/api/dropbox/refresh`
- `NEXT_PUBLIC_DROPBOX_APP_KEY` baked at build time — requires "Clear cache and deploy" on Netlify to change

### Offline resilience
- Token refresh only clears credentials on HTTP 400/401 (revoked token). A network error while offline returns `null` and keeps tokens intact — the user stays "connected."
- If an upload fails (no token or network error), the value is stored in `pendingRef` inside `useDropboxSync`.
- `window.online` listener flushes `pendingRef` the moment connectivity restores.

### Multi-device conflict resolution (merge strategies)
On initial download, if both local and remote data exist, `useDropboxSync` calls a per-hook `merge(local, remote)` function instead of blindly overwriting. This preserves data added on any device.

| Hook | Merge strategy |
|------|---------------|
| `useUserRecipes` | Union by `id` — local-only recipes prepended, remote wins for conflicts |
| `useRecipeStates` | Per `recipeId`: union `cookedAt` timestamps, OR `wantToCook`, first non-null `rating` |
| `useCookingHistory` | Union by `cookedAt` ISO string, sorted newest-first |
| `useFavourites` | Union of ID arrays (`Set`) |
| `useSettings` | Remote wins (no merge — settings are low-conflict) |

After merging, if the result differs from remote, the merged value is pushed back to Dropbox immediately so all devices converge.

### Image resolution pipeline (`resolveRecipeImage`)
```
1. tryFullResUrl(url)    — strip WordPress -300x200, Cloudinary transforms, ?w=/h= params
2. If URL changed: HEAD-check stripped URL for Content-Type: image/*
   - If not an image (e.g. site header): revert to original URL
3. checkImageQuality(url) — HEAD for Content-Length < 35KB = "low"; non-image Content-Type = "unknown"
4. If quality !== "ok":
   a. HF upscale (if HUGGINGFACE_API_TOKEN set) — swin2SR 2×, preserves original photo
   b. Unsplash search fallback (if UNSPLASH_ACCESS_KEY set) — replaces with stock photo
   c. Keep original with quality: "low" if both unavailable
5. Returns { url, source, quality, resolvedBase64? }
   - resolvedBase64 is set when upscaling was used — caller skips re-fetching the image bytes
```
- HF upscaling only runs in the Settings refresh route (`/api/recipes/refresh-image`), NOT during import — cold-start latency (20-30s) would exceed the Netlify function budget alongside the other parallel AI calls.
- `"unknown"` (HEAD blocked, timed out, or no Content-Length) → keep original URL as-is. Only confirmed `"low"` triggers the fallback chain.

## User recipes
- Slugs prefixed `user-` — guard used throughout the app
- `useUserRecipes.addRecipe` is an upsert (filter by `id`, then prepend)
- Edit/delete: three-dot menu in `RecipeHero`, only for `user-*` slugs
- `ImportRecipeModal`: import (default) and edit (`initialDraft` prop) modes; on save calls `onSave?.(recipe)`
- Photo import: `/api/recipes/import-photo` — POST `{ imageBase64, mimeType }`, returns `{ recipe, heroImageBase64 }`; photo becomes hero image; sets `sourceType: "image"`
- URL import: `/api/recipes/import` — calls Claude Sonnet for nutrition estimation (fiber included)

---

## Recipe import pipeline

### URL import — `POST /api/recipes/import`

```
1. Validate URL (HTTP/HTTPS only)
2. Fetch HTML with browser-like User-Agent, 8s timeout
3. Try JSON-LD fast path: parseRecipeFromHtml(html, url, id)
   - If JSON-LD found AND steps.length > 0  → finalise(recipe, pageText)
   - If JSON-LD found but steps.length === 0 → Claude extraction for steps; merges steps + times onto JSON-LD metadata; finalise with skipThermomix: true
   - If JSON-LD not found                   → Claude full-page extraction
4. Claude fallback (only when ANTHROPIC_API_KEY is set):
   - Guard: if "ingredient" not in page text → return 422 early
   - extractWithClaude(pageText, url, id) — sends stripped text (40k char limit) to Claude Sonnet
   - Prompt asks for a specific JSON schema; buildRecipeFromSchema() normalises output
5. finalise(recipe, pageText, { skipThermomix? }) runs four calls in parallel:
   a. resolveRecipeImage(heroImageUrl, title, cuisine, UNSPLASH_ACCESS_KEY)
   b. estimateNutrition(recipe, apiKey)  — only if !r.calories && !r.protein
   c. generateThermomixSteps(steps, apiKey).catch(() => null)  — skipped if skipThermomix
   d. classifyRecipe(recipe, apiKey, pageText)
6. After parallel calls: fetch heroImageBase64 for Dropbox storage (separate fetch)
7. Returns { recipe, heroImageBase64?, enrichments: { nutrition, nutritionSource, thermomix } }
```

### Photo import — `POST /api/recipes/import-photo`

```
1. Receive { imageBase64, mimeType }
2. Send image to Claude vision (claude-sonnet-4-6) with same JSON schema prompt
3. buildRecipeFromSchema() normalises output; sets imageSource: "photo-import", imageQuality: "ok"
4. Same finalise() parallel enrichment as URL import (no image resolution needed)
```

### Thermomix step generation — `generateThermomixSteps(steps, apiKey)`

```
1. Numbered step list sent to Claude: "1. <instruction>\n2. ..."
2. Claude returns JSON array of steps that CAN use Thermomix:
   [{ stepNumber: 1, speed, tempC, timeSeconds, instruction, label }]
   - stepNumber is 1-indexed, maps to array index via: byIndex = Map(stepNumber-1 → item)
   - tempC can be a number (37–100) or "Varoma" (~115°C for steaming)
   - speed: 0=heat only, 1=stir, 3=mix, 5=blend, 7=chop, 10=crush
3. Original steps are merged: steps.map((s, i) => byIndex.get(i) ? { ...s, thermomix: {...} } : s)
4. Returns null if no steps matched (or API failure), returns updated steps array if ≥1 matched
5. Caller sets thermomixAvailable: true on recipe when non-null result is returned
```

**Key invariant:** step matching is by array index (0-based), not by any ID field. The `stepId` on CookingStep is for UI keying only and is never sent to Claude.

**Failure modes:**
- Claude returns [] (no Thermomix steps found) → `generateThermomixSteps` returns null → `thermomixAdded = false`
- API timeout (24s) or error → function throws; import route's `.catch(() => null)` treats as "not added"; enrich-thermomix route returns 500 (client shows "timed out — try again")
- Steps already describe Thermomix operations (thermomix-recipes.net) → Claude extracts speed/temp/time directly from text; prompt clarified "do not skip pre-adapted steps"

### Nutrition estimation — `estimateNutrition(recipe, apiKey)`

```
- Called only when !r.calories && !r.protein (both falsy)
- Returns all fields: calories, protein, fat, carbs, fiber, sugar, sodium, saturatedFat, cholesterol, transFat
- sodium and cholesterol in mg; all others in g except calories in kcal
- transFat may be decimal (0.1g precision); all others rounded to integer
- Returns {} on any failure (timeout, parse error, API error) — caller treats {} as "not available"
```

### Image resolution — `resolveRecipeImage(rawImageUrl, title, cuisine, unsplashKey)`

```
1. tryFullResUrl(url): strips WordPress -300x200.jpg, Cloudinary transforms, ?w= / ?h= params
2. checkImageQuality(url): HEAD request, Content-Length < 35 000 bytes → "low"
3. If URL was modified by tryFullResUrl, re-check quality on the new URL
4. If quality still "low" AND unsplashKey is set → searchUnsplash(query, key) → imageSource: "unsplash"
5. If no original URL → searchUnsplash → imageSource: "ai-found"
6. Returns { url, source: "scraped"|"unsplash"|"ai-found"|"none", quality: "ok"|"low" }
```

### Enrichments response

```ts
enrichments: {
  nutrition: boolean          // true only if AI estimated macros (not JSON-LD)
  nutritionSource: "ai"       // AI estimated
               | "json-ld"   // already present in page JSON-LD
               | "none"      // not available from either source
  thermomix: boolean          // true if ≥1 step has Thermomix parameters added
}
```

**Chip display logic (ImportRecipeModal):**
```ts
const ns = enrichments.nutritionSource;
const hasMacros = ns === "ai" || ns === "json-ld"
  || (!ns && enrichments.nutrition)   // legacy: older saved enrichments
  || !!(draft?.calories);             // fallback: recipe object has data regardless of enrichments
```

### Common failure modes to watch for

| Symptom | Likely cause |
|---|---|
| "No Thermomix adaptation" on thermomix-specific site | Steps empty in JSON-LD (site uses JS rendering) → Claude fallback extracts them; or genuine timeout → enrich via Settings |
| "Macros unavailable" on BBC Good Food / rich sites | Fixed: `nutritionSource: "json-ld"` now detected correctly |
| Both macros + Thermomix unavailable | Netlify function timeout — `maxDuration = 30` on all AI routes should prevent this |
| "Steps not suitable for Thermomix" in Settings enrichment | Could be genuine (simple recipe) or was a timeout masquerading as 422 — fixed in v0.15.8 (throws vs null) |
| Recipe imports with no steps | Cookidoo-style: JSON-LD has metadata but `recipeInstructions` is client-rendered; Claude full-page extraction handles it |

## Recipe states & history
- `useRecipeStates` — synced to Dropbox `/recipe-states.json`; shape: `{ recipeId, wantToCook, cookedAt[], rating? }`
- `useCookingHistory` — synced to Dropbox `/history.json`; shape: `CookingHistoryEntry { recipeId, cookedAt, notes?, rating? }`
- `unmarkCooked(id)` removes last `cookedAt` entry and clears rating if array becomes empty
- `deleteLastEntry(id)` on `useCookingHistory` removes the most recent history entry

---

## Collaboration style
- Present design decisions before implementing non-trivial features.
- User is PM/designer/developer — decision maker on all choices.
- Terse responses. No trailing summaries.
