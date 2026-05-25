"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { usePantry } from "@/hooks/usePantry";
import { PantryModal } from "@/components/pantry/PantryModal";
import { cn } from "@/lib/cn";

export function PantryWidget() {
  const { items } = usePantry();
  const [modalOpen, setModalOpen] = useState(false);

  const lowCount = items.filter(i => i.low).length;

  return (
    <>
      <div>
        {/* Heading row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-label uppercase tracking-widest text-ink-400">Pantry</span>
            {lowCount > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                {lowCount} low
              </span>
            )}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs text-ink-400 hover:text-ink-700 transition-colors"
          >
            Manage →
          </button>
        </div>

        {/* Chip row */}
        {items.length === 0 ? (
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm text-ink-400 hover:text-ink-600 transition-colors"
          >
            + Add ingredients
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => setModalOpen(true)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                  item.low
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-parchment-200 border-parchment-300 text-ink-700 hover:bg-parchment-300"
                )}
              >
                {item.low && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && <PantryModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
