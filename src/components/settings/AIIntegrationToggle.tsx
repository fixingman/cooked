"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AIIntegrationToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function AIIntegrationToggle({ enabled, onToggle }: AIIntegrationToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-saffron-300/40 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={18} className="text-saffron-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink-900">AI Recipe Suggestions</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-saffron-600 bg-saffron-300/30 px-1.5 py-0.5 rounded-full">Coming soon</span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5 max-w-[220px]">
            Suggest and generate recipes based on your pantry and preferences
          </p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        disabled
        className="relative w-12 h-6 rounded-full transition-colors duration-300 bg-parchment-300 opacity-40 cursor-not-allowed"
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-card"
        />
      </motion.button>
    </div>
  );
}
