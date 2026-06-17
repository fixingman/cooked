"use client";
import { motion } from "framer-motion";

interface ThermomixToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function ThermomixToggle({ enabled, onToggle }: ThermomixToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-sage-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          {/* Thermomix bowl icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sage-600">
            <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-ink-900">Thermomix Mode</p>
          <p className="text-xs text-ink-400 mt-0.5 max-w-[220px]">
            Adds speed, temperature, and time for every compatible step.
          </p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? "bg-sage-500" : "bg-parchment-300"}`}
      >
        <motion.div
          animate={{ x: enabled ? 26 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-card"
        />
      </motion.button>
    </div>
  );
}
