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
const FRESH_PREFIX = /^(fresh|baby|young)\s+/i;

export function usePantry() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: items, setValue } = useDropboxSync<PantryItem[]>({
    dropboxPath:     "/pantry.json",
    localStorageKey: "cooked-pantry",
    defaultValue:    [],
    getValidAccessToken,
    merge: mergeItems,
  });

  // Migrate stale categories on load:
  // 1. Removed category keys (e.g. old "produce") → re-infer
  // 2. Catch-all "other"/"pantry" where inference now gives something specific → re-infer
  // 3. Fresh herbs stored as "spices" (pre-vegetables split) → re-infer
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    function needsMigration(i: PantryItem): boolean {
      if (i.category && !VALID_CATS.has(i.category)) return true;
      if (i.category === "other" || i.category === "pantry") {
        const inf = inferCategory(i.name);
        return inf !== "other" && inf !== "pantry";
      }
      if (i.category === "spices" && FRESH_PREFIX.test(i.name)) {
        return inferCategory(i.name) !== "spices";
      }
      return false;
    }
    if (!items.some(needsMigration)) return;
    setValue(prev => prev.map(i => needsMigration(i) ? { ...i, category: inferCategory(i.name) } : i));
  }, [items, setValue]);

  const addItem = useCallback((name: string, category?: PantryItem["category"]) => {
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
        category: category && VALID_CATS.has(category) ? category : inferCategory(normalised),
      };
      return [item, ...prev];
    });
  }, [setValue]);

  // Add to pantry marked low — used when an item lands on the shopping list but
  // wasn't already in the pantry. No-op if the item is already there (don't
  // disturb an existing entry or clear a low flag that was already set).
  const addItemLow = useCallback((name: string, category?: PantryItem["category"]) => {
    const normalised = name.trim();
    if (!normalised) return;
    setValue(prev => {
      if (prev.some(i => i.name.toLowerCase() === normalised.toLowerCase())) return prev;
      const item: PantryItem = {
        id: crypto.randomUUID(),
        name: normalised,
        addedAt: new Date().toISOString(),
        low: true,
        category: category && VALID_CATS.has(category) ? category : inferCategory(normalised),
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

  return { items, addItem, addItemLow, removeItem, toggleLow, updateCategory, importItems };
}
