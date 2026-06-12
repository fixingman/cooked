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

  // Keep a ref that's always current so setValue can write to localStorage
  // synchronously without relying on the setValueState updater executing.
  const valueRef = useRef<T>(value);
  valueRef.current = value;

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

          valueRef.current = resolved;
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

  // Broadcast same-tab writes so sibling instances (different React component
  // trees using the same key — e.g. PantryModal + ShoppingPage) stay in sync.
  // The native "storage" event only fires in other tabs, not the current one.
  useEffect(() => {
    const eventName = `cooked-ls:${localStorageKey}`;
    const handleExternalWrite = (e: Event) => {
      const next = (e as CustomEvent<T>).detail;
      valueRef.current = next;
      setValueState(next);
    };
    window.addEventListener(eventName, handleExternalWrite);
    return () => window.removeEventListener(eventName, handleExternalWrite);
  }, [localStorageKey]);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      // Compute next synchronously from the ref (always current) so we can
      // write to localStorage immediately — before React processes the state
      // update. This prevents data loss when the calling component unmounts
      // (e.g. modal closing) before React runs the setValueState updater.
      const next = typeof updater === "function" ? (updater as (p: T) => T)(valueRef.current) : updater;
      valueRef.current = next;

      try { localStorage.setItem(localStorageKey, JSON.stringify(next)); } catch {}

      // Notify sibling instances on this page before React batches the state update
      window.dispatchEvent(new CustomEvent(`cooked-ls:${localStorageKey}`, { detail: next }));

      setValueState(next);

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
    },
    [dropboxPath, localStorageKey]
  );

  return { value, setValue, syncing };
}
