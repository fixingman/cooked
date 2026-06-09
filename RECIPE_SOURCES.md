# Recipe Sources — Import Optimisation Targets

> Sites we import from often. Use this to prioritise parser work and record
> site-specific quirks. Update when a site changes its markup or a new quirk is found.
> See the fetch/parse pipeline notes in `CLAUDE.md` → "Recipe import pipeline".

**Legend** — Parse path: `JSON-LD` (fast path) · `Claude` (full-page extraction fallback) ·
`Googlebot` (SPA prerender retry) · `Paste` (auth-gated, user pastes text).
Status: ✅ reliable · ⚠️ works with a workaround · ❌ needs work.

---

## ⭐ My frequent sites
> _Add the sites you use most here — I'll profile each one and tune parsing._

| Site | Domain | Parse path | Status | Notes |
|------|--------|-----------|--------|-------|
| _(tell me your go-to sites and I'll fill these in)_ | | | | |

---

## Already handled / characterised (from the codebase)

| Site | Domain | Parse path | Status | Notes |
|------|--------|-----------|--------|-------|
| BBC Good Food | bbcgoodfood.com | JSON-LD | ✅ | Full JSON-LD incl. nutrition. Clean fast path. |
| BBC Food | bbc.co.uk/food | JSON-LD | ✅ | Dual metric/imperial measures joined by slash with no space (`400ml/14fl oz`, `50g/1¾oz`) broke the quantity regex → qty 0. Fixed v0.26.1 via `stripDualUnit()` (keep metric, drop imperial). |
| Waitrose | waitrose.com | JSON-LD | ✅ | JSON-LD in `<head>`, 80KB+ page → stream early-exit on `</head>`. |
| The Modern Proper | themodernproper.com | JSON-LD | ✅ | JSON-LD in `<body>` ~byte 200K → stream early-exit on complete block. |
| Barefoot Contessa | barefootcontessa.com | JSON-LD | ⚠️ | All ingredients packed in one array element → `flatMap` split by `\n`. |
| coop.se | coop.se | Googlebot | ⚠️ | SPA: browser UA gets JS shell; Googlebot UA gets prerendered JSON-LD. Protocol-relative image URLs normalised to https. |
| Cookidoo | cookidoo.* | Paste | ⚠️ | Auth-gated. URL tab now shows ⌘A → Copy → Paste guidance. Paste text contains inline TM notation (`5 min \| Varoma \| Speed 1`); `sourceHint` injected into Claude prompt to preserve it — detected by URL or TM pattern in pasted text. Deferred TM enrichment then reads accurate params rather than generating from scratch. |
| thermomix-recipes.net | thermomix-recipes.net | JSON-LD + Claude | ⚠️ | Steps already describe TM operations → Claude extracts speed/temp/time directly. |
| NYT Cooking | cooking.nytimes.com | Paste | ⚠️ | Auth-gated. URL tab now shows ⌘A → Copy → Paste guidance. Paste text uses "Step N" labels and bullet-char ingredients; `sourceHint` tells Claude to strip labels, ignore bullets, and skip nutrition section at the bottom. |
| Non-English (SE/FR/DE/etc.) | various | JSON-LD/Claude + translate | ⚠️ | `looksNonEnglish` → parallel `translateRecipe()`. |
| Allrecipes | allrecipes.com | JSON-LD | ✅ | Standard JSON-LD. `recipeYield` as `"48"` or `["48"]` — `parseServings` handles both. |
| Food52 | food52.com | JSON-LD | ✅ | Standard JSON-LD, server-rendered. |
| Serious Eats | seriouseats.com | JSON-LD (`@graph`) | ✅ | Recipe is inside `@graph` array — `findRecipeSchema` handles this. |
| Jamie Oliver | jamieoliver.com | JSON-LD | ✅ | `recipeYield: "Makes 20"` — was broken (parseInt → NaN → 0 servings); fixed v0.28.1 via `parseServings`. Image array of 4 items, largest taken. |
| Food Network | foodnetwork.com | JSON-LD | ✅ | `recipeInstructions` is a single HTML string with `1) Step...<br><br>2) Step...` — was broken (0 steps parsed, fell to Claude); fixed v0.28.1 via `splitInstructionString`. |
| YouTube | youtube.com · youtu.be | YouTube (description) | ✅ | Custom path in import route; bypasses `fetchPage`. Fetches watch page, extracts `shortDescription` from `ytInitialPlayerResponse` via regex. Falls back to `hqdefault.jpg` thumbnail if `maxresdefault.jpg` 404s. Fails gracefully with paste-mode suggestion when description has no recipe signal words. Supports `/watch?v=`, `/shorts/`, and `youtu.be/` URL formats. |

---

## How to add a site
1. Import a recipe from it; note which parse path fired (check `/api/recipes/import` behaviour).
2. Record: does it have JSON-LD? in `<head>` or `<body>`? are instructions JS-rendered? auth-gated? non-English?
3. Add a row above with the quirk + the workaround (or ❌ if it needs parser work).
4. For recurring failures, add a site-specific note to the table in `CLAUDE.md` → "Known site-specific behaviours".
