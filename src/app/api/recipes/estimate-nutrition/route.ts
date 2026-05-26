import { estimateNutrition } from "@/lib/recipeEnrichment";

export const maxDuration = 30;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  let recipe: { title: string; servings: number; ingredients: { quantity: number; unit: string; name: string }[] };
  try {
    recipe = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const nutrition = await estimateNutrition(recipe, apiKey);
  if (Object.keys(nutrition).length === 0) {
    return Response.json({ error: "Could not estimate nutrition" }, { status: 422 });
  }
  return Response.json({ nutrition });
}
