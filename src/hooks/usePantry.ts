"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";
import { inferCategory } from "@/data/ingredientCategories";
import type { PantryItem } from "@/types/pantry";

function mergeItems(local: PantryItem[], remote: PantryItem[]): PantryItem[] {
  const byId = new Map(remote.map(i => [i.id, i]));
  for (const l of local) if (!byId.has(l.id)) byId.set(l.id, l);
  return Array.from(byId.values());
}

export function usePantry() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: items, setValue } = useDropboxSync<PantryItem[]>({
    dropboxPath:     "/pantry.json",
    localStorageKey: "cooked-pantry",
    defaultValue:    [],
    getValidAccessToken,
    merge: mergeItems,
  });

  const addItem = useCallback((name: string) => {
    const normalised = name.trim();
    if (!normalised) return;
    setValue(prev => {
      if (prev.some(i => i.name.toLowerCase() === normalised.toLowerCase())) return prev;
      const item: PantryItem = {
        id: crypto.randomUUID(),
        name: normalised,
        addedAt: new Date().toISOString(),
        category: inferCategory(normalised),
      };
      return [item, ...prev];
    });
  }, [setValue]);

  const removeItem = useCallback((id: string) => {
    setValue(prev => prev.filter(i => i.id !== id));
  }, [setValue]);

  const toggleLow = useCallback((id: string) => {
    setValue(prev => prev.map(i => i.id === id ? { ...i, low: !i.low } : i));
  }, [setValue]);

  // Merge an imported list, deduplicating by name
  const importItems = useCallback((incoming: PantryItem[]) => {
    setValue(prev => {
      const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
      const fresh = incoming
        .filter(i => !existingNames.has(i.name.toLowerCase()))
        .map(i => ({
          ...i,
          id: crypto.randomUUID(),
          addedAt: i.addedAt ?? new Date().toISOString(),
          category: i.category ?? inferCategory(i.name),
        }));
      return [...fresh, ...prev];
    });
  }, [setValue]);

  return { items, addItem, removeItem, toggleLow, importItems };
}
