# Cooked — Backlog

> 🔴 Decision needed · 🟡 In progress · ✅ Shipped

---

## Bugs
See `BUGS.md` for active bug tracking.

---

## Features
Ordered by user value × feasibility.

---

### ✅ F-14 — Improved AI Recipe Creation Flow
**What:** Rethink the generate-mode experience end-to-end — from the prompt bar through the review modal to the saved recipe.
**Why:** The current flow (v0.17.0) is functional but rough: the prompt is a plain text bar with no guidance, the generated recipe goes straight into the import modal which was designed for URL/photo imports, and there's no way to iterate or refine before saving.
**Decisions needed:**
- Prompt guidance — examples, suggested prompts, or a structured form (cuisine + dietary + time) vs free text?
- Review step — dedicated "generated recipe" modal vs reusing ImportRecipeModal with a "regenerate" action?
- Iteration — should the user be able to say "make it spicier" / "swap chicken for tofu" before saving?
- Confidence signal — how do we communicate that the recipe is AI-generated and untested?
**Out of scope:** Real-time streaming output, voice input (separate feature), social sharing of generated recipes.

---

### 🔴 F-9 — Ingredient Shopping List
**What:** Checklist of ingredients from one or more recipes. Tap to check off as you shop. Persistent across sessions.
**Why first:** Highest utility per effort in the backlog. Ingredient data already exists on every recipe. Completes the pantry → shop → cook loop. No new data model complexity.
**UX:** "Add to list" on recipe detail → bottom-sheet checklist accessible from homepage or nav. Combine ingredients from multiple recipes. Clear list action.
**Data:** `cooked-shopping-list` in localStorage + Dropbox `/shopping-list.json`. Shape: `{ items: { id, name, recipeId, recipeTitle, checked }[] }`.
**Decisions needed:** single global list vs per-recipe lists · merge duplicate ingredients across recipes · relationship with pantry (auto-remove checked items from list when added to pantry?).

---

### ✅ F-10 — Bookmarklet: One-click capture from any page
**What:** A browser bookmark (Safari, Firefox, Chrome — no install) that automates the paste-text import. Click on any recipe page → `document.body.innerText` copied to clipboard + Cooked opens with paste tab ready + URL pre-filled → user hits ⌘V → Import. Works on auth-gated sites (Cookidoo, NYT Cooking) since the user's browser session handles auth.
**Why now:** The paste tab (v0.20.5) already does the heavy lifting. The bookmarklet is ~10 lines of JS + one small `page.tsx` change. High impact, trivial effort.
**What's already built:** `/api/recipes/import-text` ✅ · Paste tab in ImportRecipeModal ✅ · URL field in paste tab ✅
**What still needs building:**
- `page.tsx`: detect `?import=paste&url=X` query params on mount → auto-open ImportRecipeModal in paste mode with URL pre-filled (~10 lines)
- Bookmarklet string to share with users (drag to bookmarks bar):
  ```javascript
  javascript:(function(){navigator.clipboard.writeText(document.body.innerText.slice(0,50000)).then(function(){window.open('https://coooked.netlify.app/?import=paste&url='+encodeURIComponent(location.href))})})();
  ```
**Effort:** ~1 hour.
**Future tier:** Chrome Extension (Manifest V3) — richer UX, one-click without leaving the tab. Build after bookmarklet proves the concept.

---

### 🔴 F-8 — Meal Planner
**What:** Weekly calendar. Drag recipes into days. Auto-generates a combined shopping list for the week.
**Why later:** High value but high effort. Needs careful UX scoping (mobile drag-and-drop is hard). Should follow F-9 Shopping List since they share infrastructure.
**Decisions needed:** 7-day vs rolling week · integration with shopping list · Dropbox sync shape.

---

### 🔴 F-11 — Collections / Folders
Group recipes into named collections ("Sunday roasts", "Quick weeknight"). A recipe can belong to multiple collections. "Add to collection" from recipe ··· menu. Dropbox-synced.

---

### 🔴 F-12 — Ingredient Substitution (AI)
Tap an ingredient in recipe detail → "I don't have this" → Claude (Haiku) suggests 2–3 substitutes with ratio notes. No new data model — Haiku call + inline sheet UI.

---

### 🔴 F-13 — Branding, App Icon & Visual Delight
**What:** Two linked workstreams:

**Branding & Icon:** Custom Cooked brand identity. App icon (PWA + apple-touch-icon + favicon), wordmark, and custom flame illustration. Current icons are programmatic SVG placeholders (good enough for now, not final).
**Scope:** Design icon at 192×192 and 512×512 PNG, update `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`, update manifest. Custom wordmark for "Cooked" in SideNav/Settings header.

