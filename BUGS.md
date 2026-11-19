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

### BUG-012 — Some recipes appear doubled in the library

**Status:** Open — reproduced in an isolated local browser on 2026-09-23; fix not implemented.

**Symptom:** Some recipes show up twice in the recipe list.

**Method:** Production build, fresh headless Chrome profiles, actual import-review/save UI and Dropbox reconciliation hooks. Import API responses and Dropbox transport were mocked with synthetic recipes and an in-memory cloud store; external requests were blocked. No real account or user recipe data was read or changed. These reproduce mechanisms in the app; they do not identify which mechanism caused the original reported incident.

### Reproduced paths

| Scenario | Result |
|---|---|
| Import the same source separately on two devices before their libraries have reconciled, then sync | Two IDs, two cards, and both records written back to the mock Dropbox store. |
| Start import review while Dropbox download is pending; let the existing copy arrive, then save | “Save Recipe” remains available; saving creates a second record. |
| Start with the carbonara starter removed, import a different carbonara under the same title, then sync a fresh device | Established library has 12 records; fresh-device seed + merge yields 13. The deleted starter returns beside the imported variation. |
| Remote data already contains the same ID twice | Both entries survive reconciliation. This preserves existing corruption; the test does not establish how the repeated ID originated. |
| Sequentially import the same source after it is already in the local library | Correctly blocked with “View recipe”. |
| Import a different source with different ingredients and steps but the exact same title | Incorrectly blocked with “View recipe”. Title equality is already causing false positives. |
| Fresh seed → reload → merge with matching starter IDs | 12 → 12 → 12. Ordinary seeding does not double the library. |

### Causes in the code

- `src/app/api/recipes/import/route.ts:112` creates a fresh UUID for each extraction. Text/photo import and AI generation also create fresh IDs.
- `src/hooks/useUserRecipes.ts:26` only excludes local records whose IDs occur remotely, then appends the entire remote array. It neither recognises the same source under different IDs nor removes repeated IDs within the remote array.
- `src/components/recipes/ImportRecipeModal.tsx:217` checks exact source URL or lowercased/trimmed title only when an import response arrives. The stored `duplicateOf` result does not recompute when the library changes. `handleSave` does not revalidate it; `addRecipe` only upserts by ID.
- `src/hooks/useUserRecipes.ts:12` seeds each new browser before Dropbox reconciliation. **A `cooked-seeded` flag already exists** (the old bug note was incorrect), but it is local to that browser. There is no synced deletion marker to prevent a removed starter from being reintroduced on a new device.
- `src/hooks/useDropboxSync.ts:118` applies initial downloaded data to its own instance and localStorage without the same-tab broadcast used for ordinary writes. This is an additional stale-instance risk to cover when repairing the import race; not isolated as the cause by this reproduction.

### Fix direction

1. Revalidate duplicate identity against the latest library at save time, and update import-review feedback when sync changes that library. Cover sibling hook instances as well as the modal's own download.
2. Replace hard title-only blocking with evidence-based duplicate handling. Same or similar names must remain valid for different sources, ingredients, or steps. Even a shared source URL can represent a user's edited variation.
3. Prevent newly seeded defaults from being uploaded into an established remote library when those defaults were previously removed. Distinguish untouched first-run examples from actual local additions/edits; simply choosing remote over local would lose data.
4. Define stable identity and preservation rules before merging different IDs: retain cooking history, favourites, notes, shopping references, edits and image paths; keep old links working. Automatically collapse only unambiguous duplicates. Surface conflicting records for review.
5. Handle repeated IDs separately, with a deterministic conflict policy. Do not silently discard differing content merely because a file contains a repeated ID.

**Remaining uncertainty:** No original duplicate examples were supplied. Same-slug/different-ID corruption remains possible (detail pages select the first slug match), but it was not produced by ordinary imports in this investigation.

**Local evidence (gitignored):** `.context/reproduce-bug-012.mjs`, `.context/bug-012-results.json`, `.context/bug-012-two-device.png`.

**Rerun:** After `npm run build`, start `npm run start -- --hostname 127.0.0.1 -p 3099`, then run `node .context/reproduce-bug-012.mjs`. The reproducer asserts the current broken behaviour; it is investigative evidence, not a passing regression test for a fix.
