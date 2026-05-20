# Cooked — Feature Backlog

> Decisions needed are marked 🔴. In progress 🟡. Shipped ✅.
> Planned features are ordered by build priority — each tier unlocks the next.

---

## Bugs

*No known bugs.*

---

## UX / Polish

Ordered by user-facing impact. These are quick wins that don't require a feature build.

| # | Description | Area | Notes |
|---|-------------|------|-------|
| ~~U-18~~ | ~~Edit / delete user-imported recipes~~ | ~~Recipe detail~~ | ✅ Shipped 2026-05-20 |
| U-19 | Nutritional values panel per recipe | Recipe detail | Show calories, protein, fat, carbs per serving; adjust with servings scaler; data from JSON-LD import or hand-authored |
| U-16 | No related recipes at bottom of recipe detail | Recipe detail | Keeps users in the app longer, good for session depth |
| U-13 | AI toggle has no "coming soon" label — looks broken | Settings | 30-min fix, removes confusion |
| U-4 | Progress ring in cooking nav is ambiguous — looks like timer progress, actually shows step progress | Cooking mode | Minor labelling issue |
| U-12 | Camera / Mic permission toggles do nothing — no browser permission request | Settings | Lowest priority, users accept UI-only state |

---

## ✅ 0 — Real Recipe Content + Attribution + Image Hosting — Shipped 2026-05-20

**Why first:** The 12 mock recipes limit user testing credibility and prevent meaningful validation of search, ranking, and AI features. Real content also validates the URL import pipeline against actual websites — which will be bumpy and needs iteration before users hit it.

---

### Attribution rules

Every recipe has a `sourceType` that drives how attribution is displayed. This needs to be added to the `Recipe` type now, before the collection grows, so every recipe has clean provenance.

```ts
// Add to src/types/recipe.ts
type RecipeSource = "builtin" | "url" | "image" | "authored";

interface Recipe {
  // ... existing fields
  sourceType: RecipeSource;
  sourceUrl?: string;   // URL-imported: the original page URL
}
```

**Display rules (recipe detail page, below the title):**

| sourceType | Display |
|---|---|
| `"url"` | `From: [hostname]` — tappable link to `sourceUrl` |
| `"image"` | `Scanned from photo` — no link (source image lives in Dropbox) |
| `"authored"` | `By Me` — or the user's Dropbox display name if connected |
| `"builtin"` | `By [authorName]` — e.g. "Cooked Kitchen" |

For `"url"` imports: `authorName` comes from the site's JSON-LD `author` field or falls back to the hostname. `sourceUrl` is the full page URL. Both are already captured by the import parser.

For `"authored"` recipes: `authorName` should default to the Dropbox account's `displayName` if connected, otherwise "Me". The import modal already has access to `useDropboxAuth` — can read `accountName` there.

Recipe cards don't need a source badge — keep cards clean. Attribution belongs on the detail page only.

---

### Image hosting in Dropbox

**The problem with CDN URLs:** URL-imported recipes currently store the original site's image URL (e.g. `https://images.nytimes.com/...`). These links break when:
- The source site restructures their CDN
- The recipe is deleted or paywalled
- The image URL has auth tokens that expire

**The solution:** Download the image during import and store it in the user's Dropbox at `/images/[recipeId].jpg`. The recipe JSON then stores the Dropbox path, not the original URL.

**Architecture:**

```
Import flow:
  API route fetches page → extracts heroImageUrl from JSON-LD
  → returns imageUrl to client alongside recipe draft

Client (ImportRecipeModal on save):
  → fetch the image URL (client-side, avoids CORS via a proxy or direct)
  → upload binary to Dropbox: PUT /images/[id].jpg
  → store "/images/[id].jpg" as heroImageDropboxPath in the recipe JSON
  → heroImageUrl stays as the original CDN URL (fallback if Dropbox fetch fails)
```

**Display resolution — `useDropboxImage(path)` hook:**

