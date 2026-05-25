"use client";
import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePantry } from "@/hooks/usePantry";
import { COMMON_INGREDIENTS } from "@/data/commonIngredients";
import { cn } from "@/lib/cn";

interface PantryModalProps {
  onClose: () => void;
}

export function PantryModal({ onClose }: PantryModalProps) {
  const { items, addItem, removeItem, toggleLow } = usePantry();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = query.trim().length > 0
    ? COMMON_INGREDIENTS
        .filter(s => s.toLowerCase().includes(query.toLowerCase()) &&
                     !items.some(i => i.name.toLowerCase() === s.toLowerCase()))
        .slice(0, 6)
    : [];

  function handleAdd(name: string) {
    addItem(name);
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && query.trim()) {
      handleAdd(query.trim());
    }
    if (e.key === "Escape") onClose();
  }

  const sorted = [...items].sort((a, b) => {
    if (a.low && !b.low) return -1;
    if (!a.low && b.low) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
        className="relative z-10 w-full max-w-lg bg-parchment-100 rounded-t-2xl md:rounded-2xl shadow-xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="font-serif text-lg font-semibold text-ink-900">Pantry</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Add input */}
        <div className="px-5 pb-3 shrink-0 relative">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Add an ingredient…"
              className="w-full pl-9 pr-10 py-2.5 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-saffron-400 transition-colors"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-5 right-5 top-full mt-1 bg-parchment-100 border border-parchment-300 rounded-xl shadow-md z-10 overflow-hidden"
              >
                {suggestions.map(s => (
                  <button
                    key={s}
                    onMouseDown={() => handleAdd(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-800 hover:bg-parchment-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
                {query.trim() && !COMMON_INGREDIENTS.some(s => s.toLowerCase() === query.trim().toLowerCase()) && (
                  <button
                    onMouseDown={() => handleAdd(query.trim())}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-500 hover:bg-parchment-200 transition-colors border-t border-parchment-300"
                  >
                    Add &ldquo;{query.trim()}&rdquo;
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 min-h-0" onClick={() => setShowSuggestions(false)}>
          {items.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-10">
              Your pantry is empty — add ingredients you have on hand.
            </p>
          ) : (
            <ul className="space-y-1">
              {sorted.map(item => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-parchment-200 transition-colors group"
                >
                  <span className={cn("flex-1 text-sm", item.low ? "text-amber-700 font-medium" : "text-ink-800")}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => toggleLow(item.id)}
                    title="Mark as running low"
                    className={cn(
                      "p-1 rounded-lg transition-colors",
                      item.low
                        ? "text-amber-500 bg-amber-50"
                        : "text-ink-300 hover:text-amber-400 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <AlertTriangle size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-lg text-ink-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-3 border-t border-parchment-300 shrink-0">
            <p className="text-xs text-ink-400">
              {items.length} item{items.length !== 1 ? "s" : ""}
              {items.filter(i => i.low).length > 0 && (
                <span className="text-amber-500"> · {items.filter(i => i.low).length} running low</span>
              )}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
