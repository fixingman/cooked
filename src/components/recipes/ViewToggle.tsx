"use client";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ViewMode } from "@/hooks/useRecipeFilter";

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="flex bg-parchment-200 rounded-xl p-1 border border-parchment-300">
      {(["grid", "list"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "p-1.5 rounded-lg transition-all duration-200",
            viewMode === mode
              ? "bg-parchment-100 text-ink-900 shadow-card"
              : "text-ink-400 hover:text-ink-700"
          )}
        >
          {mode === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
        </button>
      ))}
    </div>
  );
}