```ts
// New hook: resolves a Dropbox path to a displayable URL
// Caches the 4h temporary link in localStorage with expiry
useDropboxImage("/images/abc123.jpg") → "https://dl.dropboxusercontent.com/..."
```

Dropbox's `files/get_temporary_link` API returns a direct download URL valid for 4 hours. Cache it in localStorage keyed by path + expiry timestamp. On cache miss or expiry, fetch a fresh link silently. If Dropbox is disconnected, fall back to `heroImageUrl` (the original CDN URL).

The `Recipe` type gets one additional optional field:
```ts
heroImageDropboxPath?: string;  // "/images/[id].jpg" — preferred over heroImageUrl when set
```

`FoodImage` component stays unchanged — the resolution happens at the recipe-data level before props are passed.

**For hand-authored recipes:** the user picks an image from their device (photo library or camera). The import modal (or a future "Create recipe" modal) handles the upload. Same `/images/[id].jpg` path.

**For built-in recipes:** keep Unsplash URLs. These are stable CDN links and don't need Dropbox hosting.

---

### Recipe acquisition strategy

**Phase 1 — URL import testing (do this first, now)**

Before adding any recipes, we need to validate the URL import parser across real sites. Expected results vary widely. Test each site, document what works, fix the parser iteratively.

| Site | Expected | Known issues |
|---|---|---|
| BBC Good Food | ✅ Excellent JSON-LD | — |
| AllRecipes | ✅ Good JSON-LD | Images sometimes use CDN tokens |
| Food52 | ✅ Good JSON-LD | Author field is a person object |
| Serious Eats | ✅ Good JSON-LD | — |
| Bon Appétit | ⚠️ Partial | JSON-LD present but image may be missing |
| Sally's Baking Addiction | ✅ Good JSON-LD | — |
| NYT Cooking | ❌ Paywalled | Server-side fetch returns a login wall, not the recipe |
| Epicurious | ⚠️ Partial | JSON-LD structure varies by era of article |
| Jamie Oliver | ✅ Good JSON-LD | — |
| Ottolenghi | ⚠️ Unknown | Test needed |

**Process:** Import one recipe at a time. Review the parsed output in the review screen. If steps are missing, merged, or ingredients are garbled — note it and fix the parser before adding the next batch.

**Phase 2 — Build the collection to 30+ recipes**

Target: 30 recipes across all meal times and categories before user testing. Mix of:
- URL-imported (fastest, tests the pipeline)
- Hand-authored (full control of quality, steps, timings, and Thermomix variants)

**Recommended split for first 30:**

| Category | Count | Why |
|---|---|---|
| Dinner (weeknight) | 10 | Highest daily use case |
| Breakfast | 5 | Second most common |
| Lunch | 4 | Often lighter — salads, soups |
| Dessert | 4 | High engagement, photogenic |
| Vegetarian | 4 | Covers the dietary filter |
| Thermomix | 5–8 | Overlapping with above, needs TM variants |
| Quick (≤30 min) | 5–6 | Overlapping, powers the "quick" filter chip |

**Phase 3 — Content quality pass**

After import, review every recipe for:
- Step granularity (5–12 steps is the sweet spot for cooking mode)
- Ingredient IDs cross-referenced to steps (powers step ingredient highlights)
- `durationSeconds` on any step with a timer (baking, simmering, resting)
- Thermomix variant written for TM-compatible recipes
- A real hero photo in Dropbox (not a CDN link)
- Accurate `difficulty`, `prepTimeMinutes`, `cookTimeMinutes`

---

### Data model changes needed (code work)

1. **`src/types/recipe.ts`** — add `sourceType: RecipeSource`, `sourceUrl?: string`, `heroImageDropboxPath?: string`
2. **`src/lib/parseJsonLd.ts`** — set `sourceType: "url"` and `sourceUrl` on import
3. **`src/lib/dropbox/client.ts`** — add `uploadImage(token, path, blob)` and `getTemporaryLink(token, path)`
4. **`src/hooks/useDropboxImage.ts`** — new hook, resolves path → cached temp URL
5. **`src/app/recipes/[slug]/page.tsx`** — render attribution row below title using `sourceType`/`sourceUrl`
6. **`src/components/recipes/ImportRecipeModal.tsx`** — on save: download image → upload to Dropbox → set `heroImageDropboxPath`
7. **`src/data/recipes.ts`** — add `sourceType: "builtin"` to all 12 existing recipes (no `sourceUrl`)

