"use client";
import { useState, useEffect, useCallback } from "react";
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/dropbox/pkce";
import { loadTokens, saveTokens, clearTokens, isExpired, refreshPromise, setRefreshPromise } from "@/lib/dropbox/tokens";

export type DropboxStatus = "disconnected" | "connected";

export function useDropboxAuth() {
  const [status, setStatus] = useState<DropboxStatus>("disconnected");
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    const tokens = loadTokens();
    if (tokens) {
      setStatus("connected");
      setAccountName(tokens.accountName);
    }
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
    if (!appKey) {
      return "Dropbox App Key is not configured. Check your environment variables and redeploy.";
    }

    const verifier  = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state     = generateState();

    sessionStorage.setItem("dropbox-pkce-verifier", verifier);
    sessionStorage.setItem("dropbox-pkce-state", state);

    const redirectUri = `${window.location.origin}/auth/dropbox/callback`;

    const params = new URLSearchParams({
      client_id:             appKey,
      response_type:         "code",
      code_challenge:        challenge,
      code_challenge_method: "S256",
      redirect_uri:          redirectUri,
      state,
      token_access_type:     "offline",
    });

    window.location.href = `https://www.dropbox.com/oauth2/authorize?${params}`;
    return null;
  }, []);

  const disconnect = useCallback(() => {
    clearTokens();
    setStatus("disconnected");
    setAccountName(null);
  }, []);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = loadTokens();
    if (!tokens) return null;
    if (!isExpired(tokens.expiresAt)) return tokens.accessToken;

    // Guard against concurrent refresh calls
    if (refreshPromise) return refreshPromise;

    const p: Promise<string | null> = (async () => {
      try {
        const res = await fetch("/api/dropbox/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        if (!res.ok) throw new Error("Refresh failed");
        const { accessToken, expiresAt } = await res.json();
        saveTokens({ ...tokens, accessToken, expiresAt });
        return accessToken as string;
      } catch {
        clearTokens();
        setStatus("disconnected");
        setAccountName(null);
        return null;
      } finally {
        setRefreshPromise(null);
      }
    })();

    setRefreshPromise(p);
    return p;
  }, []);

  return { status, accountName, connect, disconnect, getValidAccessToken };
}
