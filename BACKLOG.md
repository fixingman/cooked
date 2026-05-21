# Cooked — Backlog

> 🔴 Decision needed · 🟡 In progress · ✅ Shipped

---

## Bugs
*None.*

---

## UX / Polish

| # | Description | Area | Notes |
|---|-------------|------|-------|
| U-19 | Nutritional values panel | Recipe detail | calories, protein, fat, carbs per serving; scale with servings adjuster |
| U-16 | Related recipes at bottom of detail | Recipe detail | session depth |
| U-13 | AI toggle "coming soon" label | Settings | looks broken without it |
| U-4 | Progress ring label ambiguous | Cooking mode | shows step progress, not timer |
| U-12 | Camera/Mic toggles do nothing | Settings | UI-only, lowest priority |

---

## Features

### ✅ 0 — Attribution + Image Hosting
`sourceType` on all recipes · attribution row on detail page · hero images archived to Dropbox `/images/[id].jpg` · `useDropboxImage` hook with 4h cached temp links

### 🔴 H-1 — Smart Homepage Carousels
Time-of-day buckets exist. Needs personalisation + dynamic featured hero.
- **Phase A** (no new deps): include user-imported recipes in carousels · surface unfavourited/uncooked favourites · day-seeded featured hero rotation
- **Phase B** (depends on F1 + F2): pantry-match ranking · cook-history signals · "For You" section
Scope TBD.

### 🔴 1 — Pantry
Dedicated tab (4th nav item). Binary — no quantities v1.

**Data:** Dropbox `/pantry.json` · key `cooked-pantry`
```ts
interface PantryItem { id: string; name: string; addedAt: string; category?: "produce"|"dairy"|"meat"|"pantry"|"frozen"|"other" }
```
**Entry points:** type-ahead search (fuzzy, ~500 bundled ingredients) · "Add all ingredients" from recipe detail (checklist) · freeform add
**Staleness:** post-cook nudge to remove used items · 14-day staleness banner (no push notifications)
**Decisions needed:** fuzzy vs exact ingredient matching for ranking · auto vs manual category assignment

### 🔴 2 — Recipe States (Want to Cook / Cooked)
Separate from favourites. `wantToCook` = intent, `cooked` = history.
```ts
interface RecipeState { recipeId: string; cookedAt?: string[]; wantToCook: boolean; rating?: number }
```
Stored in existing `/history.json`. UX: bookmark icon on detail · "✓ Cooked" badge on card · "Want to Cook" filter chip · CompletionScreen auto-marks cooked.

### 🔴 3 — AI Suggestions & Creation
Two modes: *Suggest from library* (Claude ranks existing recipes from prompt) · *Generate new recipe* (full recipe, presented in import review screen before saving). Requires `aiEnabled` + server-side API key. UX entry point TBD.

### 🔴 4 — Photo Import
Claude vision extracts recipe from photo. Reuses import review/save flow. Same `sourceType: "image"`.

### 🔴 5 — Recipe Ranking
"For You" sort. Signals: pantry match · favourited · cooked before · want to cook · recency penalty. Only activates when user has signal. Depends on Pantry + Recipe States.

### 🔴 6 — Auth & User Profiles
Needed for social/multi-user. Supabase Auth (magic link or Google). Not urgent while Dropbox covers persistence.

### 🔴 7 — Database
Supabase (Postgres). Needed when collection requires server-side querying or multi-user. Depends on Auth.

---

## Recipe Content

Target 30+ recipes before user testing. Import sites: BBC Good Food ✅ · AllRecipes ✅ · Food52 ✅ · Serious Eats ✅ · Jamie Oliver ✅ · Bon Appétit ⚠️ · Epicurious ⚠️ · NYT Cooking ❌ (paywall) · Ottolenghi ⚠️ (untested)

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