**Visual Delight:** Enhance the well-worn cookbook feeling without being skeuomorphic. Previous attempt (v0.21.0) was reverted — the grain, ruled lines, inset shadow, and stamp ring didn't land right.
**Direction to explore:** Subtle depth and material quality that reads as craft, not as UI chrome. Could include: warm drop shadows with amber tint, typographic ornaments as section dividers (already shipped Divider component), seasonal or contextual micro-illustrations, richer recipe card hover states, or print-inspired layout details. Should feel like a designed object, not a decorated app.
**Constraint:** No literal paper textures, no skeuomorphic UI, no noise overlays.

---

### 🔴 F-6 — Auth & User Profiles
Supabase Auth (magic link or Google). Needed for social features, multi-device without Dropbox, sharing collections publicly. Not urgent while Dropbox covers persistence.

---

### 🔴 F-7 — Database
Supabase Postgres. Server-side querying, multi-user, recipe search at scale. **Depends on F-6.**

---

## UX / Polish
Ordered by impact.

| # | Description | Area | Notes |
|---|-------------|------|-------|
| U-28 | Unified AI + recipe search bar | Homepage | Merge AI prompt bar and recipe search into one input. Short query = filter library; natural-language sentence = AI suggest/generate. Needs clear mode-switch UX. |
| U-29 | Homepage improvements | Homepage | Improve carousel logic, section ordering, empty states, and overall first-impression quality. Decisions needed: what signals drive each carousel · how to handle a sparse library (< 5 recipes) · whether to surface pantry-matched recipes more prominently. |
| U-24 | Wire mic & camera permission toggles | Settings | Current toggles are dead UI. Call `navigator.mediaDevices.getUserMedia` / `navigator.permissions.query`, reflect live browser state. Effectively a bug. |
| U-23 | Quick-bookmark from recipe card | Recipe list | Long-press / hover action. Bookmark currently only accessible from detail page. Small discoverability win. |

---

## ✅ Shipped

| Feature | Version |
|---------|---------|
| Full UI prototype — 5 routes, 12 recipes, PWA | 0.1.0 |
| Thermomix cooking mode | 0.2.0 |
| UX polish — favourites, keyboard shortcuts, filters, skeletons, design tokens | 0.3.0 |
| Multi-select filter chips | 0.4.0 |
| Dropbox file sync — offline-first persistence | 0.5.0 |
| Recipe URL import + sharing | 0.6.0 |
| Edit / delete user recipes | 0.7.0 |
| Attribution, Dropbox image hosting | 0.8.0 |
| Error handling — 404, error boundary, URL validation | 0.8.2 |
| Performance — memo, lazy init, animation cap | 0.8.3 |
| Recipe States — Want to Cook / Has Cooked | 0.9.0 |
| Smart Homepage Carousels Phase A | 0.10.0 |
| Wake lock, Web Worker timer, PWA offline cache | 0.10.1–0.10.2 |
| Nutrition panel + AI fill-in on import | 0.10.3 |
| Mark as Cooked + rating + cooking notes | 0.11.0 |
| F-4 Photo import — Claude vision | 0.12.0 |
| Full macro breakdown + undo mark as cooked | 0.12.6–0.12.7 |
| Thermomix steps + macro nutrition on import, enrichment chips | 0.13.0 |
| Grouped filter chips — meal time, type, diet | 0.13.1 |
| Extended nutrition panel — sugar, sodium, sat.fat, cholesterol, trans fat | 0.14.0 |
| Image quality pipeline — thumbnail stripping, Unsplash fallback, HF upscaling | 0.15.0 |
| Retroactive Thermomix enrichment in Settings | 0.15.2 |
| Import fetch layer — Chrome UA, retry, streaming early-exit, 3-attempt | 0.16.3 |
| Non-English recipe import + translation | 0.16.4 |
| F-3 AI Suggestions & Creation — prompt bar, suggest + generate modes | 0.17.0 |
| U-25 Richer greeting variety | 0.18.0 |
| F-1 Pantry — homepage widget + modal, Dropbox-synced | 0.19.0 |
| Pantry: export/import, category grouping, AI categorise | 0.19.3 |
| Pantry: add ingredients from recipe detail | 0.19.5 |
| Pantry: fuzzy matching — strips prep context for comparison | 0.19.9 |
| F-5 + H-1B Recipe ranking engine + "For You" carousel | 0.20.0 |
| F-14 AI recipe creation — FlavorGraph pairings + pantry chip + GeneratedRecipeModal + Regenerate + example prompts | 0.22.0 |
| Paste-text import mode — auth-gated sites (Cookidoo, NYT) | 0.20.5 |
| Source URL field in paste tab — parallel image fetch | 0.20.6 |
| Deferred nutrition estimation — post-save, same pattern as Thermomix | 0.20.8 |
| Enrichment placeholders on recipe page — skeleton + live replace | 0.20.10 |
| Change image picker — right panel, current + Unsplash + source image | 0.20.11 |
| Duplicate import blocked — "View recipe" replaces Save | 0.20.12 |
