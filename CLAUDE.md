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

---

## Dropbox sync architecture
3-layer offline-first: `localStorage (instant) → React state → Dropbox (debounced 1500ms)`
- Downloads: once per 15 min per path. Tab switches / navigation do NOT trigger downloads.
- Auth: PKCE OAuth, App folder scope, tokens in localStorage, refresh via `/api/dropbox/refresh`
- `NEXT_PUBLIC_DROPBOX_APP_KEY` baked at build time — requires "Clear cache and deploy" on Netlify to change

## User recipes
- Slugs prefixed `user-` — guard used throughout the app
- `useUserRecipes.addRecipe` is an upsert (filter by `id`, then prepend)
- Edit/delete: three-dot menu in `RecipeHero`, only for `user-*` slugs
- `ImportRecipeModal`: import (default) and edit (`initialDraft` prop) modes; on save calls `onSave?.(recipe)`
- Photo import: `/api/recipes/import-photo` — POST `{ imageBase64, mimeType }`, returns `{ recipe, heroImageBase64 }`; photo becomes hero image; sets `sourceType: "image"`
- URL import: `/api/recipes/import` — calls Claude Sonnet for nutrition estimation (fiber included)

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
