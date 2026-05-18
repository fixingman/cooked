"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, active, onClick, className }: ChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-4 py-1.5 rounded-chip text-sm font-medium transition-all duration-200 select-none whitespace-nowrap border",
        active
          ? "bg-ink-900 text-parchment-100 border-ink-900"
          : "bg-parchment-200 text-ink-700 border-parchment-300 hover:bg-parchment-300 hover:border-parchment-400",
        className
      )}
    >
      {label}
    </motion.button>
  );
}
