export const maxDuration = 15;

export async function POST(req: Request) {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) return Response.json({ error: "Unsplash not configured" }, { status: 503 });

  let body: { title: string; cuisine?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, cuisine } = body;
  if (!title) return Response.json({ error: "title is required" }, { status: 400 });

  const queryParts = [title, cuisine && cuisine !== "any" ? cuisine : null, "food"].filter(Boolean);
  const query = queryParts.join(" ");

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?${new URLSearchParams({
        query,
        per_page: "9",
        orientation: "landscape",
        content_filter: "high",
      })}`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` }, signal: AbortSignal.timeout(8_000) }
    );
    if (!res.ok) return Response.json({ error: "Unsplash search failed" }, { status: 502 });
    const data = await res.json();
    const images = (data.results ?? []).map((r: {
      urls: { regular: string; small: string };
      alt_description: string;
      user: { name: string };
    }) => ({
      url: r.urls.regular,
      thumb: r.urls.small,
      alt: r.alt_description ?? title,
      photographer: r.user.name,
    }));
    return Response.json({ images });
  } catch {
    return Response.json({ error: "Failed to fetch images" }, { status: 502 });
  }
}
