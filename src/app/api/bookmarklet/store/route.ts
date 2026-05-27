import { getStore } from "@netlify/blobs";

export const maxDuration = 10;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  let body: { text?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid body" }, { status: 400, headers: CORS });
  }
  const text = typeof body.text === "string" ? body.text.slice(0, 50_000) : "";
  if (!text.trim()) {
    return Response.json({ error: "No text" }, { status: 400, headers: CORS });
  }

  const token = crypto.randomUUID();
  const store = getStore("bookmarklet-temp");
  await store.setJSON(token, { text, createdAt: Date.now() });

  return Response.json({ token }, { headers: CORS });
}
