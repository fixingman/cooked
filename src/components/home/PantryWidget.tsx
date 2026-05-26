"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePantry } from "@/hooks/usePantry";
import { PantryModal } from "@/components/pantry/PantryModal";

export function PantryWidget() {
  const { items } = usePantry();
  const [modalOpen, setModalOpen] = useState(false);

  const lowItems = items.filter(i => i.low);
  if (lowItems.length === 0) return null;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 transition-colors"
      >
        <AlertTriangle size={15} className="text-amber-500 shrink-0" />
        <p className="flex-1 min-w-0 text-sm text-amber-800 truncate">
          <span className="font-medium">Running low — </span>
          {lowItems.map(i => i.name).join(", ")}
        </p>
        <span className="text-xs text-amber-500 shrink-0">Manage →</span>
      </motion.button>

      <AnimatePresence>
        {modalOpen && <PantryModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
