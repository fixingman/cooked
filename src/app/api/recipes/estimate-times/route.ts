import { estimateAllTimes } from "@/lib/recipeEnrichment";

export const maxDuration = 15;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  let recipe: { title: string; servings: number; ingredients: { name: string }[]; steps: { instruction: string }[] };
  try {
    recipe = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const times = await estimateAllTimes(recipe, apiKey);
  if (!times) return Response.json({ error: "Could not estimate times" }, { status: 422 });
  return Response.json({ times });
}
