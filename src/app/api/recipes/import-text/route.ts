import { extractWithClaude, buildImportResponse, RECIPE_SIGNAL_WORDS } from "@/lib/recipeImport";

export const maxDuration = 30;

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// Best-effort supplementary fetch — grabs hero image URL from JSON-LD or OG tags.
// Short timeout, single attempt, silently fails if the page is auth-gated.
async function fetchSupplementaryImageUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": DESKTOP_UA,
        "Accept": "text/html,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    // Read only the first 60KB — enough to cover <head> where OG/JSON-LD live
    const reader = res.body?.getReader();
    if (!reader) return null;
    const dec = new TextDecoder();
    let html = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (html.length > 60_000) break;
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    // JSON-LD image
    const ldMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/);
    if (ldMatch) return ldMatch[1];
    // OG image
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
                 ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (ogMatch) return ogMatch[1];
  } catch {}
  return null;
}

export async function POST(req: Request) {
  let text: string, url: string | undefined;
  try {
    ({ text, url } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return Response.json({ error: "Paste more text — it seems too short to contain a recipe." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const lower = text.toLowerCase();
  const hasNonAscii = /[^\x00-\x7F]/.test(text);
  if (!hasNonAscii && !RECIPE_SIGNAL_WORDS.some(w => lower.includes(w))) {
    return Response.json({ error: "This text doesn't appear to contain a recipe." }, { status: 422 });
  }

  const id = crypto.randomUUID();
  const sourceUrl = url ?? "";

  // Site-specific extraction hints passed to Claude.
  // Cookidoo: steps contain inline TM notation ("5 min | Varoma | Speed 1") — preserve it so
  // deferred Thermomix enrichment reads accurate params rather than re-generating them from scratch.
  // Detected by URL or by TM notation pattern in the text (covers pastes without a source URL).
  // NYT Cooking: steps are labeled "Step N", ingredients have bullet chars, nutrition at the bottom.
  let sourceHint: string | undefined;
  try {
    const sourceHost = url ? new URL(url).hostname.replace(/^(www\.|m\.)/, "") : "";
    const looksLikeCookidoo =
      sourceHost.includes("cookidoo") ||
      /\|\s*(?:varoma|\d+\s*°?c)\s*\||\|\s*speed\s*\d/i.test(text);
    if (looksLikeCookidoo) {
      sourceHint =
        "If steps contain Thermomix parameters (e.g. '5 min | 100°C | Speed 1', '| Varoma |', '| Reverse |'), preserve this notation exactly at the end of each step — it is used for Thermomix cooking mode.";
    } else if (sourceHost === "cooking.nytimes.com") {
      sourceHint =
        "Steps may be labeled 'Step 1', 'Step 2' etc — include the instruction text but omit the label. Ingredients may begin with bullet characters — ignore them. Skip any nutritional information section at the bottom.";
    }
  } catch {}

  try {
    // Run Claude extraction and supplementary URL fetch in parallel
    const [recipe, supplementaryImage] = await Promise.all([
      extractWithClaude(text, sourceUrl, id, apiKey, sourceHint),
      url ? fetchSupplementaryImageUrl(url) : Promise.resolve(null),
    ]);

    if (!recipe) {
      return Response.json({ error: "Could not extract a recipe from the pasted text." }, { status: 422 });
    }

    // Use supplementary image if Claude didn't find one (text rarely contains image URLs)
    const enrichedRecipe = supplementaryImage && !recipe.heroImageUrl
      ? { ...recipe, heroImageUrl: supplementaryImage }
      : recipe;

    const result = await buildImportResponse(enrichedRecipe, text, {
      apiKey,
      unsplashKey: process.env.UNSPLASH_ACCESS_KEY,
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: "Request timed out — try again." }, { status: 504 });
  }
}
