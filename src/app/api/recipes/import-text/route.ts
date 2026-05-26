import { extractWithClaude, buildImportResponse, RECIPE_SIGNAL_WORDS } from "@/lib/recipeImport";

export const maxDuration = 30;

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
  if (!RECIPE_SIGNAL_WORDS.some(w => lower.includes(w))) {
    return Response.json({ error: "This text doesn't appear to contain a recipe." }, { status: 422 });
  }

  const id = crypto.randomUUID();
  const sourceUrl = url ?? "";

  try {
    const recipe = await extractWithClaude(text, sourceUrl, id, apiKey);
    if (!recipe) {
      return Response.json({ error: "Could not extract a recipe from the pasted text." }, { status: 422 });
    }
    const result = await buildImportResponse(recipe, text, {
      apiKey,
      unsplashKey: process.env.UNSPLASH_ACCESS_KEY,
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: "Request timed out — try again." }, { status: 504 });
  }
}
