import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, codeVerifier, redirectUri } = await req.json();
  const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
  if (!appKey) return NextResponse.json({ error: "Missing app key" }, { status: 500 });

  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    client_id: appKey,
  });

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error_description ?? "Token exchange failed" }, { status: 400 });
  }

  return NextResponse.json({
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + data.expires_in * 1000,
  });
}
