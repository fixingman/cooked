# Cooked — Project Memory

> Living reference document. Update this whenever architecture, design decisions, or conventions change.

---

## App Overview

**Name:** Cooked  
**Type:** Interactive Recipe PWA — iPad-first, mobile + desktop responsive  
**Status:** UI-only prototype (no backend, no auth, no database)  
**Quality bar:** Awwwards-level — every motion intentional, every pixel deliberate  
**Dev server:** `npm run dev` → http://localhost:3031  
**Inspired by:** NYT Cooking (editorial aesthetic) + Thermomix (step-by-step cooking UX)

---

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^3.4.1 |
| Animation | Framer Motion | ^12.38.0 |
| Icons | Lucide React | ^1.16.0 |
| PWA | @ducanh2912/next-pwa | ^10.2.9 |
| Date utils | date-fns | ^4.1.0 |
| Class utility | clsx | ^2.1.1 |

**Key architectural decisions:**
- Pages are Server Components by default; only leaf components that need `useState`/Framer Motion are `"use client"`
- All data is mock (imported TypeScript arrays) — no fetch, no loading state needed
- Settings persisted to `localStorage` via `useSettings` hook
- In Next.js 14, `params` is a plain object `{ slug: string }`, NOT a Promise (that's Next.js 15+)

---

## Routes & Pages

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/` | `src/app/page.tsx` | Server | Homepage: greeting + featured hero + meal rails + history |
| `/recipes` | `src/app/recipes/page.tsx` | Client | Grid/list, search, category filter |
| `/recipes/[slug]` | `src/app/recipes/[slug]/page.tsx` | Client | Detail: hero, meta, servings adjuster, ingredients, steps |
| `/recipes/[slug]/cook` | `src/app/recipes/[slug]/cook/page.tsx` | Server | Full-screen cooking mode, no nav |
| `/settings` | `src/app/settings/page.tsx` | Client | Units, dietary, AI, permissions |

**Cooking mode special behaviour:** `AppShell` detects `pathname.endsWith('/cook')` and renders no nav shell — full-screen takeover.

---

## File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root: fonts, PWA meta, AppShell
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # CSS custom properties, Tailwind base
│   ├── recipes/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── cook/page.tsx
│   └── settings/page.tsx
│
├── components/
│   ├── layout/                   # AppShell, BottomNav, SideNav, PageTransition
│   ├── home/                     # TimeGreeting, FeaturedHero, MealTimeSection, ContinueCooking
│   ├── recipes/                  # RecipeCard, RecipeGrid, SearchBar, CategoryChips, ViewToggle
│   ├── recipe-detail/            # RecipeHero, ServingsAdjuster, IngredientList, InstructionSteps, StartCookingButton
│   ├── cooking/                  # CookingShell, TimerBlock, StepDisplay, IngredientContext, StepNavControls, VoiceNoteButton, CompletionScreen
│   ├── settings/                 # UnitToggle, DietaryPreferences, PermissionToggle, AIIntegrationToggle
│   └── ui/                       # Button, Chip, Badge, FoodImage, ProgressRing, AnimatedNumber
│
├── hooks/
│   ├── useCookingTimer.ts        # Countdown timer: start/pause/reset/toggle
│   ├── useRecipeFilter.ts        # Filter reducer: query/category/dietary/viewMode
│   ├── useServingsScale.ts       # Scales ingredient quantities; min 1 serving
│   ├── useSettings.ts            # localStorage settings with update() + toggleDietary()
│   ├── useSwipeGesture.ts        # Touch swipe detection (threshold: 50px)
│   └── useTimeOfDay.ts           # morning/afternoon/evening with greeting + mealTime
│
├── lib/
│   ├── cn.ts                     # clsx wrapper for conditional classes
│   ├── formatTime.ts             # formatSeconds(), formatMinutes(), pad()
│   ├── recipes.ts                # getRecipe(), getRecipes(), getFeaturedRecipe(), getRecipesByMealTime(), getRelatedRecipes()
│   └── scaleIngredient.ts        # scaleQuantity() — scales + formats as Unicode fractions (½, ¼, etc.)
│
├── data/
│   ├── recipes.ts                # 12 mock recipes (full data — ingredients + steps)
│   └── cookingHistory.ts         # 3 mock history entries
│
└── types/
    ├── recipe.ts                 # Recipe, Ingredient, CookingStep, CookingHistoryEntry + union types
    └── settings.ts               # UserSettings, UnitSystem, DEFAULT_SETTINGS
```

---

## Design System

### Color Palette (`tailwind.config.ts`)

| Token | Hex | Role |
|-------|-----|------|
| `parchment-100` | `#FAF7F2` | App background (main) |
| `parchment-200` | `#F5F0E8` | Card surfaces |
| `parchment-300` | `#EDE5D8` | Borders, dividers |
| `ink-900` | `#1A1208` | Primary headings |
| `ink-700` | `#3D3020` | Body text |
| `ink-500` | `#7A6A52` | Secondary/meta text |
| `ink-300` | `#BBA98E` | Placeholders, disabled |
| `saffron-500` | `#E8890C` | Primary CTAs, active nav, accents |
| `saffron-400` | `#F59E3F` | Hover states |
| `sage-500` | `#6B8C5F` | Cooking action colour (Start Cooking) |
| `sage-100` | `#E8EDE5` | Light sage backgrounds |

### Typography

| Token | Usage |
|-------|-------|
| `font-serif` | Playfair Display — headings, recipe titles, step instructions |
| `font-sans` | Inter — UI labels, body text, navigation |
| `text-display` | 3.5rem — Homepage hero greeting |
| `text-label` | 0.75rem 600 — Uppercase tracked labels |
| `text-timer-lg` | 4.5rem 300 — Cooking mode digit cards |

### Easing Curves
- **Spring** `cubic-bezier(0.34, 1.56, 0.64, 1)` — tactile (button taps, chip selection)
- **Smooth** `cubic-bezier(0.16, 1, 0.3, 1)` — fluid navigation (page transitions)
- **Snap** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — quick settle (toggles)

---

## Animation Principles

| Interaction | Animation |
|-------------|-----------|
| Page navigation | opacity + y:16→0, 380ms smooth |
| Recipe grid cards | Stagger 60ms, opacity + y + scale reveal |
| Cooking step → next | Directional slide x:±60→0, `AnimatePresence mode="wait"` |
| Servings +/- buttons | `whileTap={{ scale: 0.82 }}` spring |
| Nav active indicator | `layoutId="nav-indicator"` shared layout spring |
| Timer progress ring | SVG `stroke-dashoffset`, 500ms ease |
| `prefers-reduced-motion` | CSS override: all durations 0.01ms |

---

## Component Library (ui/)

| Component | Notes |
|-----------|-------|
| `Button` | variant (primary/secondary/ghost/danger), size (sm/md/lg), icon. `whileTap` spring. |
| `Chip` | Black when active, parchment when inactive |
| `Badge` | variant (default/difficulty/cuisine/dietary). Difficulty: easy=sage, medium=saffron, hard=red |
| `FoodImage` | Next/Image wrapper with skeleton + Unsplash fallback on error |
| `ProgressRing` | SVG circle, animated `stroke-dashoffset` |
| `AnimatedNumber` | Framer Motion spring — use for countdown timers |

---

## Data Model Highlights

**Recipe** (12 in `src/data/recipes.ts`):
- Unsplash hero images (`?w=1200&q=80`)
- `isFeatured: true` on Carbonara (homepage hero)
- `durationSeconds` on steps triggers timer in cooking mode
- `dietaryTags` drives dietary badge + filter
- `mealTimes: MealTime[]` — a recipe can belong to multiple meal times

**Ingredient scaling:** `scaleQuantity(qty, servings/baseServings)` converts decimals to fractions. Imperial support via `unitImperial` + `quantityImperial` fields.

**Settings** (`localStorage` key: `"cooked-settings"`):
- `units: "metric" | "imperial"` — controls which ingredient values render
- `dietaryPreferences`, `aiEnabled`, `microphoneEnabled`, `cameraEnabled`, `darkMode`

---

## Cooking Mode Details

- **Layout:** Split — left half (food image + timer), right half (step instruction) on md+. Stack on mobile.
- **Step navigation:** `StepNavControls` — prev (disabled on step 1), progress ring center, next chevron. On last step, next becomes a ChefHat button that triggers `CompletionScreen`.
- **Timer:** `useCookingTimer` — start/pause/reset. Resets automatically on step change.
- **Swipe:** `useSwipeGesture` — left/right touch gestures (50px threshold) navigate steps.
- **Completion:** `CompletionScreen` overlay — "You cooked it!", 5-star rating, Browse More / View Recipe.

---

## PWA Configuration

- **Manifest:** `public/manifest.json` — name "Cooked", `display: standalone`, theme `#FAF7F2`
- **Icons:** `public/icons/` — 192px, 512px (maskable), 180px (apple-touch)
- **Disabled in dev** (`NODE_ENV === "development"`)
- **Cache strategy:** CacheFirst for Unsplash images (30 days, max 60 entries)

---

## Collaboration Style

- Claude acts as **designer + product manager**: researches, designs, presents options with tradeoffs
- **User is the decision maker** — nothing significant ships without approval
- Before implementing any meaningful change, Claude presents a plan for review
- For trivial fixes, proceed and report; for features or architecture, plan first
