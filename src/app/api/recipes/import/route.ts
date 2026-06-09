import { parseRecipeFromHtml, stripHtmlToText } from "@/lib/parseJsonLd";
import { extractWithClaude, buildImportResponse, RECIPE_SIGNAL_WORDS } from "@/lib/recipeImport";
import { isYouTubeUrl, extractVideoId, fetchYouTubeVideoData } from "@/lib/youtubeImport";

export const maxDuration = 30;

const ALLOWED_PROTOCOLS = ["http:", "https:"];

// --- Fetch layer -----------------------------------------------------------
// Full browser-like headers defeat most bot-detection checks (User-Agent,
// Accept-Language, Referer). Streaming with early-exit prevents timeouts on
// heavy pages (e.g. Waitrose) where the JSON-LD is in <head> but the full
// body takes 15–20s to transfer.

const DESKTOP_UA   = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const MOBILE_UA    = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const BASE_HEADERS: Record<string, string> = {
  "Accept":                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language":         "en-US,en;q=0.9",
  "Cache-Control":           "no-cache",
  "Upgrade-Insecure-Requests": "1",
};

async function streamFetch(url: string, headers: Record<string, string>): Promise<string> {
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(18_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("html")) throw new Error("Not an HTML page");
  if (!res.body) return res.text();

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let html = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      html += dec.decode(value, { stream: true });
      // Exit as soon as a complete JSON-LD block is present — the closing
      // </script> appears after the type attribute. This handles both
      // <head>-embedded JSON-LD (e.g. Waitrose) and <body>-embedded JSON-LD
      // (e.g. The Modern Proper where JSON-LD is at byte 200K+).
      if (html.includes("application/ld+json")) {
        const ldPos = html.indexOf("application/ld+json");
        if (html.indexOf("</script>", ldPos) !== -1) break;
      }
      if (html.length > 600_000) break; // absolute safety cap
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return html;
}

function friendlyFetchError(msg: string): string {
  if (msg.includes("403")) return "This page blocked the import request — try photo import instead.";
  if (msg.includes("401")) return "This page requires login.";
  if (msg.includes("404")) return "Page not found.";
  if (msg.includes("429")) return "This site is rate-limiting requests — try again in a minute.";
  if (msg.includes("TimeoutError") || msg.includes("timeout")) return "Page took too long to respond.";
  return `Could not fetch page: ${msg}`;
}

async function fetchPage(url: string): Promise<string> {
  const attempts: Record<string, string>[] = [
    { "User-Agent": DESKTOP_UA, ...BASE_HEADERS, "Referer": "https://www.google.com/" },
    { "User-Agent": DESKTOP_UA, ...BASE_HEADERS },
    { "User-Agent": MOBILE_UA,  ...BASE_HEADERS, "Referer": "https://www.google.com/" },
  ];

  let lastErr: unknown;
  for (const headers of attempts) {
    try {
      return await streamFetch(url, headers);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : "";
      // Only retry on bot-detection 4xx — timeouts and 5xx won't benefit from a retry
      if (!/^HTTP 40[0-9]$/.test(msg)) break;
    }
  }
  throw lastErr;
}

