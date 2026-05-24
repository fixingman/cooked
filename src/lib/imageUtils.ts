export type ImageSource = "scraped" | "photo-import" | "ai-found" | "none";

const THUMB_QUERY_PARAMS = ["w", "h", "width", "height", "fit", "crop", "auto", "q", "quality", "format", "fm", "s", "size", "resize", "dpr", "tr"];
const LOW_RES_BYTES = 35_000;

export function tryFullResUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Cloudinary: strip transform segment
    const cloudinaryMatch = url.match(/^(https?:\/\/res\.cloudinary\.com\/.+?\/image\/upload\/)[a-z0-9_,/]+\//);
    if (cloudinaryMatch) {
      const rest = url.slice(cloudinaryMatch[0].length);
      return `${cloudinaryMatch[1]}${rest}`;
    }
    // WordPress -300x200 in pathname
    const wpMatch = u.pathname.match(/^(.*?)-(\d{2,4})x(\d{2,4})(\.[a-z]+)$/i);
    if (wpMatch && parseInt(wpMatch[2]) < 800) {
      u.pathname = wpMatch[1] + wpMatch[4];
      return u.toString();
    }
    // WordPress -scaled
    const scaledMatch = u.pathname.match(/^(.*?)-scaled(\.[a-z]+)$/i);
    if (scaledMatch) {
      u.pathname = scaledMatch[1] + scaledMatch[2];
      return u.toString();
    }
    // Strip small-dimension query params
    let stripped = false;
    for (const p of THUMB_QUERY_PARAMS) {
      const v = u.searchParams.get(p);
      if (v !== null) {
        const n = parseInt(v);
        if (!isNaN(n) && n > 0 && n < 800) { u.searchParams.delete(p); stripped = true; }
        else if (isNaN(n)) { u.searchParams.delete(p); stripped = true; }
      }
    }
    return stripped ? u.toString() : url;
  } catch {
    return url;
  }
}

export function isLikelyThumbnailUrl(url: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    for (const p of ["w", "h", "width", "height", "s", "size"]) {
      const v = parseInt(u.searchParams.get(p) ?? "0");
      if (v > 0 && v < 640) return true;
    }
    if (/-(\d{2,4})x(\d{2,4})\./.test(url)) {
      const m = url.match(/-(\d{2,4})x(\d{2,4})\./);
      if (m && (parseInt(m[1]) < 640 || parseInt(m[2]) < 480)) return true;
    }
    if (/\/thumbnails?\/|\/small\/|\/thumb\/|_thumb\./i.test(url)) return true;
  } catch {}
  return false;
}

export async function checkImageQuality(url: string): Promise<"ok" | "low" | "unknown"> {
  if (isLikelyThumbnailUrl(url)) return "low";
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return "unknown";
    const cl = res.headers.get("content-length");
    if (cl && parseInt(cl) < LOW_RES_BYTES) return "low";
    return "ok";
  } catch {
    return "unknown";
  }
}

export async function searchUnsplash(query: string, accessKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?${new URLSearchParams({ query, per_page: "1", orientation: "landscape", content_filter: "high" })}`,
      { headers: { Authorization: `Client-ID ${accessKey}` }, signal: AbortSignal.timeout(8_000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results?.[0]?.urls?.regular as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function resolveRecipeImage(
  rawImageUrl: string | undefined,
  title: string,
  cuisine: string,
  unsplashKey: string | undefined,
): Promise<{ url: string | null; source: ImageSource; quality: "ok" | "low" }> {
  const fallback = async (): Promise<{ url: string | null; source: ImageSource; quality: "ok" | "low" }> => {
    if (!unsplashKey) return { url: null, source: "none", quality: "low" };
    const found = await searchUnsplash(`${title} ${cuisine} food recipe`, unsplashKey);
    return found ? { url: found, source: "ai-found", quality: "ok" } : { url: null, source: "none", quality: "low" };
  };

  if (!rawImageUrl) return fallback();

  const fullResUrl = tryFullResUrl(rawImageUrl);
  const quality = await checkImageQuality(fullResUrl);

  if (quality === "ok") return { url: fullResUrl, source: "scraped", quality: "ok" };

  if (quality === "low" && unsplashKey) {
    const found = await searchUnsplash(`${title} ${cuisine} food recipe`, unsplashKey);
    if (found) return { url: found, source: "ai-found", quality: "ok" };
  }

  return { url: fullResUrl, source: "scraped", quality: quality === "low" ? "low" : "ok" };
}