---

### Known hard problems

🔴 **Paywalled sites** — NYT Cooking, Washington Post Food, etc. The server-side fetch hits a login wall. We can detect this (check if the fetched HTML contains `<meta name="robots" content="noindex">` or if JSON-LD is absent despite being a known recipe site) and return a clear error: "This recipe is behind a paywall — try copying the URL after logging in, or add it manually."

🔴 **Bot detection** — Some sites (Serious Eats, Bon Appétit) use Cloudflare bot protection. The server-side fetch may get a 403 or a JS challenge page. Mitigation: vary User-Agent, add realistic headers, add a Referer header. Ultimate fallback: Claude extraction from the page text if available.

🔴 **Image download during import** — Fetching the hero image client-side will fail for images with CORS restrictions (most CDNs). Solution: download the image server-side in the API route and return it as base64. This increases the API response size by ~100–500KB for one image — acceptable for an import flow.

🔴 **Dropbox image upload during save** — The `files/upload` call is straightforward but adds 1–2 seconds to the save flow. Show a progress state in the modal: "Saving image…" before "Done."

**Depends on:** ✅ URL Import shipped — use it to build the collection. Image hosting builds on the existing Dropbox client.

---

## 🔴 1 — Pantry

**Why first in this tier:** The pantry is the connective tissue between what the user has and what they can cook. It directly enables the Recipe Ranking feature (pantry match signal) and gives the AI suggestions feature real context. Without it, personalisation is guesswork. It also has standalone daily value — users can check "what can I make tonight?" without any AI at all.

### Where it lives

A dedicated **Pantry tab** in the bottom nav / side nav — fourth item alongside Home, Recipes, and Settings. This gives it persistent visibility; burying it in Settings would kill usage. The nav item uses a `ShoppingBasket` or `Refrigerator` icon.

The pantry also has two integration points in other parts of the app:
- **Recipe detail:** "Add all to pantry" button — one tap to mark that you bought everything for this recipe. Appears alongside the servings adjuster.
- **Completion screen:** "Mark used ingredients as done" — after cooking, offer to remove used items from the pantry, or reduce quantities if tracking amounts.

### Data shape

```ts
// Dropbox: /pantry.json — localStorage key: cooked-pantry
interface PantryItem {
  id: string;             // uuid
  name: string;           // normalised lowercase, e.g. "olive oil", "eggs"
  addedAt: string;        // ISO timestamp — used for "last updated" display
  category?: PantryCategory;
}

type PantryCategory =
  | "produce"       // fresh fruit, veg, herbs
  | "dairy"         // milk, eggs, cheese, butter
  | "meat"          // chicken, beef, fish
  | "pantry"        // dried goods, tins, oils, condiments
  | "frozen"        // freezer items
  | "other";
```

**No quantities in v1.** Tracking "½ bottle of olive oil" adds enormous UX complexity (unit reconciliation, partial-use flows) for little ranking value. The pantry is binary: you have it or you don't. Quantities can come later once the core habit is established.

### Entry UX

**Primary: type-ahead search bar at the top of the Pantry screen.**

- Single input, always focused when Pantry opens
- Autocomplete against a bundled list of ~500 common ingredients (loaded client-side, no API call)
- Fuzzy match — "tom" surfaces "tomatoes", "tomato paste", "sun-dried tomatoes"
- Hit Enter or tap a suggestion to add. Item appears immediately below with a brief pop-in animation
- "New ingredient" option at the bottom of suggestions for items not in the list — lets user add anything freeform

**Secondary: "Add all ingredients" from recipe detail.**

