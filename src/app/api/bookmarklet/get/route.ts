import { getStore } from "@netlify/blobs";

export const maxDuration = 10;

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  const store = getStore("bookmarklet-temp");
  const data = await store.get(token, { type: "json" }) as { text: string; createdAt: number } | null;
  if (!data) return Response.json({ error: "Not found or expired" }, { status: 404 });

  // Delete after first read — single-use token
  store.delete(token).catch(() => {});

  return Response.json({ text: data.text });
}
