# Cooked — Product Principles & Design Guidelines

> The red thread. Reference when evaluating features, UI changes, and technical decisions. Flag anything that pulls against these principles before building.

---

## What Cooked Is

A **personal cooking companion** — not a recipe database, not a social platform, not a tech showcase. It lives on your phone, iPad, or computer. The experience adapts to the screen you're on: glanceable on desktop, touch-first on mobile, comfortable on tablet. It knows what you have, what you like, and how you cook. It gets out of the way when you're actually cooking.

**The core loop:** Find a recipe → import it from anywhere → cook it with guidance → remember that you made it.

---

## Product Principles

### 1. The cook is the hero, not the app
Features exist to serve the person cooking. The app should feel like a quiet, helpful presence — not something demanding attention. In cooking mode this is absolute: full screen, no chrome, no distractions.

> **Red flag:** Features that make the app more visible without making cooking easier. Badges, streaks, "share your dish" prompts.

### 2. One recipe at a time, deeply
Built around deep engagement with a single recipe — not a scroll feed, not a catalogue. Opening a recipe should feel like opening a page in a well-loved cookbook: everything you need, nothing you don't.

> **Red flag:** Infinite scroll patterns, feed-style density, carousels that feel like "content."

### 3. Friction-free import
Any recipe — any source, any language, any format (URL, photo, paste, informal notes) — should be importable in seconds. The hard work of extraction is the app's job, not the user's.

> **Red flag:** Import flows requiring manual cleanup, forms with many required fields, format restrictions.

### 4. Intelligence in the background
AI enrichment (nutrition, Thermomix, servings, translation, time estimates) happens *after* save and *never* blocks the user. Show progress without demanding attention.

> **Red flag:** AI calls that block import/save, spinners that prevent moving forward, prominent errors for non-critical enrichment.

### 5. Offline-first, always available
Works in the kitchen without reliable connectivity. Recipes are in localStorage first. Dropbox sync is background and resilient — a network error should never corrupt state or log the user out.

> **Red flag:** Features that require server round-trips to render, sync that overwrites local state without merging.

### 6. Progressive disclosure
Show essentials first: title, image, time, servings, ingredients, steps. Reveal depth on demand: full nutrition, Thermomix parameters, cooking history, notes. Complexity is always opt-in.

> **Red flag:** Showing all nutrition fields by default, expanding every panel, surfacing secondary metadata in the primary view.

### 7. Personal, not social
A private cooking journal. No public profiles, no follower counts, no "what your friends are cooking." Social features are out of scope until the personal experience is complete.

> **Red flag:** Features requiring other users, public-facing URLs, social graphs.

### 8. Privacy by default
User data — recipes, history, pantry, ratings, notes — belongs to the user and stays with the user. No analytics, no telemetry, no third-party data sharing. Sync is via the user's own Dropbox account. AI calls to the Anthropic API are the only external data flow and should be minimised to what's strictly necessary.

> **Red flag:** Logging recipe content server-side, storing user data on Cooked infrastructure, third-party tracking SDKs, any feature requiring user data to leave the user's own cloud storage.

### 9. Works on every screen
Mobile is the primary kitchen context (one-handed, locked screen, greasy fingers), but iPad and desktop are real use cases. Layouts must be considered and tested at all three breakpoints.

> **Red flag:** Mobile-only interactions that break on wider viewports, or hover-only affordances used as the sole interaction path.

---

## The Wallpaper Test

> *Does this recurring surface deliver fresh value **every** time it appears — or is it just present?*

Apply this to any surface the user sees repeatedly: the greeting, the "For You" and meal-time carousels, enrichment chips, AI suggestion prompts, the pantry widget, toasts, badges. A surface becomes wallpaper the moment its output is predictable — same trigger, same shape, same takeaway every time.

The cost isn't cognitive load (a quiet line is cheap to ignore). The cost is that **a surface which doesn't pay rent teaches the user to stop looking at it — and drags its neighbours down too.** Once one panel is reflexively skipped, the eye learns to skip that whole region.

**The bar:** every appearance must deliver something — information the screen doesn't already show, an action worth taking *now*, or a feeling that's genuinely fresh. **Day 1 is not the test. Day 14 is.** A greeting is charming on first launch and invisible by the second week unless it earns its place.

Run this check before shipping any recurring surface, and add a **day-14 follow-up** to BACKLOG.md "Watch Decisions" so we actually re-evaluate it once novelty has worn off.

---

