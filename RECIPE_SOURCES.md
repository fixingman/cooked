# Recipe Sources

Per-site parsing quirks and import paths. Update when a site changes its markup or a new failure mode is found.
Pipeline details → `CLAUDE.md` § "Recipe import pipeline".

**Parse paths:** `JSON-LD` fast path · `Claude` full-page fallback · `Googlebot` SPA prerender retry · `Notion API` block tree · `YouTube` description extraction · `Paste` auth-gated (user copies text)
**Status:** ✅ reliable · ⚠️ works with quirk/workaround · ❌ broken

---

| Site | Domain | Path | Status | Key quirk |
|------|--------|------|--------|-----------|
| BBC Good Food | bbcgoodfood.com | JSON-LD | ✅ | Full JSON-LD incl. nutrition. No quirks. |
| BBC Food | bbc.co.uk/food | JSON-LD | ✅ | Dual metric/imperial in one string (`400ml/14fl oz`) — `stripDualUnit()` keeps metric, drops imperial. |
| Waitrose | waitrose.com | JSON-LD | ✅ | JSON-LD in `<head>`, 80KB+ page — stream exits on `</head>`. |
| The Modern Proper | themodernproper.com | JSON-LD | ✅ | JSON-LD in `<body>` at byte ~200K — stream exits on first complete block. |
| Allrecipes | allrecipes.com | JSON-LD | ✅ | Standard. `recipeYield` can be `"48"` or `["48"]` — `parseServings` handles both. |
| Food52 | food52.com | JSON-LD | ✅ | Standard. Server-rendered. |
| Serious Eats | seriouseats.com | JSON-LD | ✅ | Recipe wrapped in `@graph` array — `findRecipeSchema` unwraps it. |
| Jamie Oliver | jamieoliver.com | JSON-LD | ✅ | `recipeYield: "Makes 20"` (descriptive) — `parseServings` extracts first number. Image is an array of 4; largest taken. |
| Food Network | foodnetwork.com | JSON-LD | ✅ | `recipeInstructions` is a single HTML string (`1) Step…<br><br>2) Step…`) — `splitInstructionString` parses it. |
| Barefoot Contessa | barefootcontessa.com | JSON-LD | ⚠️ | All ingredients packed into one array element — `flatMap` splits by `\n`. |
| coop.se | coop.se | Googlebot | ⚠️ | SPA: browser UA returns JS shell; Googlebot UA gets prerendered JSON-LD. Protocol-relative image URLs (`//cdn…`) normalised to `https:`. |
| thermomix-recipes.net | thermomix-recipes.net | JSON-LD + Claude | ⚠️ | Steps already describe TM operations — Claude extracts speed/temp/time directly from text rather than generating from scratch. |
| Cookidoo | cookidoo.* | Paste | ⚠️ | Auth-gated. Paste text has inline TM notation (`5 min \| Varoma \| Speed 1`); `sourceHint` injected into Claude prompt preserves it. Deferred TM enrichment reads accurate params instead of regenerating. |
| NYT Cooking | cooking.nytimes.com | Paste | ⚠️ | Auth-gated. Paste text has "Step N" prefix labels and bullet-char ingredients; `sourceHint` tells Claude to strip them and ignore the trailing nutrition section. |
| YouTube | youtube.com · youtu.be | YouTube | ✅ | Custom path — fetches watch page, extracts `shortDescription` from `ytInitialPlayerResponse`. Thumbnail: `maxresdefault.jpg` → `hqdefault.jpg` fallback. Supports `/watch?v=`, `/shorts/`, `youtu.be/` formats. |
| Notion | *.notion.site · notion.so | Notion API | ✅ | SPA — HTML is empty JS shell. Custom path calls `loadPageChunk` (works for any public page, no auth). Block tree traversed in `content`-array order; serialised to plain text → Claude. First `image` block's `display_source`/`source` URL used as hero image. Page ID = last 32 hex chars of URL. Non-English handled by existing translate pipeline. |
| Non-English sites | various | any + translate | ⚠️ | `looksNonEnglish(recipe)` → parallel `translateRecipe()` call on any path. |

---

**To add a new site:** import a recipe, note which path fired, record the quirk above. For recurring failures add a row to the "Known site-specific behaviours" table in `CLAUDE.md`.
