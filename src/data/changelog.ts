/**
 * User-facing release notes — shown in Settings → What's New.
 *
 * AUDIENCE: the cook, not the developer. Plain language, warm voice.
 * No function names, no CSS, no version cross-references, no root-cause archaeology.
 * Say what changed *for the person cooking*. Skip patch-only build/lint fixes.
 *
 * Dev-facing technical history lives in CLAUDE.md "Version history".
 * `changelog[0].version` is the single source of truth for the displayed version.
 */

export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  notes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "0.31.5",
    date: "2026-07-18",
    notes: [
      "When creating a new AI recipe, you now pick from four different ideas first — then Cooked builds the one you choose.",
      "Regenerate now takes you back to the idea picker, so you can try a different direction.",
    ],
  },
  {
    version: "0.30.1",
    date: "2026-07-14",
    notes: [
      "Fixed duplicate items appearing in the shopping list after adding the same ingredient on two devices.",
    ],
  },
  {
    version: "0.30.0",
    date: "2026-07-03",
    notes: [
      "The shopping list now uses the same categories as your pantry — and the pantry's AI categorise button sorts both at once.",
    ],
  },
  {
    version: "0.29.5",
    date: "2026-06-19",
    notes: [
      "Import recipes directly from Notion — paste a public Notion page URL and it just works, images included.",
    ],
  },
  {
    version: "0.29.3",
    date: "2026-06-18",
    notes: [
      "Fixed the Settings toggles — they now snap cleanly to on/off with proper rounded edges.",
    ],
  },
  {
    version: "0.29.2",
    date: "2026-06-15",
    notes: [
      "Added this What's New page, so you can see what's changed.",
      "Sharper homepage thumbnails — no more blurry recipe cards on the way in.",
    ],
  },
  {
    version: "0.28.0",
    date: "2026-06-09",
    notes: [
      "Import recipes straight from YouTube — paste a cooking video link and we'll pull the recipe out.",
      "Smoother imports from Cookidoo and NYT Cooking.",
    ],
  },
  {
    version: "0.26.0",
    date: "2026-06-01",
    notes: [
      "Tap any ingredient to see smart swaps — with the right ratio and a quick note on how it'll change the dish.",
    ],
  },
  {
    version: "0.24.0",
    date: "2026-05-25",
    notes: [
      "Your pantry and shopping list now talk to each other — mark something as running low and it lands on your list; check it off and the pantry restocks itself.",
    ],
  },
  {
    version: "0.23.0",
    date: "2026-05-20",
    notes: [
      "A proper shopping list — add a recipe's ingredients in one tap (it skips what you already have), and checking things off stocks your pantry.",
    ],
  },
  {
    version: "0.22.0",
    date: "2026-05-14",
    notes: [
      "Tell Cooked what you're in the mood for and it'll dream up a brand-new recipe — or suggest one from your collection.",
      "New here? You'll start with a dozen recipes to cook right away.",
    ],
  },
  {
    version: "0.20.0",
    date: "2026-05-05",
    notes: [
      "A 'For You' shelf on the homepage that learns what you like to cook.",
      "Paste a recipe from anywhere — even sites that make you log in.",
    ],
  },
  {
    version: "0.19.0",
    date: "2026-04-28",
    notes: [
      "Keep a pantry — Cooked remembers what you have and points you to recipes you can make right now.",
    ],
  },
];
