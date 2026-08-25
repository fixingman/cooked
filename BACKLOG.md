# Cooked — Backlog

> 🔴 Not started · 🟡 In progress · ✅ Shipped

---

## All items

| # | Title | Status | Version |
|---|-------|--------|---------|
| F-1 | Pantry — widget + modal, Dropbox-synced | ✅ Shipped | 0.19.0 |
| F-3 | AI Suggestions & Creation — prompt bar, suggest + generate | ✅ Shipped | 0.17.0 |
| F-4 | Photo import — Claude vision | ✅ Shipped | 0.12.0 |
| F-5 | Recipe ranking engine + "For You" carousel | ✅ Shipped | 0.20.0 |
| F-6 | Auth & User Profiles (Supabase magic link / Google) | 🔴 Not started | — |
| F-7 | Database (Supabase Postgres) — depends on F-6 | 🔴 Not started | — |
| F-8 | Meal Planner — weekly calendar + shopping list | 🔴 Not started | — |
| F-9 | Shopping List — /shopping, add-from-recipe, check→pantry | ✅ Shipped | 0.23.0 |
| F-10 | Bookmarklet / Web Share Target — one-click capture | ✅ Shipped | 0.20.16 |
| F-11 | Collections / Folders — named recipe groups | 🔴 Not started | — |
| F-12 | Ingredient Substitution (AI) — swap icon → Haiku suggestions | ✅ Shipped | 0.26.0 |
| F-13 | Branding — custom app icon, wordmark, visual delight | ✅ Shipped | 0.27.1 |
| F-14 | AI recipe creation — FlavorGraph pairings, GeneratedRecipeModal | ✅ Shipped | 0.22.0 |
| U-23 | Quick-bookmark from recipe card (long-press / hover) | 🔴 Not started | — |
| U-24 | Wire mic & camera permission toggles in Settings | 🔴 Not started | — |
| U-30 | Cooking tip of the day — homepage section | 🔴 Not started | — |
| U-31 | Unified import input — single field, auto-detected mode | 🔴 Not started | — |
| U-32 | Recipe timeline view — phase bar + ingredient×step matrix | 🔴 Not started | — |
| U-25 | Richer greeting variety — 10–12 per time slot, daily rotation | ✅ Shipped | 0.18.0 |
| U-29 | Homepage improvements — carousels, empty states, sparse-library | ✅ Shipped | 0.27.0 |

---

## Open features

### 🔴 F-15 — Full Offline Mode
**What:** The app is already offline-first for reading (localStorage + PWA service worker cache), but several flows break without a connection: import, AI generation, image refresh, Dropbox sync. True offline mode means the cook can use every saved recipe — including cook mode, pantry, and shopping list — with zero network, and queued writes sync when connectivity returns.
**Why it matters for PWA:** PWA users add Cooked to their home screen and expect native-app behaviour. A "No connection" failure mid-cook is a trust-breaker. The Dropbox sync layer already has a `pendingRef` flush-on-reconnect pattern; extend it to all mutations.
**Scope decisions needed:**
- Service worker strategy: cache-first for all app routes + API responses that can be stale (recipe data, pantry, shopping list) — currently only static assets are cached.
- Import / AI routes: these genuinely require a server; offline should show a clear "saved for when you're back online" queue rather than a silent failure or spinner.
- Dropbox: already resilient (network errors keep tokens, `window.online` flushes pending). Check: does it queue multiple pending writes or only the last one?
- Manifest `display: standalone` is already set; confirm `offline_enabled` behaviour in Chromium PWA.
**Dependencies:** None blocking. Builds on existing `useDropboxSync` pendingRef pattern.

### 🔴 U-31 — Unified Import Input
**What:** Collapse the three-tab import modal (URL / Paste / Photo) into a single input field — "Paste a recipe, a link, or drop a photo" — that auto-detects the mode. Small mode pills below (Link · Text · Photo) appear as indicators of what was detected, not as tabs to switch between. Photo mode still needs an explicit button/drop target since there's no text to detect.
**Why:** Tabbed import adds friction, especially on mobile where switching tabs and scrolling back to the field breaks flow. Single-field UX is faster and matches how people actually think ("I have a thing, I want to import it").
**Decisions needed:** What happens when auto-detection is wrong (URL pasted but user wanted text)? Probably: allow manual override via the mode pills. Bookmarklet/Share Target flow still routes to same modal — confirm params still work. Edge case: YouTube URLs (currently intercepted early) still need the URL path.
**Scope:** Import modal UI only — no backend changes needed.

