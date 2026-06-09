export function isYouTubeUrl(url: URL): boolean {
  const h = url.hostname.replace(/^(www\.|m\.)/, "");
  return h === "youtube.com" || h === "youtu.be";
}

export function extractVideoId(url: URL): string | null {
  const h = url.hostname.replace(/^(www\.|m\.)/, "");
  if (h === "youtu.be") return url.pathname.slice(1).split("?")[0] || null;
  if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
  return url.searchParams.get("v");
}

export interface YouTubeVideoData {
  title: string;
  description: string;
  channelName: string;
  thumbnailUrl: string;
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0027/g, "'");
}

async function resolveYouTubeThumbnail(videoId: string): Promise<string> {
  const maxRes = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  try {
    const r = await fetch(maxRes, {
      method: "HEAD",
      signal: AbortSignal.timeout(3_000),
    });
    if (r.ok) return maxRes;
  } catch {}
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export async function fetchYouTubeVideoData(
  url: string,
  videoId: string,
): Promise<YouTubeVideoData | null> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  // Title from og:title or page <title>
  const titleMatch =
    html.match(/<meta property="og:title" content="([^"]+)"/) ??
    html.match(/<title>(.+?) - YouTube<\/title>/);
  const title = titleMatch
    ? titleMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
    : "YouTube Recipe";

  // Full description from ytInitialPlayerResponse.videoDetails.shortDescription —
  // this is the most reliable source and contains the complete description text.
  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  const description = descMatch ? unescapeJsonString(descMatch[1]) : "";

  // Channel name from the same ytInitialPlayerResponse blob
  const authorMatch = html.match(/"author":"((?:[^"\\]|\\.)*)"/);
  const channelName = authorMatch ? unescapeJsonString(authorMatch[1]) : "YouTube";

  const thumbnailUrl = await resolveYouTubeThumbnail(videoId);

  return { title, description, channelName, thumbnailUrl };
}
