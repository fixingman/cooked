"use client";
import { motion } from "framer-motion";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";

export function TimeGreeting() {
  const { greeting } = useTimeOfDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="font-display text-display text-ink-900 font-semibold leading-none tracking-tight">
        {greeting}
      </h1>
    </motion.div>
  );
}
