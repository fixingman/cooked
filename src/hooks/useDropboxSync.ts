"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { downloadFile, uploadFile } from "@/lib/dropbox/client";

interface UseDropboxSyncOptions<T> {
  dropboxPath:          string;
  localStorageKey:      string;
  defaultValue:         T;
  getValidAccessToken:  () => Promise<string | null>;
}

export function useDropboxSync<T>({
  dropboxPath,
  localStorageKey,
  defaultValue,
  getValidAccessToken,
}: UseDropboxSyncOptions<T>) {
  const [value, setValueState] = useState<T>(defaultValue);
  const [syncing, setSyncing]   = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Read localStorage immediately — no flicker
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) setValueState(JSON.parse(stored) as T);
    } catch {}

    // 2. Reconcile with Dropbox — Dropbox wins if different
    (async () => {
      const token = await getValidAccessToken();
      if (!token) return;
      setSyncing(true);
      try {
        const remote = await downloadFile(token, dropboxPath);
        if (remote !== null) {
          const parsed = JSON.parse(remote) as T;
          setValueState(parsed);
          localStorage.setItem(localStorageKey, remote);
        }
      } catch {}
      setSyncing(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;

        // Synchronous localStorage write
        try { localStorage.setItem(localStorageKey, JSON.stringify(next)); } catch {}

        // Debounced Dropbox upload (1500ms)
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          const token = await getValidAccessToken();
          if (!token) return;
          try { await uploadFile(token, dropboxPath, JSON.stringify(next)); } catch {}
        }, 1500);

        return next;
      });
    },
    [dropboxPath, localStorageKey, getValidAccessToken]
  );

  return { value, setValue, syncing };
}
