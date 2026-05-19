"use client";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs  = Math.floor(diffMs / 1000);
  if (secs < 10)  return "just now";
  if (secs < 60)  return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DropboxConnect() {
  const { status, accountName, connect, disconnect } = useDropboxAuth();
  const [syncing,  setSyncing]  = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    setLastSync(localStorage.getItem("dropbox-last-sync"));

    function onSyncEvent(e: Event) {
      const { syncing: s, lastSync: ls } = (e as CustomEvent).detail;
      setSyncing(s);
      if (ls) setLastSync(ls);
    }

    window.addEventListener("dropbox-sync", onSyncEvent);
    return () => window.removeEventListener("dropbox-sync", onSyncEvent);
  }, []);

  // Refresh relative timestamp every 30s so "2m ago" stays accurate
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const syncLabel = syncing
    ? "Syncing…"
    : lastSync
      ? `Last synced ${relativeTime(lastSync)}`
      : "Not yet synced";

  return (
    <div className="py-4 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        status === "connected" ? "bg-sage-100" : "bg-parchment-300"
      }`}>
        {status === "connected"
          ? <Cloud size={16} className="text-sage-600" />
          : <CloudOff size={16} className="text-ink-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        {status === "connected" ? (
          <>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-ink-900">Connected</p>
              {syncing && (
                <RefreshCw size={11} className="text-sage-500 animate-spin" />
              )}
            </div>
            <p className="text-xs text-ink-400 truncate">{accountName}</p>
            <p className="text-xs text-ink-300 mt-0.5">{syncLabel}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-ink-900">Dropbox Sync</p>
            <p className="text-xs text-ink-400">Sync your data across devices</p>
          </>
        )}
      </div>

      {status === "connected" ? (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={disconnect}
          className="text-xs text-ink-500 hover:text-ink-800 transition-colors px-3 py-1.5 bg-parchment-300 rounded-lg font-medium shrink-0"
        >
          Disconnect
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={connect}
          className="text-xs text-white bg-saffron-500 hover:bg-saffron-600 transition-colors px-3 py-1.5 rounded-lg font-medium shrink-0"
        >
          Connect
        </motion.button>
      )}
    </div>
  );
}
