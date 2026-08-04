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
      className="rounded-2xl border border-parchment-300 bg-parchment-100 overflow-hidden"
    >
      <div className="flex items-center justify-center bg-parchment-200/60 border-b border-parchment-300/70 py-8">
        <img src="/illustrations/cutting_board.svg" alt="" className="h-24 w-auto" />
      </div>

      <div className="px-5 pt-5 pb-6">
        <p className="font-display text-xl text-ink-800 mb-1 tracking-tight">Your cookbook is waiting.</p>
        <p className="text-sm text-ink-400 mb-5 leading-relaxed">
          Add a few recipes to unlock personalised picks, pantry matching, and more.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onImport}
            className="flex flex-col gap-2.5 p-4 bg-parchment-200/80 rounded-xl text-left border border-parchment-300/80 hover:border-saffron-300 hover:bg-saffron-50/20 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
              <Link2 size={15} className="text-saffron-600" />
            </div>
            <span className="font-serif text-sm text-ink-800 leading-snug group-hover:text-saffron-600 transition-colors">
              Import a recipe
            </span>
            <span className="text-xs text-ink-400">Paste a URL from any cooking site</span>
          </button>
          <button
            onClick={onInspire}
            className="flex flex-col gap-2.5 p-4 bg-parchment-200/80 rounded-xl text-left border border-parchment-300/80 hover:border-saffron-300 hover:bg-saffron-50/20 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
              <Sparkles size={15} className="text-saffron-600" />
            </div>
            <span className="font-serif text-sm text-ink-800 leading-snug group-hover:text-saffron-600 transition-colors">
              Get inspired
            </span>
            <span className="text-xs text-ink-400">Ask AI to suggest or create a recipe</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
