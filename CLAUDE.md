# Cooked — Claude Instructions

## Stack
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Netlify · Dropbox PKCE sync

## Non-negotiable rules

### Version bump — MANDATORY on every commit to main

Every commit to `main` **must** include a version bump. No exceptions. Three files, all must match:

1. `package.json` → `"version": "A.B.C"`
2. `src/app/settings/page.tsx` → `vA.B.C — Your cooking companion`
3. `src/components/layout/SideNav.tsx` → `vA.B.C`

**Semver rules:**

| Segment | When |
|---|---|
| **A** (major) | Re-architecture, new backend, auth, breaking data model |
| **B** (minor) | New user-facing feature, new route, meaningful UX change |
| **C** (patch) | Bug fix, polish, copy, build/lint fix, refactor |

Multiple commits in one session that each need a bump: batch them into one bump at commit time. Never let a feature commit go out on the old version.

**Version history:**
- `0.1.0` — Full UI prototype
- `0.2.0` — Thermomix cooking mode
- `0.3.0` — UX polish (favourites, keyboard shortcuts, filters, skeletons)
- `0.4.0` — Multi-select filter chips
- `0.4.1` — Timer/nav fixes, ESLint
- `0.5.0` — Dropbox file sync, real cooking history
- `0.6.0` — Recipe URL import, sharing, sync status, hover polish
- `0.6.1` — Dropbox upload 400 fix, debug UI cleanup
- `0.7.0` — Edit / delete user recipes (U-18)
- `0.7.1` — Dropbox sync throttle (15 min window), bootstrap fix
- `0.8.0` — Attribution, Dropbox image hosting, import modal viewport fix

---

## Architecture

### Dropbox sync
3-layer offline-first: `localStorage (instant) → React state (UI) → Dropbox (debounced 1500ms)`

- Downloads: once per 15 minutes per file path (module-level `lastDownloadedAt` map). Tab switches and navigation do NOT trigger downloads.
- Uploads: on every `setValue` call, debounced 1500ms.
- Auth: PKCE OAuth, App folder scope, tokens in localStorage, refresh via `/api/dropbox/refresh`.
- Env: `NEXT_PUBLIC_DROPBOX_APP_KEY` (baked at build time — adding it requires "Clear cache and deploy" on Netlify).

### Synced files
| File | Hook | localStorage key |
|---|---|---|
| `/settings.json` | `useSettings` | `cooked-settings` |
| `/favourites.json` | `useFavourites` | `cooked-favourites` |
| `/history.json` | `useCookingHistory` | `cooked-history` |
| `/recipes/index.json` | `useUserRecipes` | `cooked-user-recipes` |

### User recipes
- Slugs prefixed `user-` — used as a guard throughout the app.
- `useUserRecipes.addRecipe` is an upsert (filters by `id` then prepends).
- Edit/delete entry point: three-dot menu in `RecipeHero`, only rendered for `user-*` slugs.

### Import modal
`ImportRecipeModal` handles both import (default) and edit (`initialDraft` prop) modes. In edit mode it skips to the review stage; on save it calls `onSave?.(recipe)` before closing.

---

## Backlog
Live backlog: `BACKLOG.md` at repo root. Always update it when shipping a feature or adding an item.

## Project memory
Architecture, design system, routes, and conventions: `MEMORY.md` at repo root. Read it at the start of any session to get full context. Update it when architecture or conventions change.

## Collaboration style
- Present design decisions before implementing non-trivial features.
- User is PM/designer/developer — treat them as the decision maker.
- Terse responses. No trailing summaries.
