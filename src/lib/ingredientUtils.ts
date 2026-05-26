// Preparation descriptors stripped when matching — e.g. "Garlic, minced" → "garlic"
const PREP_WORDS = /\b(diced|minced|chopped|sliced|grated|crushed|shredded|ground|beaten|melted|softened|toasted|roasted|blanched|peeled|trimmed|drained|halved|quartered|deseeded|seeded|pitted|stemmed|rinsed|washed|pressed|julienned|roughly|finely|coarsely|thinly|freshly|lightly|boneless|skinless)\b\s*/gi;

// Leading unit tokens — covers cases where import parsing fails and stores "dl honey" instead of "honey"
const LEADING_UNIT = /^[\d./]+\s*(dl|cl|ml|l|g|kg|tbsp|tbs|tsp|ts|cup|cups|oz|lb|lbs|pinch|handful|bunch|clove|cloves|slice|slices|sheet|sheets|can|cans|jar|jars|tin|tins|bag|bags)\s+/i;
const BARE_UNIT   = /^(dl|cl|ml|l|g|kg|tbsp|tbs|tsp|ts|cup|cups|oz|lb|lbs)\s+/i;

function stripLeadingUnit(s: string): string {
  return s.replace(LEADING_UNIT, "").replace(BARE_UNIT, "");
}

/** Normalise an ingredient name for pantry comparison (lowercase, no prep context). */
export function normalizeForMatch(name: string): string {
  return stripLeadingUnit(
    name
      .replace(/\(.*?\)/g, "")
      .split(",")[0]
      .replace(PREP_WORDS, "")
      .replace(/\s+/g, " ")
      .trim()
  ).toLowerCase();
}

/** Clean an ingredient name for storing in pantry: strip prep context, preserve sentence case. */
export function cleanForPantry(name: string): string {
  const cleaned = stripLeadingUnit(
    name
      .replace(/\(.*?\)/g, "")
      .split(",")[0]
      .replace(PREP_WORDS, "")
      .replace(/\s+/g, " ")
      .trim()
  );
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
