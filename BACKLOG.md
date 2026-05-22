# Cooked — Backlog

> 🔴 Decision needed · 🟡 In progress · ✅ Shipped

---

## Bugs
*None.*

---

## UX / Polish
Ordered by impact. Each item is self-contained and shippable independently.

| # | Description | Area | Why now |
|---|-------------|------|---------|
| ✅ U-20 | "Mark as Cooked" + rate from recipe detail — v0.11.0 | Recipe detail | |
| ✅ U-21 | Keep screen awake during cooking (`navigator.wakeLock`) — v0.10.1 | Cooking mode | |
| ✅ U-22 | Cooking notes field on CompletionScreen — v0.11.0 | Cooking mode | |
| ✅ U-13 | "Coming soon" label on AI toggle — v0.10.3 | Settings | |
| ✅ U-19 | Nutritional values panel — v0.10.3 | Recipe detail | calories/protein/fat/carbs/fiber; AI (Sonnet) fills in missing values on import. Full macros on all 12 built-in recipes added v0.12.7. |
| ✅ U-25 | Undo "Mark as Cooked" — v0.12.6 | Recipe detail | × button on cooked badge removes last cook entry + clears rating if no cooks remain. |
| ✅ U-26 | Toast feedback on recipe detail CTAs — v0.12.2 | Recipe detail | Bookmark, copy link, cook-for-later all show a dismissing pill toast on tap. |
| ✅ U-27 | Cooking mode de-clutter — v0.12.3–v0.12.5 | Cooking mode | Removed redundant step counters; replaced recipe image with ingredient list per step; flip-clock timer redesign. |
| U-4  | Progress ring / step counter label | Cooking mode | Label is ambiguous — reads as timer progress, not step progress. Quick copy fix. |
| U-16 | Related recipes at bottom of recipe detail | Recipe detail | Increases session depth. Uses existing `getRelatedRecipes()` in `src/lib/recipes.ts`. |
| U-23 | Quick-bookmark from recipe card (long-press / hover action) | Recipe list | Currently bookmark only accessible from detail. Small discoverability improvement. |
| U-24 | Microphone & camera PWA permission flows | Settings | Wire the existing toggles to the real `navigator.mediaDevices.getUserMedia` / `navigator.permissions.query` APIs. Show a browser prompt, reflect live state. Needed so the toggles aren't dead UI. |

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

### ✅ F-4 — Photo Import — v0.12.0
Claude vision extracts a recipe from a photo (cookbook page, handwritten card, screenshot). URL/Photo tab switcher in ImportRecipeModal; `/api/recipes/import-photo` route; photo becomes hero image.

---

### 🔴 F-1 — Pantry
Dedicated tab (4th nav item). Binary presence — no quantities in v1.

**Data:** Dropbox `/pantry.json` · key `cooked-pantry`
```ts
interface PantryItem { id: string; name: string; addedAt: string; category?: "produce"|"dairy"|"meat"|"pantry"|"frozen"|"other" }
```
**Entry points:** type-ahead search (fuzzy, ~500 bundled ingredients) · "Add all ingredients" from recipe detail (checklist) · freeform add
**Staleness:** post-cook nudge to remove used items · 14-day staleness banner (no push notifications)
**Decisions needed:** fuzzy vs exact ingredient matching for ranking · auto vs manual category assignment

---

### 🔴 F-3 — AI Suggestions & Creation
Two modes: *Suggest from library* (Claude ranks existing recipes from prompt) · *Generate new recipe* (full recipe, presented in import review screen before saving). Requires `aiEnabled` flag + `ANTHROPIC_API_KEY` server-side.
**Decisions needed:** UX entry point (floating button? search bar mode? dedicated tab?).

---

### 🔴 F-5 — Recipe Ranking ("For You" sort)
Signals: pantry match · favourited · cooked before · want to cook · recency penalty. Only activates when user has enough signal. **Depends on F-1 (Pantry).**

---

### ✅ H-1A — Smart Homepage Carousels Phase A — v0.10.0
Day-seeded featured hero rotation (cycles all `isFeatured` recipes daily). User-imported recipes appear in meal-time carousels. "In Your List" section (wantToCook recipes, hidden when empty). "From Your Favourites" section (favourited + uncooked, hidden when empty). ContinueCooking resolves user recipe titles. `MealTimeSection` gained optional `seeAllHref` prop.

---

### 🔴 H-1B — Smart Homepage Carousels Phase B
pantry-match ranking · cook-history signals · "For You" section at top of homepage. **Depends on F-1 + F-5.**

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

## Infrastructure / Tech

| # | Description | Notes |
|---|-------------|-------|
| ✅ I-1 | Background timer (Web Worker) — v0.10.2 | Timestamp-based accuracy; worker ticks every 500ms, main thread computes elapsed from `Date.now()`. |
| ✅ I-2 | PWA offline recipe cache — v0.10.2 | NetworkFirst for pages + cooking mode; CacheFirst for all remote images. |
| ✅ I-3 | Stale history cleanup — v0.10.2 | `deleteRecipeHistory` + `deleteState` called from `handleDelete` in recipe detail. |

---

## Recipe Content

**Current:** 12 built-in. **Target:** 30+ before user testing.

Import sources: BBC Good Food ✅ · AllRecipes ✅ · Food52 ✅ · Serious Eats ✅ · Jamie Oliver ✅ · Bon Appétit ⚠️ · Epicurious ⚠️ · NYT Cooking ❌ (paywall) · Ottolenghi ⚠️ (untested)

Quality checklist per recipe: 5–12 steps · ingredient IDs cross-referenced to steps · `durationSeconds` on timed steps · Thermomix variant if applicable · hero photo in Dropbox · accurate difficulty/timing

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
