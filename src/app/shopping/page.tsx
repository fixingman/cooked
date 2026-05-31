"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, Check, X, Trash2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShoppingList } from "@/hooks/useShoppingList";
import { summarizeQuantity, sourceTitles } from "@/lib/shoppingList";

export default function ShoppingPage() {
  const { list, addManual, toggleChecked, removeItem, clearChecked, clearAll } = useShoppingList();
  const [draft, setDraft] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Unchecked first (newest first), then checked at the bottom.
  const sorted = useMemo(() => {
    const unchecked = list.filter(i => !i.checked);
    const checked = list.filter(i => i.checked);
    return [...unchecked, ...checked];
  }, [list]);

  const checkedCount = list.filter(i => i.checked).length;

  function handleAdd() {
    const v = draft.trim();
    if (!v) return;
    addManual(v);
    setDraft("");
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto pb-28 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl md:text-4xl text-ink-900">Shopping List</h1>
        {mounted && list.length > 0 && (
          <span className="text-sm text-ink-400">{list.length - checkedCount} to buy</span>
        )}
      </div>

      {/* Manual add */}
      <div className="relative mb-6">
        <Plus size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Add an item…"
          className="w-full pl-10 pr-20 py-3 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-parchment-100 focus:border-saffron-400 transition-all"
        />
        {draft.trim() && (
          <button
            onClick={handleAdd}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium px-3 py-1.5 rounded-lg bg-sage-500 text-parchment-100 hover:bg-sage-600 transition-colors"
          >
            Add
          </button>
        )}
      </div>

      {/* Empty state */}
      {mounted && list.length === 0 && (
        <div className="flex flex-col items-center text-center py-20">
          <div className="w-16 h-16 rounded-full bg-parchment-200 flex items-center justify-center mb-4">
            <ShoppingCart size={26} className="text-ink-300" />
          </div>
          <p className="font-serif text-lg text-ink-700">Your list is empty</p>
          <p className="text-sm text-ink-400 mt-1 max-w-xs">
            Add ingredients from any recipe, or type something above.
          </p>
        </div>
      )}

      {/* List */}
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {mounted && sorted.map(item => {
            const qty = summarizeQuantity(item.sources);
            const titles = sourceTitles(item.sources);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  item.checked
                    ? "bg-parchment-200/50 border-parchment-200"
                    : "bg-parchment-200 border-parchment-300"
                }`}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleChecked(item.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.checked ? "bg-sage-500 border-sage-500" : "border-ink-300 hover:border-sage-500"
                    }`}
                    aria-label={item.checked ? "Uncheck" : "Check off"}
                  >
                    {item.checked && <Check size={12} className="text-parchment-100" strokeWidth={3} />}
                  </button>

                  {/* Name + sources */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm transition-colors ${item.checked ? "text-ink-400 line-through" : "text-ink-900"}`}>
                      {item.name}
                    </p>
                    {titles.length > 0 && !item.checked && (
                      <p className="text-xs text-ink-400 mt-0.5 truncate">from {titles.join(", ")}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  {qty && (
                    <span className={`text-sm tabular-nums shrink-0 ${item.checked ? "text-ink-300" : "text-ink-500"}`}>
                      {qty}
                    </span>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-ink-300 hover:text-ink-700 hover:bg-parchment-300 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label="Remove"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* Footer actions */}
      {mounted && list.length > 0 && (
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-parchment-300">
          {checkedCount > 0 && (
            <button
              onClick={clearChecked}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-600 hover:text-ink-900 transition-colors"
            >
              <Check size={13} />
              Clear {checkedCount} checked
            </button>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-red-500 transition-colors ml-auto"
          >
            <Trash2 size={13} />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
