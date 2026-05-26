# Cooked — Backlog

> 🔴 Decision needed · 🟡 In progress · ✅ Shipped

---

## Bugs
See `BUGS.md` for active bug tracking.

---

## UX / Polish
Ordered by impact. Each item is self-contained and shippable independently.

| # | Description | Area | Why now |
|---|-------------|------|---------|
| ~~U-26~~ | ~~Translate non-English imported recipes to English~~ | ~~Import~~ | ✅ Shipped v0.16.4 |
| ~~U-4~~ | ~~Progress ring / step counter label~~ | ~~Cooking mode~~ | ✅ Solved — ring shows step fraction `1/5` when no timer is active |
| ~~U-25~~ | ~~Richer time-of-day greeting variety~~ | ~~Homepage~~ | ✅ Shipped v0.18.0 — 4–5 greetings per time slot, rotated daily |
| U-16 | Related recipes at bottom of recipe detail | Recipe detail | Increases session depth. Uses existing `getRelatedRecipes()` in `src/lib/recipes.ts`. |
| U-23 | Quick-bookmark from recipe card (long-press / hover action) | Recipe list | Currently bookmark only accessible from detail. Small discoverability improvement. |
| U-24 | Microphone & camera PWA permission flows | Settings | Wire the existing toggles to the real `navigator.mediaDevices.getUserMedia` / `navigator.permissions.query` APIs. Show a browser prompt, reflect live state. Needed so the toggles aren't dead UI. |
| U-28 | Unified AI + recipe search bar | Homepage | Merge the AI prompt bar and the recipe search bar on the homepage into a single input. The bar would detect intent: a short keyword/ingredient query filters the library; a natural-language sentence ("something spicy for dinner") triggers the AI suggest/generate flow. Requires designing a clear mode-switch UX (e.g. auto-detect or a toggle pill). Currently the two bars are separate — kept that way for simplicity. |

---

## Features
Ordered by user value × feasibility. Phase B features (F-5, H-1B) depend on Pantry and are blocked until F-1 ships.

### 🔴 F-9 — Ingredient Shopping List
**What:** Checklist of ingredients from a recipe. Tap to check off as you shop. Persistent across sessions.
**Why first:** Highest utility per effort of anything in the backlog. Ingredient data already exists on every recipe. No new data model needed beyond a `Set<string>` in localStorage.
**UX:** "Add to list" button on recipe detail → bottom-sheet checklist. Combine ingredients from multiple recipes. Clear list action.
**Data:** `cooked-shopping-list` in localStorage + Dropbox `/shopping-list.json`. Shape: `{ items: { id, name, recipeId, checked }[] }`.
**Decisions needed:** single global list or per-recipe lists · merge duplicates across recipes.

---

### ✅ F-1 — Pantry (v0.19.0)
Homepage widget + modal. Binary presence + manual "low" flag. Dropbox-synced.

**Data:** Dropbox `/pantry.json` · key `cooked-pantry`
```ts
interface PantryItem { id: string; name: string; addedAt: string; category?: "produce"|"dairy"|"meat"|"pantry"|"frozen"|"other" }
```
**Entry points:** type-ahead search (fuzzy, ~500 bundled ingredients) · "Add all ingredients" from recipe detail (checklist) · freeform add
**Staleness:** post-cook nudge to remove used items · 14-day staleness banner (no push notifications)
**Decisions needed:** fuzzy vs exact ingredient matching for ranking · auto vs manual category assignment

---

### ✅ F-3 — AI Suggestions & Creation (v0.17.0)
Prompt bar on homepage below greeting (visible when `aiEnabled`). Single input, Claude decides mode. Suggest: returns ranked library recipe cards with reason. Generate: full recipe via Claude → opens in review modal → saves as new recipe with TM enrichment + Dropbox upload.

---