- Button below the ingredient list: "Add ingredients to pantry"
- Tapping it opens a checklist of all recipe ingredients, pre-checked
- User unchecks anything they already have / don't want to add
- One "Add X items" confirm tap — batch adds to pantry
- This is the highest-frequency entry path for active users

**Tertiary: paste a shopping list (future / stretch).**

- A "Paste list" option that accepts raw text ("eggs\nmilk\nflour") and creates items for each line
- Good for users who shop from a notes app

### Pantry screen layout

```
┌─────────────────────────────┐
│ [🔍 Search or add...      ] │  ← always focused on load
│                             │
│ PRODUCE          [edit]     │
│  ● tomatoes                 │
│  ● spinach                  │
│                             │
│ DAIRY                       │
│  ● eggs                     │
│  ● parmesan                 │
│                             │
│ PANTRY STAPLES              │
│  ● olive oil                │
│  ● pasta                    │
│                             │
│ [Clear all]    [X items]    │
└─────────────────────────────┘
```

Items grouped by category. Each item has a tap-to-remove interaction (tap the name → it greys out and disappears after 300ms with a swipe-left confirm). Long press = edit name.

### Maintenance

The hardest problem: pantry lists go stale. Users add eggs, cook with them, forget to remove them. A stale pantry makes the ranking feature worse than no pantry at all.

Three strategies to keep it fresh without being annoying:

1. **Post-cook nudge.** After completing a recipe on the CompletionScreen, show: "You used these ingredients — remove from pantry?" with a checklist of the step-matched ingredients. One-tap confirmation. This is the highest-signal moment to update.

2. **Staleness banner (not a push notification).** If the pantry hasn't been updated in 14 days, show a subtle yellow banner at the top of the Pantry screen: "Last updated 2 weeks ago — is this still accurate?" with a "Review" CTA that highlights each item for quick keep/remove. No pinging the user; they see it when they visit.

3. **"I just shopped" shortcut.** A "Restock from recipe" button on the recipe detail — marks all ingredients for that recipe as available. For users who cook the same recipes weekly, this is a one-tap pantry refresh.

Avoid: expiry timers, push notifications about stale pantry, automatic removal. These create anxiety and false precision. The pantry should feel like a helpful memory aid, not a task system.

### Open questions

🔴 **Should pantry items auto-remove when a recipe is cooked?** Risk: user cooks with half the eggs — not fully removed. Better as an opt-in nudge (see post-cook nudge above).

🔴 **Ingredient matching for ranking — exact or fuzzy?** "chicken breast" in pantry vs. "chicken thighs" in recipe. Fuzzy match on the root word ("chicken") is more useful but risks false positives ("coconut cream" vs. "cream"). Decision needed before building the ranking signal.

🔴 **Category assignment — manual or auto?** Auto-categorising "eggs" as dairy is easy; "tahini" is less obvious. Suggest: auto-assign from the bundled ingredient list (each item tagged with a category), fall back to "other" for freeform items. Manual re-categorisation in an edit flow.

**Depends on:** ✅ Dropbox sync — storage pattern is identical to favourites.

---

## 🔴 2 — Recipe States (Cooked & Want to Cook)

**Why first:** Directly improves the core cooking loop and drives retention. The app's primary job is getting users to cook — tracking intent (want to cook) and completion (cooked) closes that loop. This also feeds the ranking system and homepage personalisation. Depends on Dropbox for persistence (already shipped).

Track two user-intent states per recipe, separate from favourites.

**States:**
- `wantToCook` — user bookmarks a recipe to try later ("cook list"). Distinct from favouriting — favourite = loved it, want to cook = haven't tried yet.
- `cooked` — records that the user completed this recipe at least once. Feeds the ranking system and history. Automatically set when CompletionScreen is reached; user can also manually mark from recipe detail.

**Data shape:**
```ts
// stored in Dropbox /history.json + localStorage
interface RecipeState {
  recipeId: string;
  cookedAt?: string[];   // ISO timestamps, one per cook
  wantToCook: boolean;
  rating?: number;       // 1–5, set on CompletionScreen
}
```

