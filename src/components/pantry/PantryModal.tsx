"use client";
import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Search, Download, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePantry } from "@/hooks/usePantry";
import { COMMON_INGREDIENTS } from "@/data/commonIngredients";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/data/ingredientCategories";
import { cn } from "@/lib/cn";
import type { PantryItem } from "@/types/pantry";

interface PantryModalProps {
  onClose: () => void;
}

const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1];

export function PantryModal({ onClose }: PantryModalProps) {
  const { items, addItem, removeItem, toggleLow, importItems } = usePantry();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const panelVariants = isDesktop ? {
    hidden: { x: "100%", transition: { duration: 0.22, ease: EXIT_EASE } },
    visible: { x: 0, transition: { type: "spring" as const, stiffness: 340, damping: 38 } },
  } : {
    hidden: { y: "100%", transition: { duration: 0.22, ease: EXIT_EASE } },
    visible: { y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 38 } },
  };

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
    if (e.key === "Enter" && query.trim()) handleAdd(query.trim());
    if (e.key === "Escape") onClose();
  }

  // Export as JSON
  function handleExport() {
    const data = JSON.stringify({ version: 1, items }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pantry.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import from JSON or plain text
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        // Our export format: { version, items }
        const list: PantryItem[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.items) ? parsed.items : [];
        if (list.length > 0) importItems(list);
      } catch {
        // Plain text: one item per line
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          importItems(lines.map(name => ({
            id: crypto.randomUUID(),
            name,
            addedAt: new Date().toISOString(),
          })));
        }
      }
      // Reset so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  }

  // Group items by category, alphabetical within each group, low items first
  const grouped = CATEGORY_ORDER.reduce<Record<string, PantryItem[]>>((acc, cat) => {
    const catItems = items
      .filter(i => (i.category ?? "other") === cat)
      .sort((a, b) => {
        if (a.low && !b.low) return -1;
        if (!a.low && b.low) return 1;
        return a.name.localeCompare(b.name);
      });
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const categoryKeys = Object.keys(grouped);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={[
          "fixed z-50 flex flex-col bg-parchment-100 overflow-hidden",
          "bottom-0 left-0 right-0 max-h-[90dvh] rounded-t-[1.5rem] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]",
          "md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[420px] md:max-h-none md:rounded-none md:rounded-tl-[1.5rem] md:rounded-bl-[1.5rem] md:shadow-[-8px_0_48px_rgba(0,0,0,0.14)]",
        ].join(" ")}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-parchment-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h2 className="font-serif text-lg font-semibold text-ink-900">Pantry</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              disabled={items.length === 0}
              title="Export pantry"
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 disabled:opacity-30 transition-colors"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import pantry"
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 transition-colors"
            >
              <Upload size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={handleImportFile}
            />
            <div className="w-px h-4 bg-parchment-300 mx-1" />
            <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 transition-colors">
              <X size={16} />
            </button>
          </div>
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

        {/* Item list — grouped by category */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 min-h-0" onClick={() => setShowSuggestions(false)}>
          {items.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-10">
              Your pantry is empty — add ingredients you have on hand.
            </p>
          ) : (
            <div className="space-y-5">
              {categoryKeys.map(cat => (
                <div key={cat}>
                  <p className="text-label uppercase tracking-widest text-ink-400 mb-1.5 px-1">
                    {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                  </p>
                  <ul className="space-y-0.5">
                    {grouped[cat].map(item => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-parchment-200 transition-colors group"
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
                </div>
              ))}
            </div>
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
    </>
  );
}
