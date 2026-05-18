"use client";
import { motion } from "framer-motion";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";

export function TimeGreeting() {
  const { greeting, suggestion } = useTimeOfDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-label uppercase tracking-widest text-ink-400 mb-1">{suggestion}</p>
      <h1 className="font-serif text-display text-ink-900 font-semibold leading-none tracking-tight">
        {greeting}.
      </h1>
    </motion.div>
  );
}