export async function POST(req: Request) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  let parsed: URL;
  try { parsed = new URL(url); }
  catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return Response.json({ error: "Only HTTP/HTTPS URLs are supported" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const opts = { apiKey, unsplashKey: process.env.UNSPLASH_ACCESS_KEY };

  async function finalise(recipe: import("@/types/recipe").Recipe, pageText: string) {
    return Response.json(await buildImportResponse(recipe, pageText, opts));
  }

  // --- YouTube import path ---------------------------------------------------
  if (isYouTubeUrl(parsed)) {
    const videoId = extractVideoId(parsed);
    if (!videoId) {
      return Response.json({ error: "Could not extract video ID from this YouTube URL." }, { status: 422 });
    }
    if (!apiKey) {
      return Response.json({ error: "AI extraction is required for YouTube recipes — no API key configured." }, { status: 422 });
    }
    const videoData = await fetchYouTubeVideoData(url, videoId);
    if (!videoData) {
      return Response.json({ error: "Could not fetch video details from YouTube." }, { status: 422 });
    }
    if (!videoData.description) {
      return Response.json({
        error: "This video has no description. Try copying the recipe text and using Paste import instead.",
      }, { status: 422 });
    }
    const videoText = `Video: ${videoData.title}\nChannel: ${videoData.channelName}\n\n${videoData.description}`;
    const lower = videoText.toLowerCase();
    if (!RECIPE_SIGNAL_WORDS.some(w => lower.includes(w))) {
      return Response.json({
        error: "This video description doesn't appear to contain a recipe. Try copying the text and using Paste import instead.",
      }, { status: 422 });
    }
    try {
      const recipe = await extractWithClaude(videoText, url, id, apiKey);
      if (!recipe) {
        return Response.json({ error: "Could not extract a recipe from this video description." }, { status: 422 });
      }
      return finalise(
        { ...recipe, heroImageUrl: videoData.thumbnailUrl, authorName: recipe.authorName || videoData.channelName },
        videoText,
      );
    } catch {
      return Response.json({ error: "Could not extract a recipe from this video." }, { status: 422 });
    }
  }
  // --------------------------------------------------------------------------

  let html: string;
  try {
    html = await fetchPage(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return Response.json({ error: friendlyFetchError(msg) }, { status: 422 });
  }

  let pageText = stripHtmlToText(html);

  let jsonLdRecipe = parseRecipeFromHtml(html, url, id);

  // Some SPA/SSR sites (e.g. coop.se) prerender full HTML including JSON-LD
  // only for Googlebot. Retry with crawler UA when the browser fetch yielded
  // no JSON-LD — costs one extra request but avoids falling through to Claude.
  if (!jsonLdRecipe) {
    try {
      const botHtml = await streamFetch(url, { "User-Agent": GOOGLEBOT_UA, ...BASE_HEADERS });
      const botRecipe = parseRecipeFromHtml(botHtml, url, id);
      if (botRecipe) {
        html = botHtml;
        pageText = stripHtmlToText(botHtml);
        jsonLdRecipe = botRecipe;
      } else {
        // No JSON-LD but Googlebot may return richer HTML for Claude fallback
        const botPageText = stripHtmlToText(botHtml);
        if (botPageText.length > pageText.length + 200) pageText = botPageText;
      }
    } catch {}
  }

  if (jsonLdRecipe && jsonLdRecipe.steps.length > 0) return finalise(jsonLdRecipe, pageText);

  // JSON-LD has metadata but no steps — try Claude for steps
  if (jsonLdRecipe && apiKey) {
    try {
      const claudeRecipe = await extractWithClaude(pageText, url, id, apiKey);
      if (claudeRecipe && claudeRecipe.steps.length > 0) {
        // Also take times from Claude if JSON-LD had 0 times
        const merged: import("@/types/recipe").Recipe = {
          ...jsonLdRecipe,
          steps: claudeRecipe.steps,
          ...(jsonLdRecipe.prepTimeMinutes === 0 && claudeRecipe.prepTimeMinutes > 0
            ? { prepTimeMinutes: claudeRecipe.prepTimeMinutes } : {}),
          ...(jsonLdRecipe.cookTimeMinutes === 0 && claudeRecipe.cookTimeMinutes > 0
            ? { cookTimeMinutes: claudeRecipe.cookTimeMinutes } : {}),
          ...(jsonLdRecipe.totalTimeMinutes <= 30 && claudeRecipe.totalTimeMinutes > 0
            ? { totalTimeMinutes: claudeRecipe.totalTimeMinutes } : {}),
        };
        return finalise(merged, pageText);
      }
    } catch {}
    return finalise(jsonLdRecipe, pageText);
  }
  if (jsonLdRecipe) return finalise(jsonLdRecipe, pageText);

  // Full Claude fallback — only if API key is configured
  if (apiKey) {
    try {
      // Guard against non-recipe pages. Check common ingredient words across languages
      // so Swedish (ingredienser), French (ingrédients), German (zutaten), etc. all pass.
      const lower = pageText.toLowerCase();
      const hasRecipeSignal = RECIPE_SIGNAL_WORDS.some(w => lower.includes(w));
      if (!hasRecipeSignal) {
        return Response.json({ error: "This page doesn't appear to contain a recipe." }, { status: 422 });
      }
      const claudeRecipe = await extractWithClaude(pageText, url, id, apiKey);
      if (claudeRecipe) return finalise(claudeRecipe, pageText);
    } catch {}
  }

  return Response.json(
    { error: "No recipe data found on this page. Try a URL from a dedicated recipe site." },
    { status: 422 }
  );
}