### ✅ F-5 — Recipe Ranking ("For You" sort) — v0.20.0
`src/lib/rankRecipes.ts` — `scoreRecipe` weights: pantry match ratio ×4 · favourite +2 · wantToCook +1 · cooked +0.5 · rating≥4 +1.5 · recency penalty (−4/<3d, −2/<7d, −0.5/<14d). `hasEnoughSignal` gates on ≥3 pantry items OR ≥2 favourites OR ≥2 cooked recipes.

---

### ✅ H-1B — Smart Homepage Carousels Phase B — v0.20.0
"For You" section between PantryWidget and FeaturedHero (gated on signal threshold). Meal-time + wantToCook + untriedFavourites carousels sorted by rank. Pantry match badge on ForYouSection cards when ≥2 ingredients matched.

---

### 🔴 F-11 — Bookmarklet: One-click paste import
**What:** A browser bookmark (works in Safari, Firefox, Chrome — no install) that automates the paste-text import flow. Click it on any recipe page → text is copied to clipboard + Cooked opens with the paste tab ready + URL pre-filled → user hits Cmd+V → Import.
**Why:** The paste tab (v0.20.5) already handles auth-gated content but requires manual Cmd+A + Cmd+C. The bookmarklet automates those two steps. Entire implementation is ~10 lines of JS + one small app change.
**What's already built:**
- `/api/recipes/import-text` endpoint ✅
- Paste tab in ImportRecipeModal ✅
- URL field in paste tab ✅
**What still needs building:**
- `page.tsx`: detect `?import=paste&url=X` query params on mount → auto-open ImportRecipeModal in paste mode with URL pre-filled
- The bookmarklet string itself (share as a link the user drags to bookmarks bar):
  ```javascript
  javascript:(function(){navigator.clipboard.writeText(document.body.innerText.slice(0,50000)).then(function(){window.open('https://coooked.netlify.app/?import=paste&url='+encodeURIComponent(location.href))})})();
  ```
**Effort:** ~1 hour. `page.tsx` change is ~10 lines; the bookmarklet is a one-liner.

---

### 🔴 F-10 — Chrome Extension / Bookmarklet: Save to Cooked
**What:** One-click save from any webpage into Cooked — covers both public recipe sites and auth-gated content (Cookidoo, NYT Cooking, etc.) since the user's browser session handles authentication.
**Why:** The "Paste" import mode (shipped v0.20.5) already handles auth-gated content but requires manual Cmd+A → Cmd+C. This feature automates that capture step. The key insight: auth is already solved by the user's browser — we just need to grab the rendered DOM text and send it to `/api/recipes/import-text`.
**Two-tier approach:**
- **Bookmarklet (MVP):** User drags a link to their bookmarks bar. Clicking it on any recipe page runs JS that grabs `document.body.innerText` and redirects to Cooked with the text pre-filled. Zero installation friction, works on Safari/Firefox/Chrome. Build this first.
- **Chrome Extension (full):** Manifest V3, toolbar icon, popup UI, one-click save without leaving the tab. Richer UX — can auto-detect recipe pages, badge the icon, inject a "Save to Cooked" button into pages. Build after bookmarklet proves the concept.
**How the capture works (both tiers):**
- Grab `document.body.innerText` from the current tab (already rendered, auth already handled)
- POST to `/api/recipes/import-text` (existing endpoint, shared extraction pipeline)
- For the extension: Dropbox token stored in `chrome.storage.local`, obtained via existing PKCE OAuth (one-time login in popup)
**Extension scope (when ready):**
- Manifest V3, Chrome Web Store compatible
- Popup: active-tab recipe title preview · Import button · Dropbox auth state
- No background service worker needed
- Hits deployed Netlify URL (`NEXT_PUBLIC_APP_URL` env var for CORS)
**Decisions needed:** bookmarklet first or skip straight to extension · Chrome Web Store vs. sideload only · Firefox/Safari scope

---

