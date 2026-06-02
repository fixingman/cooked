import { suggestSubstitutes } from "@/lib/recipeEnrichment";

export const maxDuration = 10;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  let body: {
    ingredient?: string;
    quantity?: number;
    unit?: string;
    recipeTitle?: string;
    cuisine?: string;
    dietaryPreferences?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ingredient = body.ingredient?.trim();
  if (!ingredient) return Response.json({ error: "Ingredient required" }, { status: 400 });

  const substitutes = await suggestSubstitutes(
    {
      ingredient,
      quantity: body.quantity,
      unit: body.unit,
      recipeTitle: body.recipeTitle,
      cuisine: body.cuisine,
      dietaryPreferences: body.dietaryPreferences,
    },
    apiKey,
  );

  if (!substitutes) return Response.json({ error: "Could not find substitutes" }, { status: 422 });
  return Response.json({ substitutes });
}
