"use client";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.38, ease } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.22, ease } }}
      className="min-h-full w-full"
    >
      {children}
    </motion.div>
  );
}
