"use client";
import { useState, useEffect } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { getTemporaryLink } from "@/lib/dropbox/client";

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

interface CacheEntry {
  url: string;
  expiresAt: number;
}

function getCached(path: string): string | null {
  try {
    const raw = localStorage.getItem(`cooked-img-cache:${path}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() >= entry.expiresAt) return null;
    return entry.url;
  } catch {
    return null;
  }
}

function setCached(path: string, url: string) {
  try {
    const entry: CacheEntry = { url, expiresAt: Date.now() + CACHE_TTL };
    localStorage.setItem(`cooked-img-cache:${path}`, JSON.stringify(entry));
  } catch {}
}

export function useDropboxImage(path: string | undefined): string | null {
  const { status, getValidAccessToken } = useDropboxAuth();
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    return getCached(path);
  });

  useEffect(() => {
    if (!path || status !== "connected") return;
    const cached = getCached(path);
    if (cached) { setUrl(cached); return; }

    let cancelled = false;
    (async () => {
      const token = await getValidAccessToken();
      if (!token || cancelled) return;
      try {
        const link = await getTemporaryLink(token, path);
        if (cancelled) return;
        setCached(path, link);
        setUrl(link);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [path, status, getValidAccessToken]);

  return url;
}