### 🔴 U-32 — Recipe Timeline View
**What:** A horizontal timeline bar on the recipe detail page (not in cook mode). Collapsed: a single pill row showing main phases (Prep · Cook · Rest) with time durations. Tap/click to expand into a lightweight matrix — ingredients appear as small tags on the left and "enter" the timeline at the step where they're first used. Reveals parallelism: what can happen simultaneously, which ingredients appear late.
**Why:** Cooked's step list hides dependency structure. The Cooking for Engineers table format (and RecipeTables) shows it clearly — but too dense and engineer-brained for Cooked's warmth. This is the inspired, lighter version: scannable at a glance, warm in aesthetics.
**Constraints:** Detail page only. Must pass the Wallpaper Test — someone should want to glance at this every cook, not just once. Avoid Gantt-chart feel. AI-structured data (steps with timing) is already stored; matrix mapping (which ingredient enters at which step) requires a new inference pass either at import time or on demand.
**Decisions needed:** Static collapse/expand vs always-expanded on desktop? Where on the page (above steps, or tab alongside them)? Ingredient tags: show qty or name-only? Generate the matrix via AI on import or parse from step text at render time?

### 🔴 F-11 — Collections / Folders
Group recipes into named collections ("Sunday roasts", "Quick weeknight"). A recipe can belong to multiple collections. "Add to collection" from the recipe ··· menu. Dropbox-synced.

### 🔴 F-8 — Meal Planner
**What:** Weekly calendar. Drag recipes into days. Auto-generates a combined shopping list for the week.
**Why later:** High value, high effort. Mobile drag-and-drop is hard. Builds on F-9 Shopping List infrastructure.
**Decisions needed:** 7-day vs rolling week · integration with the shopping list · Dropbox sync shape.

### 🔴 F-6 — Auth & User Profiles
Supabase Auth (magic link or Google). Needed for social features, multi-device without Dropbox, public collection sharing. Not urgent while Dropbox covers persistence.

### 🔴 F-7 — Database
Supabase Postgres. Server-side querying, multi-user, recipe search at scale. **Depends on F-6.**

---

## Open UX / polish

| # | Description | Area | Notes |
|---|-------------|------|-------|
| U-30 | Cooking tip of the day | Homepage | Small daily tip section on the homepage — technique, substitution, or pantry trick. Rotates daily. Decisions needed: static curated list vs AI-generated; placement (below greeting or bottom of page); Wallpaper Test applies. |
| U-31 | Unified import input | Import modal | Collapse URL/Paste/Photo tabs into one field with auto-detected mode pills. See Open features for full spec. |
| U-32 | Recipe timeline view | Recipe detail | Collapsed phase bar → expandable ingredient×step matrix. See Open features for full spec. |
| U-24 | Wire mic & camera permission toggles | Settings | Toggles are dead UI. Call `navigator.mediaDevices.getUserMedia` / `navigator.permissions.query`, reflect live browser state. Effectively a bug. |
| U-23 | Quick-bookmark from recipe card | Recipe list | Long-press / hover bookmark action. Bookmark currently only on detail page. (Note: card hover already has "add to shopping" as of 0.25.0.) |

---

## Not Implementing

Explicit rejections — recorded so we don't relitigate them. Reopen only with a new reason.

| Idea | Why not |
|------|---------|
| Social — comments, follows, shares, public profiles | Cooked is a *private* cooking journal (Principle 7). No social graph until the personal experience is complete. |
| Gamification — streaks, points, badges, challenges | Pulls against "the cook is the hero, not the app" (Principle 1). Attention-seeking, not cooking-serving. |
| Marketplace — premium recipes, subscriptions, ads | Out of scope; would compromise privacy + the personal-tool feel. |
| Real-time collaboration | Multi-user editing is a different product; Dropbox per-user sync covers the personal multi-device need. |
| Restaurant / professional kitchen features | Home cook is the audience. Pro workflows are a different product. |
| Literal paper textures / skeuomorphism — grain, ruled lines, noise overlays, stamp rings | Tried in v0.21.0, reverted as too literal. Warmth comes from type, colour, and motion — not faux materials. |

## Watch Decisions

Choices that need a future check-in once novelty wears off. **Day-14 Wallpaper Test** follow-ups for recently shipped recurring surfaces (see PRODUCT.md → The Wallpaper Test):

