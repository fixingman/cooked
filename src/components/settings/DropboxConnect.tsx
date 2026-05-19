"use client";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";

export function DropboxConnect() {
  const { status, accountName, connect, disconnect } = useDropboxAuth();

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
            <p className="text-sm font-medium text-ink-900">Connected</p>
            <p className="text-xs text-ink-400 truncate">{accountName}</p>
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
