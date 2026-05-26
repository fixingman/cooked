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
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return "unknown";
    const cl = res.headers.get("content-length");
    if (cl) return parseInt(cl) < LOW_RES_BYTES ? "low" : "ok";

    // CDNs often omit content-length on HEAD — do a range GET to measure actual size.
    // Request exactly LOW_RES_BYTES: if the server returns less, the file is that small.
    const rangeRes = await fetch(url, {
      headers: { Range: `bytes=0-${LOW_RES_BYTES - 1}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (rangeRes.status === 206) {
      // Server supports range — content-range tells us the total file size
      const cr = rangeRes.headers.get("content-range");
      const total = cr?.match(/\/(\d+)$/)?.[1];
      if (total) return parseInt(total) < LOW_RES_BYTES ? "low" : "ok";
      // No total in content-range — if the returned chunk is < LOW_RES_BYTES, file is that small
      const rcl = rangeRes.headers.get("content-length");
      if (rcl && parseInt(rcl) < LOW_RES_BYTES) return "low";
    } else if (rangeRes.ok) {
      // Server ignored Range and returned the full file — check content-length now
      const rcl = rangeRes.headers.get("content-length");
      if (rcl) return parseInt(rcl) < LOW_RES_BYTES ? "low" : "ok";
    }
    return "ok";
  } catch {
    return "unknown";
  }
}

export type UpscaleResult =
  | { status: "ok"; base64: string }
  | { status: "loading"; waitSeconds: number }
  | { status: "failed" };

// Upscales an image 2× using Hugging Face swin2SR (free tier, rate-limited).
// Returns "loading" when the model is cold-starting — caller should wait waitSeconds and retry.
export async function upscaleImage(imageUrl: string, hfToken: string, timeoutMs = 20_000): Promise<UpscaleResult> {
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8_000) });
    if (!imgRes.ok) return { status: "failed" };
    const ct = imgRes.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return { status: "failed" };
    const imageBytes = await imgRes.arrayBuffer();

    const res = await fetch(
      "https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x2-64",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBytes,
        signal: AbortSignal.timeout(timeoutMs),
      }
    );

    if (res.status === 503) {
      try {
        const body = await res.json() as { estimated_time?: number };
        const waitSeconds = Math.ceil(body.estimated_time ?? 20);
        return { status: "loading", waitSeconds };
      } catch {
        return { status: "loading", waitSeconds: 20 };
      }
    }

    if (!res.ok) return { status: "failed" };
    const upscaledCt = res.headers.get("content-type") ?? "image/png";
    if (!upscaledCt.startsWith("image/")) return { status: "failed" };
    const upscaledBytes = await res.arrayBuffer();
    return { status: "ok", base64: `data:${upscaledCt};base64,${Buffer.from(upscaledBytes).toString("base64")}` };
  } catch {
    return { status: "failed" };
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

export type ImageResolveResult = {
  url: string | null;
  source: ImageSource;
  quality: "ok" | "low";
  resolvedBase64?: string;
  hfLoading?: { waitSeconds: number }; // HF model cold-starting — caller should wait and retry
};

export async function resolveRecipeImage(
  rawImageUrl: string | undefined,
  title: string,
  cuisine: string,
  unsplashKey: string | undefined,
  hfToken?: string, // Hugging Face token — enables AI upscaling; omit to skip
): Promise<ImageResolveResult> {
  const query = `${title} ${cuisine} food recipe`;

  const unsplashFallback = async (): Promise<ImageResolveResult> => {
    if (!unsplashKey) return { url: null, source: "none", quality: "low" };
    const found = await searchUnsplash(query, unsplashKey);
    return found ? { url: found, source: "ai-found", quality: "ok" } : { url: null, source: "none", quality: "low" };
  };

  if (!rawImageUrl) return unsplashFallback();

  // Protocol-relative URLs (//cdn.example.com/...) are invalid for Node.js fetch()
  // and rejected by Next.js Image. Normalise to https: before any processing.
  const normalizedUrl = rawImageUrl.startsWith("//") ? `https:${rawImageUrl}` : rawImageUrl;

  const fullResUrl = tryFullResUrl(normalizedUrl);
  let resolvedUrl = fullResUrl;
  let quality: "ok" | "low" | "unknown";

  if (fullResUrl !== normalizedUrl) {
    // URL was modified by stripping — verify it still points to an actual image.
    // Some sites serve a generic header/banner at the stripped URL (e.g. themodernproper.com).
    const strippedQuality = await checkImageQuality(fullResUrl);
    if (strippedQuality === "unknown") {
      resolvedUrl = normalizedUrl;
      quality = await checkImageQuality(normalizedUrl);
    } else {
      quality = strippedQuality;
    }
  } else {
    quality = await checkImageQuality(normalizedUrl);
  }

  if (quality === "ok") return { url: resolvedUrl, source: "scraped", quality: "ok" };

  // "unknown" means HEAD was blocked/timed out — the image is likely fine; keep original.
  if (quality === "unknown") return { url: resolvedUrl, source: "scraped", quality: "ok" };

  // Confirmed low-res — try upscaling first (preserves original photo),
  // then Unsplash as a last resort (replaces with stock photo).
  if (hfToken) {
    const upscaled = await upscaleImage(resolvedUrl, hfToken);
    if (upscaled.status === "ok") return { url: resolvedUrl, source: "scraped", quality: "ok", resolvedBase64: upscaled.base64 };
    if (upscaled.status === "loading") return { url: resolvedUrl, source: "scraped", quality: "low", hfLoading: { waitSeconds: upscaled.waitSeconds } };
  }

  const unsplash = await unsplashFallback();
  if (unsplash.url) return unsplash;
  return { url: resolvedUrl, source: "scraped", quality: "low" };
}
