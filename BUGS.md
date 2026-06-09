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

---

## Open

### BUG-012 — Some recipes appear doubled in the library

**Status:** Open — needs repro + investigation

**Symptom:** Some recipes show up twice in the recipe list.

**Hypotheses to check (unconfirmed):**
1. **First-run seed vs Dropbox merge** — `useUserRecipes` seeds 12 starters into localStorage on first launch (no `cooked-seeded` flag), then `useDropboxSync` downloads remote and `mergeRecipes` unions by `id`. Starters use *fixed* ids (`starter-carbonara`…), so id-union should dedupe — but if a starter was ever re-saved with a `user-*` slug / new UUID, the same dish would exist under two ids.
2. **Content duplicate, different id** — an AI-generated or re-imported recipe with the same title but a fresh `crypto.randomUUID()` isn't caught by `addRecipe`'s id-based upsert or `mergeRecipes`' id-union. Duplicate-import block (v0.20.12) only guards the import modal, not seed/generate paths.
3. **Same slug, different id** — two entries render as two cards but the detail route resolves by `slug`, so both open the same recipe.

**Where to look:** `src/hooks/useUserRecipes.ts` (seed block + `mergeRecipes`), `src/hooks/useDropboxSync.ts` (merge call), `src/data/starterRecipes.ts` (fixed ids).

**Needed to repro:** which recipes double (starters vs imported vs AI), single device or after multi-device sync, and whether clearing localStorage + reloading reproduces it.
