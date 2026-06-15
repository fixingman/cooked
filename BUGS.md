# Bug Tracker

Active bugs only. See `BUGS_ARCHIVE.md` for full details on resolved bugs.

## All bugs

| # | Title | Status | Fixed |
|---|-------|--------|-------|
| BUG-001 | Import: prep/cook time shows 0 min | ✅ Resolved | v0.16.0 |
| BUG-002 | Import: 0 steps on JS-rendered sites | ✅ Resolved | v0.15.4–v0.15.5 |
| BUG-003 | "Macros unavailable" on thermomix-recipes.net | ✅ Resolved | v0.16.2 |
| BUG-004 | Thermomix cooking mode never appears | ✅ Resolved | v0.15.7–v0.15.8 |
| BUG-005 | Settings TM enrichment: "No recipes could be adapted" | ✅ Resolved | v0.15.7 |
| BUG-006 | Back button: cook mode stuck in history | ✅ Resolved | v0.15.7 |
| BUG-007 | TM enrichment: "Steps not suitable" for genuine TM recipes | ✅ Resolved | v0.15.8 |
| BUG-008 | Recipe card shows stock thumbnail, detail shows correct image | ✅ Resolved | v0.19.14 |
| BUG-009 | CompletionScreen buttons push cook mode onto history | ✅ Resolved | v0.15.12 |
| BUG-010 | Low-res image not replaced when CDN omits content-length | ✅ Resolved | v0.16.0 |
| BUG-011 | AI-generated recipe not saved, navigates to 404 | ✅ Resolved | v0.19.7 |
| BUG-012 | Some recipes appear doubled in the library | 🔴 Open | — |
| BUG-013 | Homepage carousel thumbnails appear blurry / low-res on load | ✅ Resolved | v0.27.2 |
| BUG-014 | Homepage greeting hydration mismatch (server time ≠ client time) | ✅ Resolved | v0.29.1 |

---

## Open

### BUG-014 — Homepage greeting hydration mismatch

**Status:** Open — found by the new boot smoke test (`npm run smoke`), v0.29.0

**Symptom:** Brief flash / possible console hydration warnings on homepage load. React errors #425 + #422 (recoverable text-content hydration mismatch) fire on `/`.

**Root cause:** `TimeGreeting` renders text from `useTimeOfDay()`, which reads `new Date()` (hour + day-rotation index) at render time. Server renders with the *server's* clock (UTC on Netlify), client hydrates with the *user's local* clock — different hour bucket and/or different rotated greeting → text mismatch. React recovers by re-rendering client-side, so it's non-fatal, but the greeting can visibly flip on first paint.

**Where to look:** `src/components/home/TimeGreeting.tsx`, `src/hooks/useTimeOfDay.ts`.

**Likely fix:** render nothing (or a neutral placeholder) until mounted — gate the greeting on a `useEffect`-set `mounted` flag so the time-dependent text is only produced client-side. Avoids SSR/CSR divergence entirely.

**Root cause (updated):** Deeper than the time mismatch. The module-level seed in `useUserRecipes.ts` runs synchronously before React's `useState` initializer on the client (seeding 12 starter recipes into localStorage). So: server → 0 recipes, `isSparse=true`, renders `GettingStartedSection` ("Your cookbook is waiting."); client initial render → 12 recipes, `isSparse=false`, renders `FeaturedHero` label ("Tonight's Pick"). React compares adjacent `<p>` elements positionally and reports mismatch.

**Fix (v0.29.1):** Three-pronged:
1. `TimeGreeting` — suppress SSR rendering until `mounted` (greeting uses local clock, differs server/client)
2. `page.tsx primary/secondary` — derive from `getCurrentMeal()` only after mount (deferred via `useMemo([mounted])`)
3. `page.tsx carousels` — `isSparse`, `carousels.featured`, `FeaturedHero`, and the `!isSparse` block all gated on `mounted`. Server and client initial renders both produce no carousel content; real content appears after hydration.

**Verified fixed:** ✅ `npm run smoke` reports 0 warnings on `/`.

### BUG-012 — Some recipes appear doubled in the library

**Status:** Open — needs repro + investigation

**Symptom:** Some recipes show up twice in the recipe list.

**Hypotheses to check (unconfirmed):**
1. **First-run seed vs Dropbox merge** — `useUserRecipes` seeds 12 starters into localStorage on first launch (no `cooked-seeded` flag), then `useDropboxSync` downloads remote and `mergeRecipes` unions by `id`. Starters use *fixed* ids (`starter-carbonara`…), so id-union should dedupe — but if a starter was ever re-saved with a `user-*` slug / new UUID, the same dish would exist under two ids.
2. **Content duplicate, different id** — an AI-generated or re-imported recipe with the same title but a fresh `crypto.randomUUID()` isn't caught by `addRecipe`'s id-based upsert or `mergeRecipes`' id-union. Duplicate-import block (v0.20.12) only guards the import modal, not seed/generate paths.
3. **Same slug, different id** — two entries render as two cards but the detail route resolves by `slug`, so both open the same recipe.

**Where to look:** `src/hooks/useUserRecipes.ts` (seed block + `mergeRecipes`), `src/hooks/useDropboxSync.ts` (merge call), `src/data/starterRecipes.ts` (fixed ids).

**Needed to repro:** which recipes double (starters vs imported vs AI), single device or after multi-device sync, and whether clearing localStorage + reloading reproduces it.
