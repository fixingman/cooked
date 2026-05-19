import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
  if (!appKey) return NextResponse.json({ error: "Missing app key" }, { status: 500 });

  const params = new URLSearchParams({
    grant_type:    "refresh_token",
    refresh_token: refreshToken,
    client_id:     appKey,
  });

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error_description ?? "Refresh failed" }, { status: 400 });
  }

  return NextResponse.json({
    accessToken: data.access_token,
    expiresAt:   Date.now() + data.expires_in * 1000,
  });
}
