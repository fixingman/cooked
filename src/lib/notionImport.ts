// Notion public-page import via the internal loadPageChunk API.
// Works for any page shared publicly (*.notion.site or notion.so share links).

const NOTION_API = "https://www.notion.so/api/v3/loadPageChunk";

export function isNotionUrl(parsed: URL): boolean {
  return (
    parsed.hostname.endsWith(".notion.site") ||
    parsed.hostname === "www.notion.so" ||
    parsed.hostname === "notion.so"
  );
}

// Notion page IDs appear as 32 contiguous hex chars at the end of the URL path.
export function extractNotionPageId(parsed: URL): string | null {
  const m = parsed.pathname.match(/([0-9a-f]{32})(?:[^0-9a-f].*)?$/i);
  if (!m) return null;
  const h = m[1].toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type NotionRichText = [string, ...unknown[]][];

interface NotionBlockValue {
  id: string;
  type: string;
  content?: string[];
  properties?: {
    title?: NotionRichText;
    source?: [[string]]; // image blocks store URL here
  };
  format?: {
    display_source?: string; // signed URL for uploaded images
  };
}

function getText(richText?: NotionRichText): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map(seg => (Array.isArray(seg) ? String(seg[0] ?? "") : "")).join("");
}

interface RenderResult {
  text: string;
  imageUrl: string | null;
}

function renderBlocks(
  pageId: string,
  blocks: Record<string, { value: { value: NotionBlockValue } }>,
): RenderResult {
  const lines: string[] = [];
  const visited = new Set<string>();
  let numberedCounter = 0;
  let imageUrl: string | null = null;

  function visit(blockId: string) {
    if (visited.has(blockId)) return;
    visited.add(blockId);
    const b = blocks[blockId]?.value?.value;
    if (!b) return;

    const text = getText(b.properties?.title);

    if (b.type !== "numbered_list" && b.type !== "page") numberedCounter = 0;

    switch (b.type) {
      case "page": break;
      case "header":
      case "heading_1": if (text) lines.push(`\n# ${text}`); break;
      case "sub_header":
      case "heading_2": if (text) lines.push(`\n## ${text}`); break;
      case "sub_sub_header":
      case "heading_3": if (text) lines.push(`\n### ${text}`); break;
      case "to_do":
      case "bulleted_list": if (text) lines.push(`- ${text}`); break;
      case "numbered_list":
        if (text) { numberedCounter++; lines.push(`${numberedCounter}. ${text}`); }
        break;
      case "image": {
        // Capture first image as hero; prefer display_source (signed) over source
        if (!imageUrl) {
          imageUrl =
            b.format?.display_source ??
            b.properties?.source?.[0]?.[0] ??
            null;
        }
        break;
      }
      case "button": break;
      default: if (text) lines.push(text); break;
    }

    for (const childId of b.content ?? []) visit(childId);
  }

  const pageBlock = blocks[pageId]?.value?.value;
  if (pageBlock) {
    const title = getText(pageBlock.properties?.title);
    if (title) lines.push(title);
    for (const childId of pageBlock.content ?? []) visit(childId);
  } else {
    for (const id of Object.keys(blocks)) visit(id);
  }

  return { text: lines.join("\n"), imageUrl };
}

export interface NotionPageData {
  text: string;
  imageUrl: string | null;
}

export async function fetchNotionPageData(pageId: string): Promise<NotionPageData | null> {
  let res: Response;
  try {
    res = await fetch(NOTION_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        pageId,
        limit: 100,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let data: { recordMap?: { block?: Record<string, { value: { value: NotionBlockValue } }> } };
  try {
    data = await res.json();
  } catch {
    return null;
  }

  const blocks = data.recordMap?.block;
  if (!blocks || Object.keys(blocks).length === 0) return null;

  const { text, imageUrl } = renderBlocks(pageId, blocks);
  return text.trim() ? { text: text.trim(), imageUrl } : null;
}