## Voice & Tone

Warm, unpretentious, knowledgeable. Like a friend who cooks well.

- **Not** clinical: "Nutritional data has been estimated."
- **Not** precious: "An artisanal culinary experience."
- **Not** tech-forward: "AI-powered recipe extraction."
- **Yes:** "Made with care." / "What are you craving?" / "Hope it was delicious."

Error messages are specific but not technical. Success messages are brief and genuine. Helper text feels like a tip from a friend, not a manual entry. Privacy is stated as a fact, not a disclaimer.

---

## Design Language

### Visual feel
A well-worn cookbook. Warm parchment pages, dark ink type, a single flame of colour. Analog warmth in a digital product — suggest texture and craft without literal skeuomorphism.

### Colour

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Background | `parchment-100` | `#FAF7F2` | App background |
| Surface | `parchment-200` | `#F5F0E8` | Cards, inputs, panels |
| Border | `parchment-300` | `#EDE5D8` | Dividers, card edges |
| Primary text | `ink-900` | `#1A1208` | Headlines, body |
| Muted text | `ink-500` | `#7A6A52` | Labels, metadata |
| Accent | `saffron-500` | `#E8890C` | Logo, active states, import CTAs |
| Action | `sage-500` | `#6B8C5F` | Save/confirm, "cooked" states |

**Rule:** Saffron = identity and attention. Sage = action and completion. Never swap them. Never introduce blue.

### Typography

| Role | Font | Notes |
|------|------|-------|
| Display / H1 | Texturina | Large headings, greeting, recipe hero title. Lining figures (`lnum`, `pnum`). |
| Subheads / H2–H3 / serif numbers | Fraunces | Section headers, card titles, servings, nutrition values, timer, Thermomix values. |
| Body / UI / labels | Inter | Everything functional — buttons, inputs, metadata, labels. |

**Rule:** Display fonts carry the cookbook personality. Sans handles all functional UI. Never use display fonts on small interactive elements.

### Shape & space

- **Cards:** `rounded-card` (20px)
- **Chips/pills:** `rounded-chip` (9999px)
- **Panels/modals:** `rounded-panel` (32px)
- **Page padding:** `px-4` horizontal, `py-6` section vertical
- **Bottom nav:** 64px — always account for with padding

### Motion

- Spring physics, not linear easing. `type: "spring", bounce: 0.2` for layout shifts.
- `whileTap={{ scale: 0.95–0.96 }}` on all tappable elements.
- Entry: fade + slide-up (`y: 8 → 0, opacity: 0 → 1`) over 300–400ms.
- `prefers-reduced-motion`: all animations capped to 0.01ms.
- **Rule:** Motion communicates state, never decorates. Remove any animation that doesn't help the user understand what happened.

### Component rules

**Chips:** Inactive: `bg-parchment-200 text-ink-700`. Active: `bg-ink-900 text-parchment-100`. Never saffron or sage for active filter state.

**Primary CTAs:** Save/confirm → `bg-sage-500`. Import actions → `bg-saffron-500`. Full width inside modals.

**Section headers:** Always `text-label uppercase tracking-widest text-ink-400`.

**Toasts:** Always `bg-ink-900 text-parchment-100 rounded-xl`, bottom of screen, brief.

---

## Feature Evaluation Checklist

Before building anything:

1. Does it serve the cook? Can you describe how it helps someone make a meal?
2. Does it work offline? If server-dependent, does it degrade gracefully?
3. Does it respect cooking mode? No interruptions during an active cook session.
4. Is it personal? No requirement for other users, public content, or social graphs.
5. Does it fit the visual language? Parchment, ink, saffron, warmth — or does it feel foreign?
6. Is complexity proportional to value? A complex feature for a rare edge case should wait.
7. If it's a recurring surface, does it pass the Wallpaper Test? Will it still deliver fresh value on day 14?

---

## Explicit Non-Goals (for now)

- Social: comments, follows, shares, public profiles
- Gamification: streaks, points, badges, challenges
- Marketplace: premium recipes, subscriptions, ads
- Real-time collaboration
- Restaurant or professional kitchen use cases

---

## Backlog Priority Order

1. Core loop reliability — import, cook, remember: faster, more reliable, more formats
2. Existing data made more useful — ranking, pantry matching, nutrition accuracy
3. New entry points — more import sources, languages, formats
4. New dimensions — collections, shopping list, meal planner
5. Infrastructure — auth, database — when the personal experience is complete
