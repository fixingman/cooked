# Cooked

An interactive recipe PWA built for iPad, mobile, and desktop. Step-by-step cooking mode, Thermomix support, and offline-first Dropbox sync.

**Version:** 0.5.0

---

## Features

- **Recipe browsing** — search, multi-select category filters (Breakfast, Lunch, Dinner, Vegetarian, Thermomix, etc.), sort by rating / time / difficulty, grid and list views
- **Recipe detail** — hero photo, prep + cook time, servings adjuster that scales all ingredient quantities, full method
- **Cooking mode** — full-screen step-by-step flow, step-specific ingredient highlights, countdown timer (user-started), swipe gestures, keyboard shortcuts (← → to navigate, space to toggle timer)
- **Thermomix mode** — alternative step panels with speed, temperature, and time for compatible recipes; toggle per-recipe and globally in Settings
- **Dropbox sync** — offline-first persistence; settings, favourites, and cooking history sync to your own Dropbox (`/Apps/Cooked/`). Works without Dropbox too — falls back to localStorage silently
- **Favourites** — heart any recipe, persists across sessions
- **Cooking history** — completing a recipe records it; rate it on the completion screen; shows in "Recently Cooked" on the homepage
- **PWA** — installable on iOS and Android, works offline

---

## Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| PWA | @ducanh2912/next-pwa |
| Fonts | Playfair Display + Inter (via next/font) |
| Deploy | Netlify |

---

## Getting started

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_DROPBOX_APP_KEY` | No | Enables Dropbox sync. Create an app at [developer.dropbox.com](https://developer.dropbox.com) (App folder type). |

Without the Dropbox key the app runs normally — data stays in localStorage only.

### Dropbox setup (optional)

1. Create an app at [developer.dropbox.com](https://developer.dropbox.com) → App folder type → any name
2. Under **OAuth 2 → Redirect URIs** add:
   - `http://localhost:3000/auth/dropbox/callback`
   - `https://your-production-domain.com/auth/dropbox/callback`
3. Copy the App key → set `NEXT_PUBLIC_DROPBOX_APP_KEY` in your environment
4. In the app go to Settings → Cloud Sync → Connect

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                        # Homepage
│   ├── recipes/page.tsx                # Recipe browser
│   ├── recipes/[slug]/page.tsx         # Recipe detail
│   ├── recipes/[slug]/cook/page.tsx    # Cooking mode
│   ├── settings/page.tsx               # Settings
│   ├── auth/dropbox/callback/page.tsx  # OAuth callback
│   └── api/dropbox/                    # Token exchange + refresh proxies
│
├── components/
│   ├── cooking/        # CookingShell, TimerBlock, StepIngredients, StepNavControls, CompletionScreen, ThermomixStepPanel
│   ├── home/           # FeaturedHero, MealTimeSection, ContinueCooking
│   ├── layout/         # AppShell, BottomNav, SideNav
│   ├── recipe-detail/  # RecipeHero, ServingsAdjuster, IngredientList, StartCookingButton
│   ├── recipes/        # RecipeCard, RecipeGrid, SearchBar, CategoryChips, ViewToggle
│   ├── settings/       # UnitToggle, DietaryPreferences, ThermomixToggle, DropboxConnect
│   └── ui/             # Button, Chip, Badge, FoodImage, ProgressRing, AnimatedNumber
│
├── hooks/
│   ├── useDropboxAuth.ts     # PKCE OAuth, token refresh
│   ├── useDropboxSync.ts     # Generic offline-first sync primitive
│   ├── useSettings.ts        # User settings (synced)
│   ├── useFavourites.ts      # Favourited recipe IDs (synced)
│   ├── useCookingHistory.ts  # Cook history + ratings (synced)
│   ├── useCookingTimer.ts    # Step countdown timer
│   ├── useRecipeFilter.ts    # Browse filter + sort state
│   ├── useServingsScale.ts   # Ingredient quantity scaling
│   └── useSwipeGesture.ts    # Touch swipe detection
│
├── lib/
│   ├── dropbox/        # pkce.ts, tokens.ts, client.ts
│   ├── recipes.ts      # getRecipe(), getRecipes(), getFeaturedRecipe()
│   ├── scaleIngredient.ts
│   └── formatTime.ts
│
├── data/
│   ├── recipes.ts          # 12 built-in recipes
│   └── cookingHistory.ts   # Seed data for first-run history
│
└── types/
    ├── recipe.ts
    └── settings.ts
```

---

## Versioning

Follows `A.B.C` semver:

- **A** — re-architecture, backend change, breaking data model
- **B** — new user-facing feature or route
- **C** — bug fix, polish, build fix

Both `package.json` and the version label in `src/app/settings/page.tsx` are updated on every release.

| Version | Notes |
|---|---|
| 0.1.0 | Full UI prototype |
| 0.2.0 | Thermomix cooking mode |
| 0.3.0 | UX polish: step ingredients, favourites, keyboard shortcuts, browse filters |
| 0.4.0 | Multi-select category filter chips |
| 0.4.1 | Timer fix, controls layout, ESLint build fixes |
| 0.5.0 | Dropbox file sync, real cooking history |
