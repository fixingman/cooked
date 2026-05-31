"use client";
import { useCallback, useEffect, useRef } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";
import { inferCategory, CATEGORY_ORDER } from "@/data/ingredientCategories";
import type { PantryItem } from "@/types/pantry";

function mergeItems(local: PantryItem[], remote: PantryItem[]): PantryItem[] {
  const byId = new Map(remote.map(i => [i.id, i]));
  for (const l of local) if (!byId.has(l.id)) byId.set(l.id, l);
  return Array.from(byId.values());
}

const VALID_CATS = new Set<string>(CATEGORY_ORDER);

export function usePantry() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: items, setValue } = useDropboxSync<PantryItem[]>({
    dropboxPath:     "/pantry.json",
    localStorageKey: "cooked-pantry",
    defaultValue:    [],
    getValidAccessToken,
    merge: mergeItems,
  });

  // Migrate items whose stored category was removed in a previous version (e.g. "produce")
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    const hasStale = items.some(i => i.category && !VALID_CATS.has(i.category));
    if (!hasStale) return;
    setValue(prev => prev.map(i =>
      i.category && !VALID_CATS.has(i.category)
        ? { ...i, category: inferCategory(i.name) }
        : i
    ));
  }, [items, setValue]);

  const addItem = useCallback((name: string) => {
    const normalised = name.trim();
    if (!normalised) return;
    setValue(prev => {
      // Already have it — clear any "low" flag (re-adding = restocked) and keep the rest.
      if (prev.some(i => i.name.toLowerCase() === normalised.toLowerCase())) {
        return prev.map(i =>
          i.name.toLowerCase() === normalised.toLowerCase() && i.low ? { ...i, low: false } : i
        );
      }
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

  const updateCategory = useCallback((id: string, category: PantryItem["category"]) => {
    setValue(prev => prev.map(i => i.id === id ? { ...i, category } : i));
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

  return { items, addItem, removeItem, toggleLow, updateCategory, importItems };
}
