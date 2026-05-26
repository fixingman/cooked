// Preparation descriptors that should be stripped when matching ingredient
// names against pantry items — e.g. "Garlic, minced" → "garlic"
const PREP_WORDS = /\b(diced|minced|chopped|sliced|grated|crushed|shredded|ground|beaten|melted|softened|toasted|roasted|blanched|peeled|trimmed|drained|halved|quartered|deseeded|seeded|pitted|stemmed|rinsed|washed|pressed|julienned|roughly|finely|coarsely|thinly|freshly|lightly|boneless|skinless)\b\s*/gi;

/** Normalise an ingredient name for pantry comparison (lowercase, no prep context). */
export function normalizeForMatch(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")   // strip (optional) / (to taste) etc.
    .split(",")[0]              // "garlic, minced" → "garlic"
    .replace(PREP_WORDS, "")   // strip prep words
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Clean an ingredient name for storing in pantry: strip prep context, preserve sentence case. */
export function cleanForPantry(name: string): string {
  const cleaned = name
    .replace(/\(.*?\)/g, "")
    .split(",")[0]
    .replace(PREP_WORDS, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
