"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { downloadFile, uploadFile } from "@/lib/dropbox/client";

interface UseDropboxSyncOptions<T> {
  dropboxPath:         string;
  localStorageKey:     string;
  defaultValue:        T;
  getValidAccessToken: () => Promise<string | null>;
  // Called when both local and remote data exist. If omitted, remote wins.
  merge?:              (local: T, remote: T) => T;
}

const RESYNC_MS = 15 * 60 * 1000;
const lastDownloadedAt = new Map<string, number>();

function shouldDownload(path: string): boolean {
  const last = lastDownloadedAt.get(path) ?? 0;
  return Date.now() - last > RESYNC_MS;
}

function markDownloaded(path: string) {
  lastDownloadedAt.set(path, Date.now());
}

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

function beginSync() { activeSyncs++; dispatchSyncEvent(true); }

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
  merge,
}: UseDropboxSyncOptions<T>) {
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) return JSON.parse(stored) as T;
    } catch {}
    return defaultValue;
  });

  const [syncing, setSyncing] = useState(false);
  const debounceRef    = useRef<NodeJS.Timeout | null>(null);
  const pendingRef     = useRef<string | null>(null); // value waiting to upload (queued while offline)
  const mergeRef       = useRef(merge);
  const getTokenRef    = useRef(getValidAccessToken);
  mergeRef.current     = merge;
  getTokenRef.current  = getValidAccessToken;

  // Flush pending upload when connectivity is restored
  useEffect(() => {
    const handleOnline = async () => {
      if (!pendingRef.current) return;
      const token = await getTokenRef.current();
      if (!token) return;
      const payload = pendingRef.current;
      beginSync();
      let ok = false;
      try {
        await uploadFile(token, dropboxPath, payload);
        pendingRef.current = null;
        ok = true;
      } catch {}
      endSync(ok);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [dropboxPath]);

  // Initial reconcile with Dropbox (once per 15 min per path)
  useEffect(() => {
    if (!shouldDownload(dropboxPath)) return;
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
          const localRaw = localStorage.getItem(localStorageKey);
          const local = localRaw ? (JSON.parse(localRaw) as T) : null;

          // Merge local additions into remote rather than overwriting
          const resolved = local !== null && mergeRef.current
            ? mergeRef.current(local, parsed)
            : parsed;

          setValueState(resolved);
          const resolvedStr = JSON.stringify(resolved);
          localStorage.setItem(localStorageKey, resolvedStr);

          // Push merged result back if it differs from remote (local had new items)
          if (resolvedStr !== remote) {
            uploadFile(token, dropboxPath, resolvedStr).catch(() => {
              pendingRef.current = resolvedStr;
            });
          }
        } else {
          // File doesn't exist yet — bootstrap Dropbox with local data
          const local = localStorage.getItem(localStorageKey);
          const toUpload = local ?? JSON.stringify(defaultValue);
          await uploadFile(token, dropboxPath, toUpload);
        }
        markDownloaded(dropboxPath);
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

        try { localStorage.setItem(localStorageKey, JSON.stringify(next)); } catch {}

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          const serialised = JSON.stringify(next);
          const token = await getTokenRef.current();
          if (!token) {
            pendingRef.current = serialised; // queue for when online/reconnected
            return;
          }
          beginSync();
          let ok = false;
          try {
            await uploadFile(token, dropboxPath, serialised);
            pendingRef.current = null;
            ok = true;
          } catch {
            pendingRef.current = serialised; // network error — retry on online
          }
          endSync(ok);
        }, 1500);

        return next;
      });
    },
    [dropboxPath, localStorageKey]
  );

  return { value, setValue, syncing };
}
