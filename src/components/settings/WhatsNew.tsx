"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { changelog } from "@/data/changelog";

function Entry({ version, date, notes }: { version: string; date: string; notes: string[] }) {
  const when = new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <div className="py-4 border-b border-parchment-300 last:border-0">
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-serif text-sm text-ink-900">v{version}</p>
        <p className="text-[11px] uppercase tracking-widest text-ink-400">{when}</p>
      </div>
      <ul className="space-y-1.5">
        {notes.map((note, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-700">
            <span className="text-saffron-500 shrink-0">◆</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhatsNew() {
  const [expanded, setExpanded] = useState(false);
  const [latest, ...earlier] = changelog;

  return (
    <div className="py-2">
      <Entry {...latest} />

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {earlier.map((e) => (
              <Entry key={e.version} {...e} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {earlier.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-500 pt-4 pb-2"
        >
          {expanded ? "Show less" : "Show earlier updates"}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.span>
        </motion.button>
      )}
    </div>
  );
}
