export const maxDuration = 15;

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function fetchSourceImageUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": DESKTOP_UA, "Accept": "text/html,*/*;q=0.8" },
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
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
    } finally { reader.cancel().catch(() => {}); }
    const ldMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/);
    if (ldMatch) return ldMatch[1];
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
                ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (ogMatch) return ogMatch[1];
  } catch {}
  return null;
}

export async function POST(req: Request) {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) return Response.json({ error: "Unsplash not configured" }, { status: 503 });

  let body: { title: string; cuisine?: string; sourceUrl?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, cuisine, sourceUrl } = body;
  if (!title) return Response.json({ error: "title is required" }, { status: 400 });

  const queryParts = [title, cuisine && cuisine !== "any" ? cuisine : null, "food"].filter(Boolean);
  const query = queryParts.join(" ");

  const [unsplashRes, sourceImage] = await Promise.allSettled([
    fetch(
      `https://api.unsplash.com/search/photos?${new URLSearchParams({
        query, per_page: "9", orientation: "landscape", content_filter: "high",
      })}`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` }, signal: AbortSignal.timeout(8_000) }
    ),
    sourceUrl ? fetchSourceImageUrl(sourceUrl) : Promise.resolve(null),
  ]);

  if (unsplashRes.status === "rejected") {
    return Response.json({ error: "Failed to fetch images" }, { status: 502 });
  }
  if (!unsplashRes.value.ok) {
    return Response.json({ error: "Unsplash search failed" }, { status: 502 });
  }

  const data = await unsplashRes.value.json();
  const images = (data.results ?? []).map((r: {
    urls: { regular: string; small: string };
    alt_description: string;
    user: { name: string };
  }) => ({
    url: r.urls.regular,
    thumb: r.urls.small,
    alt: r.alt_description ?? title,
  }));

  const sourceImageUrl = sourceImage.status === "fulfilled" ? sourceImage.value : null;

  return Response.json({ images, sourceImageUrl });
}
