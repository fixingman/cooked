import { resolveRecipeImage } from "@/lib/imageUtils";

async function fetchImageAsBase64(imageUrl: string | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buffer = await res.arrayBuffer();
    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const hfToken = process.env.HUGGINGFACE_API_TOKEN;

  let body: { imageUrl?: string; title: string; cuisine: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { imageUrl, title, cuisine } = body;
  if (!title) return Response.json({ error: "title is required" }, { status: 400 });

  const { url, source, quality, resolvedBase64 } = await resolveRecipeImage(imageUrl, title, cuisine, unsplashKey, hfToken);

  // Use pre-fetched bytes from upscaling if available — avoids a second network round-trip
  const heroImageBase64 = resolvedBase64 ?? await fetchImageAsBase64(url ?? undefined);

  return Response.json({ imageUrl: url, imageSource: source, imageQuality: quality, ...(heroImageBase64 ? { heroImageBase64 } : {}) });
}
