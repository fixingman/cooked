import { generateThermomixSteps } from "@/lib/recipeEnrichment";
import type { CookingStep } from "@/types/recipe";

export const maxDuration = 30;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  let steps: CookingStep[];
  try {
    ({ steps } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return Response.json({ error: "steps array required" }, { status: 400 });
  }

  const enrichedSteps = await generateThermomixSteps(steps, apiKey);
  if (!enrichedSteps) {
    return Response.json({ error: "No Thermomix steps could be generated" }, { status: 422 });
  }

  return Response.json({ steps: enrichedSteps, thermomixAvailable: true });
}
