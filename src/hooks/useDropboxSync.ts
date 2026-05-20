"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { downloadFile, uploadFile } from "@/lib/dropbox/client";

interface UseDropboxSyncOptions<T> {
  dropboxPath:          string;
  localStorageKey:      string;
  defaultValue:         T;
  getValidAccessToken:  () => Promise<string | null>;
}

// Module-level counter so any hook instance can signal global sync state
let activeSyncs = 0;

function dispatchSyncEvent(syncing: boolean) {
  if (typeof window === "undefined") return;
  const lastSync = localStorage.getItem("dropbox-last-sync") ?? undefined;
  window.dispatchEvent(new CustomEvent("dropbox-sync", { detail: { syncing, lastSync } }));
}

function recordLastSync() {
  const ts = new Date().toISOString();
  localStorage.setItem("dropbox-last-sync", ts);
  dispatchSyncEvent(activeSyncs > 0);
}

function beginSync() {
  activeSyncs++;
  dispatchSyncEvent(true);
}

function endSync(success: boolean) {
  if (success) recordLastSync();
  activeSyncs = Math.max(0, activeSyncs - 1);
  if (activeSyncs === 0) dispatchSyncEvent(false);
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
      beginSync();
      let ok = false;
      try {
        const remote = await downloadFile(token, dropboxPath);
        if (remote !== null) {
          const parsed = JSON.parse(remote) as T;
          setValueState(parsed);
          localStorage.setItem(localStorageKey, remote);
        } else {
          // File doesn't exist yet — bootstrap Dropbox with local data
          const local = localStorage.getItem(localStorageKey);
          const toUpload = local ?? JSON.stringify(defaultValue);
          await uploadFile(token, dropboxPath, toUpload);
        }
        ok = true;
      } catch {}
      endSync(ok);
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
          beginSync();
          let ok = false;
          try {
            await uploadFile(token, dropboxPath, JSON.stringify(next));
            ok = true;
          } catch {}
          endSync(ok);
        }, 1500);

        return next;
      });
    },
    [dropboxPath, localStorageKey, getValidAccessToken]
  );

  return { value, setValue, syncing };
}
