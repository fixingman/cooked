import { getPairings } from "@/lib/flavorPairings";

export const maxDuration = 10;

export async function POST(req: Request) {
  let ingredients: string[];
  try {
    ({ ingredients } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return Response.json({ error: "ingredients array required" }, { status: 400 });
  }

  const normalized = ingredients
    .map(s => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, 20); // safety cap

  try {
    const pairings = getPairings(normalized, 6);
    return Response.json({ pairings });
  } catch {
    return Response.json({ error: "Pairing lookup failed" }, { status: 500 });
  }
}
