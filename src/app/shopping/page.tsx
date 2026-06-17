"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, Check, X, Trash2, ShoppingCart, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShoppingList } from "@/hooks/useShoppingList";
import { PantryModal } from "@/components/pantry/PantryModal";
import { summarizeQuantity, sourceTitles } from "@/lib/shoppingList";
import { inferCategory, CATEGORY_LABELS, CATEGORY_ORDER } from "@/data/ingredientCategories";
import type { ShoppingItem } from "@/types/shoppingList";

function ShoppingRow({ item, onToggle, onRemove }: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const qty = summarizeQuantity(item.sources);
  const titles = sourceTitles(item.sources);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        item.checked ? "bg-parchment-200/50 border-parchment-200" : "bg-parchment-200 border-parchment-300"
      }`}>
        <button
          onClick={() => onToggle(item.id)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            item.checked ? "bg-sage-500 border-sage-500" : "border-ink-300 hover:border-sage-500"
          }`}
          aria-label={item.checked ? "Uncheck" : "Check off"}
        >
          {item.checked && <Check size={12} className="text-parchment-100" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm transition-colors ${item.checked ? "text-ink-400 line-through" : "text-ink-900"}`}>
            {item.name}
          </p>
          {!item.checked && titles.length > 0 && (
            <p className="text-xs text-ink-400 mt-0.5 truncate">
              {titles.map(t => `from ${t}`).join(" · ")}
            </p>
          )}
        </div>

        {qty && (
          <span className={`text-sm tabular-nums shrink-0 ${item.checked ? "text-ink-300" : "text-ink-500"}`}>
            {qty}
          </span>
        )}

        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 flex items-center justify-center rounded-full text-ink-300 hover:text-ink-700 hover:bg-parchment-300 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          aria-label="Remove"
        >
          <X size={13} />
        </button>
      </div>
    </motion.li>
  );
}

export default function ShoppingPage() {
  const { list, addManual, toggleChecked, removeItem, clearChecked, clearAll } = useShoppingList();
  const [draft, setDraft] = useState("");
  const [pantryOpen, setPantryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Group unchecked items by inferred category, in CATEGORY_ORDER; checked items at the bottom.
  const { groups, checked } = useMemo(() => {
    const unchecked = list.filter(i => !i.checked);
    const byCategory = new Map<string, ShoppingItem[]>();
    for (const item of unchecked) {
      const cat = inferCategory(item.name);
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(item);
    }
    const groups = CATEGORY_ORDER
      .filter(cat => byCategory.has(cat))
      .map(cat => ({ cat, label: CATEGORY_LABELS[cat], items: byCategory.get(cat)! }));
    return { groups, checked: list.filter(i => i.checked) };
  }, [list]);

  const checkedCount = checked.length;

  function handleAdd() {
    const v = draft.trim();
    if (!v) return;
    addManual(v);
    setDraft("");
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto pb-28 md:pb-12">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-3xl md:text-4xl text-ink-900">Shopping List</h1>
        <button
          onClick={() => setPantryOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-parchment-300 text-ink-600 hover:bg-parchment-200 transition-colors shrink-0"
        >
          <Archive size={14} className="text-sage-500" />
          Pantry
        </button>
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
      <AnimatePresence initial={false}>
        {mounted && groups.map(({ cat, label, items }) => (
          <div key={cat} className="mb-5">
            <p className="text-label uppercase tracking-widest text-ink-400 mb-2 px-1">{label}</p>
            <ul className="space-y-1.5">
              {items.map(item => <ShoppingRow key={item.id} item={item} onToggle={toggleChecked} onRemove={removeItem} />)}
            </ul>
          </div>
        ))}

        {mounted && checked.length > 0 && (
          <div className="mt-2">
            <p className="text-label uppercase tracking-widest text-ink-400 mb-2 px-1">Done</p>
            <ul className="space-y-1.5">
              {checked.map(item => <ShoppingRow key={item.id} item={item} onToggle={toggleChecked} onRemove={removeItem} />)}
            </ul>
          </div>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {pantryOpen && <PantryModal onClose={() => setPantryOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
