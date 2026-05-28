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
- `0.16.1` classifyRecipe now infers mealTimes · page fetch timeout 8s→12s (Waitrose fix) · photo import mealTimes merged
- `0.16.2` Greeting: remove subtitle, 5 time states (night/morning/afternoon/evening) · Deferred TM enrichment post-save · updateRecipe on useUserRecipes
- `0.16.3` Import fetch layer: full Chrome headers + Google Referer, 3-attempt retry on 4xx, streaming early-exit on </head>+JSON-LD, 18s timeout, friendly error messages
- `0.16.4` Non-English recipe import: diacritic-based language detection + parallel translateRecipe() call; Claude extraction prompt also translates; multi-language ingredient guard
- `0.17.0` F-3 AI Suggestions & Creation — prompt bar on homepage (aiEnabled only); suggest mode ranks library recipes; generate mode creates new recipe via Claude, opens in review modal; generatedDraft prop on ImportRecipeModal
- `0.17.1` fix: nutrition + recipe hero UI polish — remove author line, nutrition label cleanup, dot separator refactor
- `0.17.2` fix: HTML entity decoding + inline tag stripping in recipe parser
- `0.17.3` fix: Netlify build errors — unused var + img element
- `0.17.4` fix: unlock AI toggle + tidy settings layout; remove nutrition warning reason text; fix duplicate search clear button
- `0.17.5` fix: image refresh honest feedback — only count genuine improvements, show recipe names
- `0.17.6` fix: AI prompt bar layout matches recipe search bar
- `0.17.7` fix: unescaped apostrophe in ImageRefreshSection (Netlify build)
- `0.17.8` fix: remove submit arrow from AI prompt bar
- `0.17.9` feat: HF upscaler cold-start retry — client waits, retries before Unsplash fallback
- `0.18.0` feat: U-25 richer greeting variety — 10-12 greetings per time slot, daily rotation
- `0.18.1` fix: expand greeting pools to 10-12 per slot
- `0.19.0` F-1 Pantry — homepage widget + management modal; binary presence + manual "low" flag; Dropbox-synced at /pantry.json
- `0.19.1` fix: image refresh no longer loops forever — mark as low-checked when both HF+Unsplash fail
- `0.19.2` fix: pantry modal sidebar on desktop · widget only shows when items are low · Settings entry point
- `0.19.3` feat: pantry export/import + category grouping + AI categorise button · Staples label (was "Pantry")
- `0.19.4` fix: pantry categories fallback to inferCategory() for uncategorised items · createPortal height fix
- `0.19.5` feat: add recipe ingredients to pantry + pantry access from recipe detail page
- `0.19.6` fix: pantry UI — hide already-added items in checklist · pantry checkmarks on ingredient list · sentence-case normalisation · granular categories (grains, spices, baking split from staples)
- `0.19.7` fix: AI-generated recipe not saving — localStorage now written synchronously in useDropboxSync (before React processes state update) · fix double router.push when modal has onSave · AI bar loading state + clear button centering
- `0.19.8` fix: AI bar clear button centering (Framer Motion transform conflict) · tbsp/tsp abbreviation (recipe detail + cook mode) · &rsquo; apostrophe stripped in ingredient names · non-English cuisine falls back to AI inference
- `0.19.9` feat: fuzzy pantry matching — normalizeForMatch strips prep context (diced, minced, etc.) and comma clauses for comparison · cleanForPantry strips prep before storing · checkmark replaces filled green dot
- `0.19.10` fix: recipe import — stream exits as soon as complete JSON-LD block found (fixes body-embedded JSON-LD e.g. The Modern Proper) · Claude fallback timeout 12s→20s
- `0.19.11` fix: recipe import — Googlebot UA retry when browser fetch yields no JSON-LD (fixes SPA/prerender sites e.g. coop.se)
- `0.19.12` fix: normalise protocol-relative image URLs (//cdn…) to https: — fixes Next.js Image rejection and Cloudinary transform stripping
- `0.19.13` fix: pantry — AI categorise runs on all items · split Staples into Oils & Condiments + Canned & Jars · strip leading unit tokens (dl/tbsp/g) from ingredient matching
- `0.19.14` fix: BUG-008 recurring — RecipeCard now loads Dropbox image for all recipes with heroImageDropboxPath (not just ai-found), matching RecipeHero behaviour
- `0.20.0` F-5 + H-1B: recipe ranking engine (pantry match · favourites · cook history · recency penalty) · "For You" homepage carousel · all existing carousels ranked within their filter
- `0.20.1` feat: pantry categories expanded — Produce split into Fruit + Vegetables · Legumes added · Dried Goods added · Frozen expanded
- `0.20.2` fix: pantry labels — "Dried Goods" → "Dried" · "Other" → "Misc"
- `0.20.3` fix: "berries" / "mixed berries" / singular forms now infer Fruit category
- `0.20.4` fix: pantry items with old "produce" category (pre-v0.20.1) now visible and re-categorised on load — were invisible in modal but still blocking dedup, making them impossible to re-add
- `0.20.5` feat: paste-text import mode — select all + copy from any auth-gated page (Cookidoo, NYT Cooking, etc.), paste into new "Paste" tab in import modal → `/api/recipes/import-text`; extractWithClaude + buildImportResponse extracted to `src/lib/recipeImport.ts`
- `0.20.6` feat: optional source URL field in paste tab — runs parallel supplementary fetch (5s timeout) to grab hero image from OG/JSON-LD even when full page is auth-gated; Claude text extraction + image fetch run in parallel
- `0.20.7` fix: estimateNutrition + estimateTimeSplit switched to Haiku (was Sonnet) — frees ~7s of the 30s Netlify budget so paste-text imports no longer time out before nutrition is estimated · fix: PantryWidget running-low text overflowed on mobile/desktop — truncate on inline span is a no-op, moved to block-level p element
- `0.20.8` feat: deferred nutrition estimation — macros now estimated post-save client-side (same pattern as Thermomix enrichment) via new `/api/recipes/estimate-nutrition` endpoint · import route no longer calls estimateNutrition, saving ~8-10s of Netlify budget for paste imports · chip shows "Estimating…" → "Macros estimated" / "Macros unavailable" live in modal
- `0.20.9` fix: replace enrichment chips with tidy "Metadata" section in review panel — rows for Macros + Thermomix steps with inline status
- `0.20.10` feat: recipe page shows enrichment placeholders — nutrition skeleton + "Preparing Thermomix steps…" while background enrichment is in flight; auto-replaced when data arrives via window custom event; 90s fallback timeout
- `0.20.11` feat: change image — "Change image" in recipe ··· menu opens right-panel picker with current image + 9 Unsplash alternatives; tap to select, saves to Dropbox if connected
- `0.20.12` fix: duplicate import blocked — save button replaced with "View recipe" when duplicate detected by URL or title match
- `0.20.13` fix: "gr" (European gram abbreviation) added to LEADING_UNIT + BARE_UNIT — "gr parmesan cheese" now strips to "parmesan cheese" for pantry matching
- `0.20.14` fix: image picker — versioned Dropbox path on replace (bypasses 4h cache); "From source" option fetches OG image from original recipe URL in parallel with Unsplash; broken image tiles hidden via onError
- `0.20.15` feat: deferred time estimation — show "—" for unknown times, estimate via Haiku post-save, display with "~" prefix · U-24: mic & camera toggles locked with "Coming soon" badge · backlog F-11 Collections, F-12 Ingredient Substitution numbered
- `0.20.16` feat: F-10 bookmarklet — one-click capture from any page; "Save to Cooked" drag link in Paste tab; ?import=paste&url=X query params auto-open modal in paste mode; environment-aware URL via window.location.origin
- `0.20.17` fix: Unsplash search quality — buildImageQuery strips adjective noise + drops "food recipe" suffix; fixes "any" being injected as literal word when cuisine is unclassified; zero-results fallback to cuisine + "food" in image picker
- `0.20.18` fix: bookmarklet — switch from async navigator.clipboard.writeText to synchronous textarea+execCommand copy; eliminates race condition where clipboard was never written before navigation
- `0.20.19` fix: bookmarklet — use window.open (new tab) instead of window.location.href; navigator.clipboard.writeText fires and completes while user switches tabs; execCommand fallback with visible+opacity:0 textarea for browsers without clipboard API
- `0.20.20` fix: bookmarklet — back to execCommand+window.location.href (window.open blocked as popup); textarea positioned at current scroll offset (in viewport) so execCommand copy succeeds
- `0.20.21` fix: ingredient parsing — flatMap recipeIngredient array by \n before parsing; fixes sites (e.g. barefootcontessa.com) that pack all ingredients into one array element
- `0.20.22` fix: bookmarklet — navigator.clipboard.writeText primary path + window.focus()+execCommand fallback; fixes silent copy failure when document loses focus to browser chrome on bookmark click
- `0.20.23` fix: bookmarklet — inject floating "Save to Cooked →" button onto recipe page; clipboard write happens on genuine button click (page-scoped gesture), bypassing Chromium's bookmarklet clipboard restriction; auto-removes after 15s
- `0.20.24` feat: bookmarklet server relay — button click POSTs text to /api/bookmarklet/store (Netlify Blobs, CORS-enabled), navigates with token; Cooked fetches text server-side, pre-fills textarea, auto-triggers import — no clipboard or ⌘V needed
- `0.20.25` fix: bookmarklet button type="button" + e.preventDefault/stopPropagation — untyped button defaults to submit, triggering form submission on sites with wrapping forms (white page in Dia/Chromium)
- `0.20.26` fix: bookmarklet — replace button injection+fetch with native form POST to /api/bookmarklet/submit; form submissions bypass CORS, connect-src CSP, clipboard restrictions; server stores text, redirects to Cooked with token
- `0.20.27` fix: bookmarklet — drop Netlify Blobs relay (500 errors); grab JSON-LD structured data from page instead (compact, recipe-ready); encode in URL param; fall back to innerText.slice(0,4000); direct window.location.href navigation, zero server deps
- `0.20.28` fix: bookmarklet — read URL params from window.location.search directly (not reactive useSearchParams) to prevent race where router.replace clears params before effect reads them
- `0.20.29` fix: bookmarklet — switch to URL hash transport (#bm?...) so payload is never sent to Netlify server; bypasses ~16KB CDN URL limit that was silently dropping the text param; add console.log debug trace at each handoff step
- `0.20.30` feat: Web Share Target — PWA manifest share_target registers Cooked as a share destination; /share route redirects to home with share_url param; ShareHandler opens URL import modal and auto-triggers import; replaces broken bookmarklet for Dia/Chromium
- `0.20.31` fix: remove bookmarklet drag link from Paste tab (Dia/Chromium sandboxes javascript: bookmarks in about:blank — no reliable fix without extension); add flame SVG to PWA manifest icons; F-13 branding backlog entry
- `0.20.32` feat: image picker search bar — type any query to re-search Unsplash; input pre-filled with auto-generated query so user can see and refine it; Enter or button triggers search
- `0.20.33` fix: PWA flame icon — icon.tsx + apple-icon.tsx via next/og ImageResponse replace browser tab "F" favicon; /pwa-icon/[size] edge route serves 192/512 PNGs for manifest; manifest updated to use dynamic icon routes

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

### Fetch layer — `fetchPage()` + `streamFetch()`

The fetch layer is the most complex part of the import pipeline. It handles bot-detection, large pages, SPA prerendering, and streaming early-exit.

```
fetchPage(url) — tries up to 3 UA strategies, retries only on HTTP 4xx:
  1. Desktop Chrome UA + Google Referer   (most permissive, defeats most bot-checks)
  2. Desktop Chrome UA (no Referer)
  3. Mobile UA + Google Referer
  On success (HTTP 200): returns HTML immediately, no further retries.
  On HTTP 4xx: tries next strategy. On timeout/5xx: breaks immediately (retry won't help).

streamFetch(url, headers) — streams response with 18s timeout:
  Early-exit conditions (abort and return accumulated HTML):
  1. application/ld+json seen AND a closing </script> follows it
     → a complete JSON-LD block is in the buffer; no need to read further.
     Handles both <head>-embedded JSON-LD (e.g. Waitrose) and late-body JSON-LD
     (e.g. The Modern Proper, where JSON-LD is at byte 200K+ in a 221KB page).
  2. html.length > 600_000  → absolute safety cap, never exceeded in practice.
  The stream reader is cancelled after early-exit to free the connection.
```

**Googlebot prerender fallback** (runs after `fetchPage` if no JSON-LD found):
Some SPAs (e.g. coop.se) serve a JavaScript shell to browser UAs but return fully
prerendered HTML — including complete JSON-LD with ingredients and instructions —
to Googlebot. A second fetch with `Googlebot/2.1` UA is attempted before falling
through to Claude. Only fires when JSON-LD is missing from the first fetch.

**Known site-specific behaviours:**
| Site | Behaviour | Handled by |
|------|-----------|------------|
| Waitrose | JSON-LD in `<head>`, page is 80KB+ | Stream early-exit on `</head>` + JSON-LD |
| The Modern Proper | JSON-LD in `<body>` at byte 200K+ | Stream early-exit on complete JSON-LD block |
| coop.se | SPA — JSON-LD only in Googlebot prerender | Googlebot UA retry |
| Cookidoo | JSON-LD present but `recipeInstructions` empty (JS-rendered) | Claude step extraction, skipThermomix |
| BBC Good Food | Full JSON-LD including nutrition | JSON-LD fast path, nutrition from json-ld |
| Non-English sites | Swedish/French/German/etc. | `looksNonEnglish` → `translateRecipe()` parallel call |

**Protocol-relative image URLs** (`//cdn.example.com/...`):
Some sites (e.g. coop.se) output protocol-relative URLs in JSON-LD. These fail Node.js
`fetch()` and are rejected by Next.js `Image`. `resolveRecipeImage` normalises them to
`https:` before any processing so Cloudinary transform stripping and quality checks work.

### URL import — `POST /api/recipes/import`

```
1. Validate URL (HTTP/HTTPS only)
2. fetchPage(url) — browser UA with streaming early-exit (see Fetch layer above)
3. Try JSON-LD fast path: parseRecipeFromHtml(html, url, id)
   - If no JSON-LD: retry with Googlebot UA (SPA prerender fallback)
   - If JSON-LD found AND steps.length > 0  → finalise(recipe, pageText)
   - If JSON-LD found but steps.length === 0 → Claude extraction for steps; merges steps + times onto JSON-LD metadata
   - If JSON-LD not found after Googlebot retry → Claude full-page extraction
4. Claude fallback (only when ANTHROPIC_API_KEY is set):
   - Guard: if "ingredient" not in page text (multi-language) → return 422 early
   - extractWithClaude(pageText, url, id) — sends stripped text (40k char limit) to Claude Sonnet
   - Prompt asks for a specific JSON schema; buildRecipeFromSchema() normalises output
   - Timeout: 20s (generous — browser fetch is fast due to streaming early-exit)
5. finalise(recipe, pageText) runs in parallel:
   a. resolveRecipeImage(heroImageUrl, title, cuisine, UNSPLASH_ACCESS_KEY)
   b. estimateNutrition(recipe, apiKey)  — only if !r.calories && !r.protein
   c. classifyRecipe(recipe, apiKey, pageText)
   d. estimateTimeSplit — only if both prep+cook are 0 but totalTime > 0
   e. translateRecipe — only if looksNonEnglish(recipe)
   Note: Thermomix enrichment is deferred to client-side post-save (ImportRecipeModal)
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