**UX (initial ideas — not finalised):**
- Recipe detail: a bookmark icon for "want to cook" alongside the existing heart (favourite)
- Recipe card: a subtle "✓ Cooked" badge or faint tick overlay for recipes the user has made
- Browse: a "Want to Cook" filter chip to surface the cook list
- Homepage: a "Your cook list" or "Up next" rail showing want-to-cook recipes
- CompletionScreen: already captures rating — will also mark `cooked` automatically

**Open questions:**
- Does completing a cook auto-remove it from the want-to-cook list?
- How many cook-list items before we need a dedicated page?
- Should the recipe card overlay be opt-in (too cluttered otherwise)?

**Depends on:** ✅ Dropbox sync

---

## ✅ Recipe Import (URL / Paste from Website) — Shipped

---

## 🔴 3 — AI Recipe Suggestions & Creation

**Why third:** The differentiating feature — no other recipe app does this well. Two distinct modes with different complexity. "Suggest from library" is nearly free to ship (stateless, just Claude + existing recipes, no DB needed). "Create new recipe" reuses the import review/edit flow. Ship suggestion mode first for quick impact, creation mode follows.

**Two modes:**

*Suggest from library* — given a natural-language prompt ("something quick and comforting", "spicy vegetarian dinner", "I have chicken and lemon"), Claude ranks or filters the existing 12 recipes and explains why each fits. No new content generated. Can ship independently of Dropbox.

*Generate a new recipe* — user describes a vibe, difficulty, dietary needs, or specific ingredients and Claude creates a full recipe (title, ingredients with quantities, step-by-step method, timing). Presented in the same review/edit screen as imported recipes before saving.

**Input surfaces (TBD — UX not designed yet):**
- A prompt bar on the homepage or browse page ("What are you in the mood for?")
- A dedicated "Create" tab or fab button
- In-context on the browse empty state ("Nothing matches — want Claude to make something?")

**Constraints:**
- Requires `aiEnabled` toggle to be on (already in settings)
- API key must be server-side only — route handler proxies the Claude call
- Generated recipes stored in user's personal collection (Dropbox)

**Depends on:** ✅ Dropbox sync, Recipe Import flow (same save/edit UX)

---

## 🔴 4 — Recipe Import (Photo Scan)

**Why fourth:** Same value as URL import but more magical — great for physical cookbooks, handwritten cards, and screenshots. Ships after URL import because it reuses the same review/edit/save flow; only the extraction step differs. Building URL import first validates that shared flow.

- Use Claude vision API to extract title, ingredients, steps, servings, time from the photo
- Present extracted data in an editable review screen before saving
- Handle noisy/partial images gracefully (flag missing fields)
- Save to user's personal recipe collection in Dropbox

**Depends on:** ✅ Dropbox sync, Recipe Import (URL) — reuses the review/save flow

---

## 🔴 5 — Recipe Ranking

**Why fifth:** A personalisation layer that only becomes meaningful once there's enough signal — favourites, cook history, want-to-cook list. Surfacing it before those exist produces no value. Once the data is there, a "For You" sort option is a high-delight, low-effort addition.

Personalised relevance score that re-orders the recipe browse feed based on what the user has, likes, and has done.

**Signals (additive, weighted):**
- Pantry match — ingredients the user has marked as available overlap with recipe ingredients → higher rank. More overlap = higher boost.
- Favourited — recipes the user has hearted float to the top.
- Cooked before — recipes with a cook history entry get a mild boost (proven they like it) unless already favourited.
- Want to cook — recipes on the "want to cook" list get a strong boost.
- Recency penalty — recipes cooked very recently are slightly depressed so the feed stays fresh.

**UX considerations:**
- Ranking only activates when the user has enough signal (pantry > 0 or favourites > 0). Default sort unchanged until then.
- Surfaced as a "For You" sort option in the browse dropdown, not forced on by default.

**Depends on:** Recipe States, ✅ Dropbox sync

---

## 🔴 6 — Auth & User Profiles

