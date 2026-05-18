"use client";
import { Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServingsAdjusterProps {
  servings: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ServingsAdjuster({ servings, onIncrement, onDecrement }: ServingsAdjusterProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-ink-500 uppercase tracking-widest text-label">Serves</span>
      <div className="flex items-center gap-3 bg-parchment-200 border border-parchment-300 rounded-xl p-1">
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={onDecrement}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-parchment-300 transition-colors disabled:opacity-40"
          disabled={servings <= 1}
        >
          <Minus size={14} strokeWidth={2.5} />
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.span
            key={servings}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-6 text-center font-serif text-lg font-semibold text-ink-900"
          >
            {servings}
          </motion.span>
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={onIncrement}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-parchment-300 transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
