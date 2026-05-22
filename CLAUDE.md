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

---

## Collaboration style
- Present design decisions before implementing non-trivial features.
- User is PM/designer/developer — decision maker on all choices.
- Terse responses. No trailing summaries.
