"use client";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePantry } from "@/hooks/usePantry";

export function PantryWidget() {
  const { items } = usePantry();

  const lowItems = items.filter(i => i.low);
  if (lowItems.length === 0) return null;

  // Low items are auto-added to the shopping list, so the widget routes there.
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href="/shopping"
        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 transition-colors"
      >
        <AlertTriangle size={15} className="text-amber-500 shrink-0" />
        <p className="flex-1 min-w-0 text-sm text-amber-800 truncate">
          <span className="font-medium">Running low — </span>
          {lowItems.map(i => i.name).join(", ")}
        </p>
        <span className="text-xs text-amber-500 shrink-0">Shopping list →</span>
      </Link>
    </motion.div>
  );
}