| Surface | Decision to revisit | Check |
|---------|--------------------|-------|
| Greeting variety (U-25) | 10–12 greetings per slot, daily rotation — does it still feel fresh, or has it become wallpaper? | Day-14: do the greetings still land, or should they pull in real context (what you cooked, what's in the pantry)? |
| Homepage carousels (U-29) | "For You" / "Ready to Cook" / meal-time rails — do they surface genuinely useful picks or the same recipes every visit? | Re-check ranking signal quality once the library is larger; watch for the same 3 recipes always topping "For You". |
| AI suggestion prompt (F-3 / F-14) | Prompt bar + example prompts — do users return to it, or ignore after first try? | Watch usage; if ignored, reconsider placement or whether it earns homepage real estate. |
| Enrichment chips / placeholders | Status chips during deferred enrichment — informative or noise once trusted? | If enrichment is reliable, consider quieting to a single subtle indicator. |

---

## ✅ Shipped log

| Feature | Version |
|---------|---------|
| Full UI prototype — 5 routes, 12 recipes, PWA | 0.1.0 |
| Thermomix cooking mode | 0.2.0 |
| UX polish — favourites, keyboard shortcuts, filters, skeletons | 0.3.0 |
| Multi-select filter chips | 0.4.0 |
| Dropbox file sync — offline-first persistence | 0.5.0 |
| Recipe URL import + sharing | 0.6.0 |
| Edit / delete user recipes | 0.7.0 |
| Attribution + Dropbox image hosting | 0.8.0 |
| Error handling — 404, error boundary, URL validation | 0.8.2 |
| Performance — memo, lazy init, animation cap | 0.8.3 |
| Recipe States — Want to Cook / Has Cooked | 0.9.0 |
| Smart homepage carousels — Phase A | 0.10.0 |
| Wake lock · Web Worker timer · PWA offline cache | 0.10.1–0.10.2 |
| Nutrition panel + AI fill-in on import | 0.10.3 |
| Mark as Cooked + rating + cooking notes | 0.11.0 |
| F-4 Photo import — Claude vision | 0.12.0 |
| Full macro breakdown + undo mark as cooked | 0.12.6–0.12.7 |
| Thermomix steps + macro nutrition on import | 0.13.0 |
| Grouped filter chips — meal time, type, diet | 0.13.1 |
| Extended nutrition panel — sugar, sodium, sat/trans fat, cholesterol | 0.14.0 |
| Image quality pipeline — thumbnail stripping, Unsplash fallback, HF upscaling | 0.15.0 |
| Retroactive Thermomix enrichment in Settings | 0.15.2 |
| Import fetch layer — Chrome UA, retry, streaming early-exit | 0.16.3 |
| Non-English recipe import + translation | 0.16.4 |
| F-3 AI Suggestions & Creation — prompt bar, suggest + generate | 0.17.0 |
| U-25 Richer greeting variety | 0.18.0 |
| F-1 Pantry — homepage widget + modal, Dropbox-synced | 0.19.0 |
| Pantry — export/import, category grouping, AI categorise | 0.19.3 |
| Pantry — add ingredients from recipe detail | 0.19.5 |
| Pantry — fuzzy matching (strips prep context) | 0.19.9 |
| F-5 Recipe ranking engine + "For You" carousel | 0.20.0 |
| Paste-text import — auth-gated sites (Cookidoo, NYT) | 0.20.5 |
| Deferred nutrition + enrichment placeholders on recipe page | 0.20.8–0.20.10 |
| Change-image picker · duplicate-import block | 0.20.11–0.20.12 |
| F-10 Bookmarklet / Web Share Target — one-click capture | 0.20.16–0.20.30 |
| Typography refresh (Texturina + Fraunces) + voice & delight | 0.21.0 |
| F-14 AI recipe creation — FlavorGraph pairings, GeneratedRecipeModal, Regenerate | 0.22.0 |
| First-run seed — 12 starter recipes | 0.22.0 |
| F-9 Shopping List — /shopping, add-from-recipe (skip pantry), dedupe + sum qty, check→pantry | 0.23.0 |
| Pantry ⇄ Shopping loop — low items flow to the list, restock clears low | 0.24.0 |
| UI font → Alegreya Sans · recipe-card "add to shopping" hover · larger wordmark · pantry from shopping list | 0.25.0–0.25.3 |
| F-12 Ingredient Substitution (AI) — tap ingredient → Haiku swaps with ratio notes, dietary-aware, read-only sheet | 0.26.0 |
| U-29 Homepage improvements — cross-carousel dedup, "Ready to Cook" pantry carousel, sparse-library empty state, contextual hero label | 0.27.0 |
| F-13 Branding & Visual Delight — gradient icon + filled flame; card image zoom + deeper shadow; saffron step circles + dashed connector; ingredient ◆ ornament | 0.27.1 |
| BUG-013 fix: blurry homepage thumbnails — correct `sizes`, Dropbox image resolution on all home carousels | 0.27.2 |
| YouTube import — paste video URL, Claude extracts recipe from description, thumbnail auto-fetched | 0.28.0 |
| Cookidoo + NYT Cooking import — paste-mode guidance, TM notation preserved via `sourceHint`, NYT step cleanup | 0.28.2 |
| JSON-LD parser hardening — `parseServings` from descriptive strings, HTML `recipeInstructions`, mixed-number fractions | 0.28.1 |
| Project standards — TEST_MATRIX.md, AUDIT.md, pre-commit checklist, trigger phrases, smoke boot test | 0.29.0 |
| What's New in Settings — `src/data/changelog.ts` user-facing changelog; version line derives from `changelog[0].version` | 0.29.0 |
| BUG-014 fix: homepage hydration mismatch — `mounted` gate on greeting, carousels, recipe count | 0.29.1 |
| Shopping list grouped by category (`inferCategory` reuse); "running low" per-item label removed | 0.29.2 |
| Settings toggles visual fix — `overflow-hidden` on track clips thumb within rounded corners | 0.29.3 |
| Notion page import — `loadPageChunk` internal API, block tree traversal, hero image from first image block | 0.29.4–0.29.5 |
| Pantry ⇄ Shopping category sync — AI categorise covers both lists, category travels on low-mark and check-off | 0.30.0 |
