"use client";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search recipes...", className }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-parchment-200 border border-parchment-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-saffron-400 focus:bg-parchment-100 transition-all duration-200"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
          >
            <X size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