### 🔴 F-8 — Meal Planner
Weekly calendar. Drag recipes into days. Auto-generates a combined shopping list for the week. High effort, high value — scope carefully before starting.

---

### 🔴 F-6 — Auth & User Profiles
Supabase Auth (magic link or Google). Needed for social features, multi-device without Dropbox, sharing collections. Not urgent while Dropbox covers persistence.

---

### 🔴 F-7 — Database
Supabase Postgres. Needed for server-side querying, multi-user, recipe search at scale. **Depends on F-6.**

---

## ✅ Shipped Log

| Feature | Version | Date |
|---------|---------|------|
| Full UI prototype — 5 routes, 12 recipes, PWA | 0.1.0 | 2026-05-18 |
| Thermomix cooking mode | 0.2.0 | 2026-05-18 |
| UX polish — favourites, keyboard shortcuts, filters, skeletons, design tokens | 0.3.0 | 2026-05-19 |
| Multi-select filter chips | 0.4.0 | 2026-05-19 |
| Timer/nav fixes, ESLint | 0.4.1 | 2026-05-19 |
| Dropbox file sync — offline-first persistence | 0.5.0 | 2026-05-20 |
| Recipe URL import, sharing, sync status, hover polish | 0.6.0 | 2026-05-20 |
| Dropbox upload fix, debug UI cleanup | 0.6.1 | 2026-05-20 |
| Edit / delete user recipes (U-18) | 0.7.0 | 2026-05-20 |
| Dropbox sync throttle (15 min), bootstrap fix | 0.7.1 | 2026-05-20 |
| Attribution, Dropbox image hosting, import modal viewport fix | 0.8.0 | 2026-05-20 |
| Import modal desktop panel | 0.8.1 | 2026-05-20 |
| Error handling — 404, error boundary, URL validation | 0.8.2 | 2026-05-20 |
| Performance — memo, lazy init, animation cap | 0.8.3 | 2026-05-21 |
| Bug fixes — back button, content flash, card animations | 0.8.4 | 2026-05-21 |
| Recipe States — Want to Cook / Cooked, filter chip, auto-mark | 0.9.0 | 2026-05-21 |
| Smart Homepage Carousels Phase A — user recipes, personalised sections, day-seed hero | 0.10.0 | 2026-05-21 |
| Keep screen awake during cooking (navigator.wakeLock) | 0.10.1 | 2026-05-22 |
| Infrastructure — Web Worker timer, PWA offline cache, stale history cleanup | 0.10.2 | 2026-05-22 |
| Nutrition panel (AI fill-in on import) + AI toggle "coming soon" label | 0.10.3 | 2026-05-22 |
| U-20 "Mark as Cooked" + rate from detail · U-22 Cooking notes field · nutrition AI → Sonnet | 0.11.0 | 2026-05-22 |
| Cap "Recently Cooked" to 3 items with "See all →" link | 0.11.1 | 2026-05-22 |
| F-4 Photo import — Claude vision extracts recipe from photo | 0.12.0 | 2026-05-23 |
| Bug fixes — cooked filter, hero rotation, badge contrast on hero, fiber in nutrition | 0.12.1 | 2026-05-23 |
| UX — cooked CTA in meta bar, button order, toast feedback on CTAs, parallel Thermomix CTAs, cooking entrance animation | 0.12.2 | 2026-05-23 |
| Cooking mode — remove recipe image, show per-step ingredient list, fix timer font | 0.12.3 | 2026-05-23 |
| Flip-clock timer redesign — dark cards, hairline crease, no serif | 0.12.4 | 2026-05-23 |
| Remove redundant step counters in cooking mode | 0.12.5 | 2026-05-23 |
| U-25 Undo "Mark as Cooked" via × button on cooked badge | 0.12.6 | 2026-05-23 |
| U-27 Full macro breakdown in nutrition panel + hide rating until rated | 0.12.7 | 2026-05-23 |
