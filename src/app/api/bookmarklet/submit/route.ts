import { getStore } from "@netlify/blobs";

export const maxDuration = 10;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let text = "";
  let sourceUrl = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    text = String(form.get("text") ?? "").slice(0, 50_000);
    sourceUrl = String(form.get("sourceUrl") ?? "");
  } else {
    try {
      const body = await req.json();
      text = String(body.text ?? "").slice(0, 50_000);
      sourceUrl = String(body.sourceUrl ?? "");
    } catch { /* ignore */ }
  }

  if (!text.trim()) {
    return Response.redirect("/?import=paste", 302);
  }

  const token = crypto.randomUUID();
  const store = getStore("bookmarklet-temp");
  await store.setJSON(token, { text, createdAt: Date.now() });

  const dest = new URL("/?import=paste", req.url);
  dest.searchParams.set("token", token);
  if (sourceUrl) dest.searchParams.set("url", sourceUrl);

  return Response.redirect(dest.toString(), 302);
}
