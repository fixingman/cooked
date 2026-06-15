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

## Sync edge cases (`useDropboxSync` + per-hook merge)

| Case | Status | Notes |
|------|--------|-------|
| Offline create → localStorage persists | ⚠️ | |
| Reconnect flushes `pendingRef` (`window.online`) | ⚠️ | |
| Token refresh: network error keeps tokens (only 400/401 clears) | ⚠️ | |
| Merge — recipes union-by-id (local-only prepended) | ⚠️ | |
| Merge — recipe-states union `cookedAt`, OR `wantToCook`, first non-null rating | ⚠️ | |
| Merge — history union by `cookedAt` ISO, sorted | ⚠️ | |
| Merge — favourites set-union | ⚠️ | |
| Two-device race / stale-data-on-restore | ⚠️ | Highest-risk path; needs deliberate two-device test |

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
