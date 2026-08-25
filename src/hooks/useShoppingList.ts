"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";
import { usePantry } from "@/hooks/usePantry";
import { normalizeForMatch, cleanForPantry } from "@/lib/ingredientUtils";
import type { ShoppingItem, ShoppingSource } from "@/types/shoppingList";
import type { Ingredient } from "@/types/recipe";

function mergeItems(local: ShoppingItem[], remote: ShoppingItem[]): ShoppingItem[] {
  // Step 1: union by id — offline additions on any device survive a remote overwrite.
  const byId = new Map(remote.map(i => [i.id, i]));
  for (const l of local) if (!byId.has(l.id)) byId.set(l.id, l);

  // Step 2: dedupe by normalised name — same ingredient added on two devices gets
  // two UUIDs and both survive step 1, producing visible duplicates. Merge them:
  // combine sources (deduped by recipeId+unit), OR boolean flags, prefer unchecked,
  // keep whichever has a category, take the newer addedAt.
  const byName = new Map<string, ShoppingItem>();
  for (const item of Array.from(byId.values())) {
    const key = normalizeForMatch(item.name);
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, item);
    } else {
      const sources = [...existing.sources];
      for (const s of item.sources) {
        if (!sources.some(e => e.recipeId === s.recipeId && e.unit === s.unit)) sources.push(s);
      }
      byName.set(key, {
        ...existing,
        sources,
        checked:    existing.checked && item.checked,
        fromPantry: existing.fromPantry || item.fromPantry,
        manual:     existing.manual     || item.manual,
        category:   existing.category   ?? item.category,
        addedAt:    existing.addedAt > item.addedAt ? existing.addedAt : item.addedAt,
      });
    }
  }
  return Array.from(byName.values());
}

export function useShoppingList() {
  const { getValidAccessToken } = useDropboxAuth();
  const { addItem: addToPantry, addItemLow: addToPantryLow } = usePantry();
  const { value: list, setValue } = useDropboxSync<ShoppingItem[]>({
    dropboxPath:     "/shopping-list.json",
    localStorageKey: "cooked-shopping-list",
    defaultValue:    [],
    getValidAccessToken,
    merge: mergeItems,
  });

  // Add a single item by hand (no recipe source).
  const addManual = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const key = normalizeForMatch(clean);
    const isNew = !list.some(i => normalizeForMatch(i.name) === key);
    setValue(prev => {
      if (prev.some(i => normalizeForMatch(i.name) === key)) return prev;
      const item: ShoppingItem = {
        id: crypto.randomUUID(),
        name: clean.charAt(0).toUpperCase() + clean.slice(1),
        checked: false,
        addedAt: new Date().toISOString(),
        sources: [],
        manual: true,
      };
      return [item, ...prev];
    });
    if (isNew) addToPantryLow(clean);
  }, [list, setValue, addToPantryLow]);

  // Add selected ingredients from a recipe. An ingredient used more than once in
  // the same recipe (e.g. garam masala in marinade + sauce) is summed into a
  // single source first; adding the same recipe again is idempotent (deduped by
  // recipeId). Quantities across different recipes are summed at display time.
  const addFromRecipe = useCallback((ingredients: Ingredient[], recipeId: string, recipeTitle: string) => {
    // Aggregate within this recipe, keyed by normalized name + unit.
    const perKey = new Map<string, { name: string; source: ShoppingSource }>();
    for (const ing of ingredients) {
      const norm = normalizeForMatch(ing.name);
      if (!norm) continue;
      const key = `${norm}|${ing.unit}`;
      const hit = perKey.get(key);
      if (hit) {
        hit.source.quantity += ing.quantity;
      } else {
        perKey.set(key, { name: ing.name, source: { recipeId, recipeTitle, quantity: ing.quantity, unit: ing.unit } });
      }
    }

    const entries = Array.from(perKey.values());
    setValue(prev => {
      const next = prev.map(i => ({ ...i, sources: [...i.sources] }));
      for (const { name, source } of entries) {
        const norm = normalizeForMatch(name);
        const existing = next.find(i => normalizeForMatch(i.name) === norm);
        if (existing) {
          // Idempotent re-add: skip if this recipe+unit already contributed.
          if (!existing.sources.some(s => s.recipeId === recipeId && s.unit === source.unit)) {
            existing.sources.push(source);
            existing.checked = false; // re-surface a line you'd already ticked off
          }
        } else {
          next.unshift({
            id: crypto.randomUUID(),
            name: cleanForPantry(name),
            checked: false,
            addedAt: new Date().toISOString(),
            sources: [source],
          });
        }
      }
      return next;
    });
    // Mirror ingredients to pantry as low — no-op if already in pantry.
    for (const { name } of entries) {
      addToPantryLow(cleanForPantry(name));
    }
  }, [setValue, addToPantryLow]);

  // Check off: add to pantry and remove from the list immediately.
  const toggleChecked = useCallback((id: string) => {
    const item = list.find(i => i.id === id);
    if (!item) return;
    addToPantry(item.name, item.category);
    setValue(prev => prev.filter(i => i.id !== id));
  }, [list, setValue, addToPantry]);

  // Pantry → shopping: a pantry item ran low. Add it (deduped by name); if it's
  // already on the list from a recipe, just flag it as also-low and un-check it.
  // The pantry item's category is carried over so grouping matches the pantry.
  const addFromPantry = useCallback((name: string, category?: ShoppingItem["category"]) => {
    const clean = name.trim();
    if (!clean) return;
    const key = normalizeForMatch(clean);
    if (!key) return;
    setValue(prev => {
      const existing = prev.find(i => normalizeForMatch(i.name) === key);
      if (existing) {
        return prev.map(i => i === existing
          ? { ...i, fromPantry: true, checked: false, ...(category ? { category } : {}) }
          : i);
      }
      const item: ShoppingItem = {
        id: crypto.randomUUID(),
        name: cleanForPantry(clean),
        checked: false,
        addedAt: new Date().toISOString(),
        sources: [],
        fromPantry: true,
        ...(category ? { category } : {}),
      };
      return [item, ...prev];
    });
  }, [setValue]);

  // AI categorise (pantry modal button) writes shopping categories through this.
  const updateCategory = useCallback((id: string, category: ShoppingItem["category"]) => {
    setValue(prev => prev.map(i => i.id === id ? { ...i, category } : i));
  }, [setValue]);

  // Un-marking low removes the line only if it's a pure pantry item still unbought
  // (never yank a recipe-sourced or already-checked line).
  const removeFromPantry = useCallback((name: string) => {
    const key = normalizeForMatch(name);
    setValue(prev => prev.filter(i =>
      !(normalizeForMatch(i.name) === key && i.fromPantry && i.sources.length === 0 && !i.checked)
    ));
  }, [setValue]);

  const removeItem = useCallback((id: string) => {
    setValue(prev => prev.filter(i => i.id !== id));
  }, [setValue]);

  const clearChecked = useCallback(() => {
    setValue(prev => prev.filter(i => !i.checked));
  }, [setValue]);

  const clearAll = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return { list, addManual, addFromRecipe, addFromPantry, removeFromPantry, toggleChecked, removeItem, clearChecked, clearAll, updateCategory };
}
