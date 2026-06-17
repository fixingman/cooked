import type { PantryCategory } from "@/data/ingredientCategories";

export const maxDuration = 30;

const VALID: PantryCategory[] = [
  "fruit", "vegetables", "dairy", "meat", "grains", "legumes",
  "spices", "baking", "pantry", "nuts", "canned", "dried", "frozen", "other",
];

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  let names: string[];
  try {
    ({ names } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!Array.isArray(names) || names.length === 0) {
    return Response.json({ error: "names array required" }, { status: 400 });
  }

  const prompt = `Categorise each ingredient into exactly one of these categories:
- fruit: fresh fruit (apples, oranges, berries, lemons, limes, mango, etc.)
- vegetables: fresh vegetables, fresh herbs, mushrooms (garlic, onion, spinach, basil, etc.)
- dairy: milk, cheese, eggs, butter, cream, yogurt
- meat: meat, poultry, fish, seafood, tofu, tempeh
- grains: pasta, rice, flour, bread, oats, couscous, noodles, breadcrumbs (display: Grains & Pasta)
- legumes: chickpeas, lentils, beans of all kinds — canned, dried, or fresh (display: Legumes)
- spices: dry spices, dried herbs, seasoning blends, salt, pepper (display: Spices & Herbs)
- baking: sugar, chocolate, baking powder, yeast, vanilla, cocoa, cornflour, honey, syrups (display: Baking)
- pantry: oils, vinegars, condiments, mustard, soy/fish/hot sauces, miso, wine for cooking (display: Oils & Condiments)
- nuts: all nuts (almonds, walnuts, cashews, pecans, pistachios, hazelnuts, peanuts, etc.), seeds (sesame, pumpkin, sunflower, chia, flaxseed, etc.), nut butters (display: Nuts & Seeds)
- canned: canned/tinned goods, stocks, broths, coconut milk, tomato paste, passata, jarred peppers/olives/capers/pesto (display: Canned & Jars)
- dried: dried fruit (raisins, dates, apricots), dried mushrooms, sun-dried tomatoes, dried chilies, coconut flakes (display: Dried)
- frozen: frozen foods
- other: anything that doesn't fit the above (display: Misc)

Ingredients to categorise:
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Respond with a JSON array only, no explanation. Example:
[{"name":"Garlic","category":"vegetables"},{"name":"Salmon","category":"meat"}]`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) return Response.json({ error: "AI request failed" }, { status: 502 });

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return Response.json({ error: "Could not parse AI response" }, { status: 502 });

    const raw = JSON.parse(jsonMatch[0]) as { name: string; category: string }[];
    const results = raw
      .filter(r => r.name && VALID.includes(r.category as PantryCategory))
      .map(r => ({ name: r.name, category: r.category as PantryCategory }));

    return Response.json({ results });
  } catch {
    return Response.json({ error: "Request timed out" }, { status: 504 });
  }
}