**Why sixth:** Dropbox PKCE is the near-term auth story — it gets users a private, persistent data store without building a user system. Traditional auth becomes necessary when social features, shared recipes, or cross-platform collaboration are on the roadmap. Not urgent while Dropbox covers the use case.

- Sign in (email magic link or Google via Supabase Auth)
- Saved / favourited recipes per user (currently handled by Dropbox)
- Personal dietary preferences persisted server-side
- Required before multi-user or social features

**Depends on:** Decision to move beyond Dropbox as persistence layer

---

## 🔴 7 — Database & Persistence

**Why last:** Dropbox covers all near-term persistence needs at zero cost and zero server overhead. Supabase becomes the right call when the recipe collection needs to be queryable server-side, when multi-user features are needed, or when the Dropbox approach hits a ceiling. Not urgent.

- Move recipes from mock TypeScript arrays to Supabase (Postgres)
- Store Thermomix step variants in DB alongside standard steps
- Personal recipe collection (imported + saved recipes per user)
- User cooking history (real, not mock)
- Supabase recommended over Vercel Postgres (app is on Netlify)

**Depends on:** Auth & User Profiles

---

## ✅ Shipped

| Feature | Date |
|---------|------|
| Full UI prototype — 5 routes, 12 recipes, Framer Motion, PWA | 2026-05-18 |
| Thermomix cooking mode — settings toggle, recipe toggle, TM step panel, 7 recipes | 2026-05-18 |
| Design tokens — `header-top`, `page-x`, `section-y`, `card-p` | 2026-05-19 |
| Favourites persistence via localStorage (`useFavourites` hook) | 2026-05-19 |
| Homepage meal time section now server-side time-aware | 2026-05-19 |
| Recently Cooked + meal time cards show difficulty + time | 2026-05-19 |
| Homepage skeleton (`loading.tsx`) — no more blank flash on first load | 2026-05-19 |
| Back button uses `router.back()` with `/recipes` fallback | 2026-05-19 |
| Cooking mode left panel: step-specific ingredient list (`StepIngredients`) | 2026-05-19 |
| Cooking mode instruction text vertically centred — no empty space below | 2026-05-19 |
| Keyboard shortcuts in cooking mode (space=timer, arrows=navigate) | 2026-05-19 |
| Timer no longer auto-starts on step navigation — user-initiated | 2026-05-19 |
| Step nav controls distributed full-width | 2026-05-19 |
| Start Cooking bar hidden until user scrolls past hero | 2026-05-19 |
| Prep + cook time shown separately in recipe meta bar | 2026-05-19 |
| Recipe browse: sort by rating / time / difficulty | 2026-05-19 |
| Recipe browse: Thermomix filter chip | 2026-05-19 |
| Recipe browse: multi-select category filter chips (AND logic) | 2026-05-19 |
| Recipe browse: empty state when no results | 2026-05-19 |
| "See all →" on homepage preserves meal time context | 2026-05-19 |
| Dropbox file sync — offline-first persistence (settings, favourites, history) | 2026-05-20 |
| Real cooking history — records on CompletionScreen, rating updates in-place | 2026-05-20 |
| Reset to defaults removed from Settings | 2026-05-20 |
| Scroll hijack on back-navigation fixed (removed smooth scroll + y-translation) | 2026-05-20 |
| Recipe card hover: scrim lifts instead of image zoom | 2026-05-20 |
| Recipe sharing — copy URL button in hero with ✓ confirmation flash | 2026-05-20 |
| Dropbox sync status in Settings — live "Syncing…" indicator + "Last synced X ago" timestamp | 2026-05-20 |
| Recipe import from URL — JSON-LD extraction + Claude fallback, review/edit sheet, saves to Dropbox | 2026-05-20 |
| Edit / delete user recipes — three-dot menu, edit sheet reuses import modal, delete confirmation | 2026-05-20 |
| Attribution + image hosting — sourceType on all recipes, attribution row on detail page, hero images archived to Dropbox /images/ | 2026-05-20 |
