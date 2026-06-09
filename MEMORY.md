# Cooked — Project Memory

> Update when architecture, conventions, or design decisions change.

---

## Overview
Recipe PWA · iPad-first, mobile + desktop · Awwwards-quality motion · `npm run dev` → http://localhost:3031
Inspired by NYT Cooking (editorial aesthetic) + Thermomix (step-by-step cooking UX)

## Stack
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Lucide React · next-pwa · Netlify deploy · Dropbox PKCE sync

## Key Architecture Rules
- Server Components by default; `"use client"` only for `useState`/Framer Motion leaf components
- Next.js 14: `params` is a plain object `{ slug: string }` (not a Promise — that's Next.js 15+)
- Offline-first: `localStorage (instant) → React state (UI) → Dropbox (debounced 1500ms)`
- Dropbox downloads: max once per 15 min per path (`lastDownloadedAt` module map)
- User recipe slugs always prefixed `user-` — used as guard throughout the app

## Routes
| Route | Type | Notes |
|-------|------|-------|
| `/` | Server | Homepage: greeting, featured hero, meal rails, history |
| `/recipes` | Client | Grid/list, search, filter chips, sort |
| `/recipes/[slug]` | Client | Hero, meta, servings adjuster, ingredients, steps, attribution |
| `/recipes/[slug]/cook` | Server | Full-screen cooking mode — no nav shell |
| `/shopping` | Client | Shopping list — add from recipe, dedupe + sum qty, check→pantry |
| `/settings` | Client | Units, dietary, AI toggle, Dropbox connect |
| `/share` | Server | Web Share Target — redirects to `/?share_url=…` for native share sheet |
| `/auth/dropbox/callback` | Client | PKCE OAuth callback |
| `/api/dropbox/token` | Route | Exchange code for tokens |
| `/api/dropbox/refresh` | Route | Refresh access token |
| `/api/recipes/import` | Route | Fetch URL → JSON-LD parse → Claude fallback → returns recipe + heroImageBase64 |
| `/api/recipes/import-text` | Route | Paste-text import — Claude extraction on user-pasted HTML/text |
| `/api/recipes/import-photo` | Route | Photo import — Claude vision |
| `/api/recipes/enrich-thermomix` | Route | Post-save Thermomix step generation |
| `/api/recipes/estimate-nutrition` | Route | Deferred macro estimation (Haiku) |
| `/api/recipes/estimate-times` | Route | Deferred prep/cook time split (Haiku) |
| `/api/recipes/ingredient-substitutes` | Route | AI substitution suggestions (Haiku) |
| `/api/recipes/refresh-image` | Route | Manual image refresh — HF upscale + Unsplash fallback |
| `/api/recipes/search-images` | Route | Unsplash search for image picker |
| `/api/recipes/ai-suggest` | Route | AI suggest/generate recipes from prompt |
| `/api/flavor/pairings` | Route | FlavorGraph-style ingredient pairings |
| `/api/pantry/categorise` | Route | AI categorise pantry items (Haiku) |

## Dropbox Synced Files
| Dropbox path | Hook | localStorage key |
|---|---|---|
| `/settings.json` | `useSettings` | `cooked-settings` |
| `/favourites.json` | `useFavourites` | `cooked-favourites` |
| `/history.json` | `useCookingHistory` | `cooked-history` |
| `/recipes/index.json` | `useUserRecipes` | `cooked-user-recipes` |
| `/images/[id].jpg` | `useDropboxImage` | `cooked-img-cache:[path]` (4h TTL) |
| `/pantry.json` | `usePantry` | `cooked-pantry` |
| `/shopping-list.json` | `useShoppingList` | `cooked-shopping-list` |

## Data Model
```ts
type RecipeSource = "builtin" | "url" | "image" | "authored"
interface Recipe {
  id, slug, title, subtitle?, heroImageUrl, authorName
  sourceType?: RecipeSource; sourceUrl?; heroImageDropboxPath?
  cuisine, mealTimes[], difficulty, dietaryTags[]
  prepTimeMinutes, cookTimeMinutes, totalTimeMinutes, servings, calories?
  rating, reviewCount, tags[], description, chefNotes?
  isFeatured?, thermomixAvailable?, ingredients[], steps[]
}
// 12 built-in recipes in src/data/recipes.ts — sourceType: "builtin", Unsplash hero images
// User recipes: stored in Dropbox, slug prefixed "user-", sourceType: "url"|"authored"|"image"
```

## Design System
**Colors** (`tailwind.config.ts`):
`parchment-100` #FAF7F2 bg · `parchment-200` #F5F0E8 cards · `parchment-300` #EDE5D8 borders
`ink-900` #1A1208 headings · `ink-700` #3D3020 body · `ink-500` #7A6A52 meta · `ink-300` #BBA98E disabled
`saffron-500` #E8890C CTAs/nav · `sage-500` #6B8C5F cooking actions

**Typography:** `font-display` Texturina (hero headings) · `font-serif` Fraunces (recipe titles, steps) · `font-sans` Alegreya Sans 400/500/700 (UI, labels, body)
Custom: `text-display` 3.5rem · `text-label` 0.75rem 600 uppercase · `text-timer-lg` 4.5rem 300

**Easing:** spring `cubic-bezier(0.34,1.56,0.64,1)` taps · smooth `cubic-bezier(0.16,1,0.3,1)` nav · snap `cubic-bezier(0.25,0.46,0.45,0.94)` toggles

## Animations
| Interaction | Pattern |
|---|---|
| Page nav | opacity + y:16→0, 380ms smooth |
| Recipe grid | stagger 60ms, opacity+y+scale |
| Cooking step | directional slide x:±60→0, `AnimatePresence mode="wait"` |
| Buttons | `whileTap={{ scale: 0.85–0.95 }}` |
| Nav indicator | `layoutId="nav-indicator"` shared layout |
| `prefers-reduced-motion` | CSS override: all durations 0.01ms |

## Cooking Mode
Split layout (md+): left = food image + timer, right = step instruction. Stacked on mobile.
`StepNavControls`: prev · progress ring · next (last step → ChefHat → CompletionScreen)
`useCookingTimer`: start/pause/reset, auto-resets on step change. `useSwipeGesture`: 50px threshold.

## Key Hooks
`useDropboxSync<T>` — generic sync primitive used by all data hooks
`useDropboxAuth` — PKCE OAuth, returns `{ status, accountName, connect, disconnect, getValidAccessToken }`
`useDropboxImage(path)` — resolves `/images/[id].jpg` → 4h cached Dropbox temp URL
`useUserRecipes` — `addRecipe` (upsert by id), `removeRecipe`, `getUserRecipe(slug)`
`usePantry` + `useShoppingList` — pantry↔shopping coordination is done inline in `PantryModal` (toggle low on the same `usePantry` instance that renders, then call `addFromPantry`/`removeFromPantry`). NOTE: `useDropboxSync` state is per-instance — don't toggle one surface from a different hook instance than the one rendering, or the UI won't update.
`useServingsScale` — scale factor for ingredient quantities
`useRecipeFilter` — filter reducer: query/category/dietary/sort/viewMode

## PWA
Manifest: `public/manifest.json` · standalone · theme `#FAF7F2`
Icons: `public/icons/` 192px, 512px (maskable), 180px apple-touch
SW disabled in dev · CacheFirst Unsplash images (30d, max 60)
