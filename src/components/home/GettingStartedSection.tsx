"use client";
import { motion } from "framer-motion";
import { Link2, Sparkles } from "lucide-react";

interface GettingStartedSectionProps {
  onImport: () => void;
  onInspire: () => void;
}

export function GettingStartedSection({ onImport, onInspire }: GettingStartedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="py-2"
    >
      <p className="font-serif text-xl text-ink-700 mb-1">Your cookbook is waiting.</p>
      <p className="text-sm text-ink-400 mb-5">Add a few recipes to unlock personalised picks, pantry matching, and more.</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onImport}
          className="flex flex-col gap-2 p-4 bg-parchment-200 rounded-xl text-left hover:bg-parchment-300 transition-colors group"
        >
          <Link2 size={18} className="text-saffron-500" />
          <span className="font-serif text-sm text-ink-800 leading-snug group-hover:text-saffron-600 transition-colors">
            Import a recipe
          </span>
          <span className="text-xs text-ink-400">Paste a URL from any cooking site</span>
        </button>
        <button
          onClick={onInspire}
          className="flex flex-col gap-2 p-4 bg-parchment-200 rounded-xl text-left hover:bg-parchment-300 transition-colors group"
        >
          <Sparkles size={18} className="text-saffron-500" />
          <span className="font-serif text-sm text-ink-800 leading-snug group-hover:text-saffron-600 transition-colors">
            Get inspired
          </span>
          <span className="text-xs text-ink-400">Ask AI to suggest or create a recipe</span>
        </button>
      </div>
    </motion.div>
  );
}
