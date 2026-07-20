# ProductThinking.md

## 1. North Star

**Cooked owns the moment when a home cook reaches for their phone in the kitchen** — not to scroll, not to search the web, but to find something they've already decided is worth making. The product succeeds when that reach feels like opening a well-worn notebook, not launching an app.

The core loop is: find a recipe → import it from anywhere → cook it with guidance → remember that you made it. Everything else is in service of this loop.

---

## 2. What This Product Is Not

These are closed decisions. Reopen only with a materially new argument.

**Social features** (comments, follows, public profiles, sharing to feeds)
Cooked is a private cooking journal. The user's recipe collection, cooking history, and pantry are personal data that should not leak into a social graph. The cook's data serves the cook, not an audience.

**Gamification** (streaks, points, badges, leaderboards)
The act of cooking is the reward. Extrinsic mechanics shift the user's motivation from "I want to cook this" to "I need to maintain my streak." That is attention-seeking, not cooking-serving. The cook is the hero, not the app.

**Marketplace / monetisation of recipe content** (premium recipes, ads, affiliate links)
Would compromise the privacy guarantee and the personal-tool feel. Once recipes are commodities, the product becomes a catalogue, not a companion.

**Real-time collaboration / multi-user editing**
Dropbox sync already solves the legitimate multi-device need (one person, multiple devices). True multi-user is a different product with different trust, conflict-resolution, and data-ownership requirements.

**Pro-kitchen / restaurant features**
Scaling recipes for 50 covers, cost-per-plate, supplier management — a different audience with different constraints. Home cook is the explicit scope boundary.

**Skeuomorphic or decorative UI** (grain textures, ruled lines, noise overlays, stamp rings)
Tried in v0.21.0, reverted. Warmth in the UI comes from typography, colour, and motion — not from simulating physical materials. Adding texture has a cost (weight, distraction, maintenance) that the benefit never justified.

---

## 3. Core Design Principles

**1. Import first, enrich later.**
Blocking the user on AI enrichment (Thermomix steps, nutrition, time estimates) during import is wrong even when the enrichment succeeds — it burns Netlify budget and makes the failure mode a timeout. Every AI task that isn't needed to render the recipe page is deferred to post-save client-side. A recipe in the library with approximate data is better than one that never arrived.

**2. The user's data leaves the device only on their terms.**
Recipes sync to the user's own Dropbox, not a shared server. No analytics SDK, no telemetry, no third-party tracking. AI calls go to Anthropic (server-side only, key never reaches the client). Unsplash images are fetched server-side. The user can inspect every file Cooked has written. If a feature requires storing user data somewhere the user doesn't control, it needs a stronger justification than convenience.

**3. Ambient intelligence — configure once, benefit silently.**
Dietary preferences, pantry contents, cooking history, and favourites should shape what the user sees without requiring them to re-state preferences on every interaction. A vegetarian user shouldn't have to filter every time. A pantry-stocked user should see "Ready to Cook" carousels without asking. If a user has to repeat a preference they already set, something is broken.

**4. Consistency across surfaces beats novelty on any one surface.**
The right-panel slide-in pattern (PantryModal, SubstituteSheet) is one pattern, not two. The ingredient normalisation in pantry, shopping list, and cook mode uses one shared `normalizeForMatch()` function. The version bump touches exactly three files every time. When a new surface or interaction feels like it needs its own pattern, look for the existing pattern first.

**5. Never block on the AI budget.**
The Netlify function limit is 30 seconds. Every API route has `maxDuration = 30`. Haiku handles anything numeric or formulaic (nutrition estimates, time splits, substitutes, concept generation). Sonnet handles extraction and generation where quality matters. A failed AI call must leave the recipe usable — never prevent it from saving.

**6. Progressive disclosure.**
Show essentials first: title, image, time, servings, ingredients, steps. Reveal depth on demand: full nutrition, Thermomix parameters, cooking history, notes. Complexity is always opt-in. Never show all nutrition fields by default, expand every panel, or surface secondary metadata in the primary view.

---

## 4. The Recurring Surface Test (The Wallpaper Test)

Before shipping any surface the user will encounter repeatedly, ask:

> *On day 14 — after novelty has worn off — does this surface deliver information the screen doesn't already show, an action worth taking right now, or a feeling that's genuinely different from last time? Or has it become wallpaper?*

**To pass:**
- The content must vary in a way the user cares about (not just rotate through a fixed list)
- The worst-case output (stale data, empty state, same result as yesterday) must still be useful, not embarrassing
- The surface must earn its position — if it's below the fold or skipped, that's a signal

**If it stops passing:**
Remove it or replace it with something that earns its place. Do not add a "dismiss" button — that's admitting the surface lost and leaving the corpse visible.

**Current surfaces on watch (see BACKLOG.md → Watch Decisions for check-in schedule):**

| Surface | What to watch |
|---------|--------------|
| Greeting rotation (U-25) | Do the greetings still feel fresh, or should they pull in real context (what you cooked, what's in the pantry)? |
| Homepage carousels (U-29) | Do they surface genuinely useful picks, or the same 3 recipes every visit? Re-check ranking signal quality once the library is larger. |
| AI suggestion prompt (F-3/F-14) | Do users return to it, or ignore after first try? If ignored, reconsider placement or whether it earns homepage real estate. |
| Enrichment chips / placeholders | If enrichment is reliable, consider quieting to a single subtle indicator. |

---

## 5. Decision Log

| Area | Decision | Reason |
|------|----------|--------|
| Persistence | Dropbox PKCE, not Supabase | User controls their own data; no backend to maintain; works offline-first naturally |
| Conflict resolution | Union-by-id then name-dedup for shopping | Prevents data loss on multi-device; dedup pass cleans up pre-existing duplicates on next sync |
| AI enrichment timing | Deferred post-save (Thermomix, nutrition, time) | Netlify 30s budget; import must complete; enrichment failure leaves recipe usable |
| AI model selection | Haiku for numeric/fast tasks; Sonnet for extraction/generation | Cost and latency; Haiku is sufficient for structured output where schema is tight |
| Concept picker | 4 concepts before full generation | Avoids committing Sonnet budget to a recipe the user might not want; Haiku concepts are cheap |
| Dietary preferences | Silent always-on filter, not a chip | User stated a preference once; re-stating it per session is friction; chip state is for browsing, not identity |
| Substitute sheet | Right-panel slide-in, all screen sizes | Consistent with PantryModal; bottom-sheet-on-mobile / modal-on-desktop was two patterns masquerading as one |
| Shopping dedup | Name-based merge after id-union | Pure id-union allowed same ingredient to appear twice when added on two devices offline |
| Recipe import | Streaming early-exit on complete JSON-LD block | Pages can be 200KB+; reading past the JSON-LD wastes time and risks timeout |
| Skeuomorphism | Reverted after v0.21.0 | Warmth comes from type, colour, and motion — not faux materials; cost outweighed benefit |
| Social / gamification | Not implementing | Closed — see §2 |

---

*This document describes how we think, not what we've built. If a proposed feature passes all five sections without contradiction, it's probably worth building. If it conflicts with §2 or §3, it needs a stronger argument than "users might like it."*
