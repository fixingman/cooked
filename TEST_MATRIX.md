# Cooked — Test Matrix

> Living coverage map. Update when behaviour changes. Marks: ✅ passing · ❌ failing · ⚠️ untested / manual-only.
> Automated coverage lives in `src/__tests__/` (vitest unit) + `scripts/smoke-boot.mjs` (headless boot). Everything else is manual until noted.

---

## Core loop

| Flow | Coverage | Status | Notes |
|------|----------|--------|-------|
| URL import (JSON-LD fast path) | manual | ⚠️ | Parser unit-tested; full route manual |
| URL import (Claude fallback, no JSON-LD) | manual | ⚠️ | |
| Paste-text import | manual | ⚠️ | Auth-gated sites (Cookidoo, NYT) |
| Photo import (Claude vision) | manual | ⚠️ | |
| YouTube import | unit (`isYouTubeUrl`, `extractVideoId`) | ✅ | Route itself manual |
| Cook mode — step nav, timer, swipe | manual | ⚠️ | |
| Cook mode — adjusted servings | unit + browser verification | ✅ | v0.32.4: standard and Thermomix entry links, refresh, fractional/doubled amounts, invalid URL fallback, 20→1 reduction, unknown yield. Browser check: `.context/check-cooking-servings.mjs` (local, gitignored). |
| Mark as cooked + rating + notes | manual | ⚠️ | |
| Undo mark as cooked | manual | ⚠️ | |
| Edit / delete user recipe | manual | ⚠️ | `user-*` slugs only |

## Parser / extraction (unit — `src/__tests__/smoke.test.ts`)

| Behaviour | Status |
|-----------|--------|
| `parseServings` — descriptive yields ("Makes 20", "Cuts into 10 slices") | ✅ |
| `parseMixedNumber` — unicode + ascii fractions | ✅ |
| `splitInstructionString` — HTML / numbered / Step-prefix / fallback | ✅ |
| `parseRecipeFromHtml` — `@graph` unwrapping | ✅ |
| flatMap `\n`-delimited single-string ingredients | ✅ |
| `mapDietaryTags` — schema.org URL + plain + array | ✅ |

Serving-scale regression tests in `src/__tests__/servings.test.ts` cover missing/malformed/non-positive/non-finite overrides, invalid recipe yields, ratio overflow/underflow, reductions below 0.1, and fractional quantity formatting.

## Sync edge cases (`useDropboxSync` + per-hook merge)

| Case | Status | Notes |
|------|--------|-------|
| Offline create → localStorage persists | ⚠️ | |
| Reconnect flushes `pendingRef` (`window.online`) | ⚠️ | |
| Token refresh: network error keeps tokens (only 400/401 clears) | ⚠️ | |
| Merge — recipes by ID | ❌ | BUG-012 reproduced: independent imports survive as two IDs; repeated remote IDs also survive. Same-ID starters reconcile to 12 correctly. |
| Merge — recipe-states union `cookedAt`, OR `wantToCook`, first non-null rating | ⚠️ | |
| Merge — history union by `cookedAt` ISO, sorted | ⚠️ | |
| Merge — favourites set-union | ⚠️ | |
| Recipe import during delayed Dropbox download | ❌ | BUG-012: review stays saveable after matching remote recipe arrives; synthetic browser reproduction, 2026-09-23. |
| Fresh-device seed after starter deletion/replacement | ❌ | BUG-012: deleted starter reappears next to imported variation, 12 → 13. |
| Other two-device races / stale-data-on-restore | ⚠️ | Remaining flows untested; BUG-012 transport is mocked, not live Dropbox. |

## UI states

| State | Status | Notes |
|-------|--------|-------|
| Empty library | ⚠️ | |
| Sparse library (<5) → GettingStartedSection | ⚠️ | |
| Loading skeletons | ⚠️ | |
| Enrichment-in-flight placeholders (nutrition / Thermomix) | ⚠️ | 90s fallback timeout |
| Error boundary / 404 | ⚠️ | |
| Boot / hydration (homepage greeting + recipes grid render) | smoke-boot | ✅ once `npm run smoke` wired |

## Enrichment (deferred, post-save)

| Path | Status | Notes |
|------|--------|-------|
| Nutrition estimate — success | ⚠️ | Haiku |
| Nutrition estimate — timeout/failure → "Macros unavailable" | ⚠️ | |
| Thermomix steps — success | ⚠️ | |
| Thermomix steps — no match → "not suitable" vs genuine timeout | ⚠️ | BUG-007 class |
| Time split — success / unknown "—" | ⚠️ | |

## Accessibility / motion

| Check | Status | Notes |
|-------|--------|-------|
| `prefers-reduced-motion` caps all animation to 0.01ms | ⚠️ | CSS override exists |
| Tap targets ≥ 44px | ⚠️ | |
| Hover-only affordances have a touch path (card actions) | ⚠️ | Principle #9 red flag |

---

### How to extend coverage
- Parser/pure-function behaviour → add to `src/__tests__/` (vitest), name the test after the bug/behaviour.
- Boot / render regressions → `scripts/smoke-boot.mjs` already guards homepage + recipes grid; add routes there.
- Sync + multi-device → currently manual; the two-device race is the most valuable thing to automate next.
