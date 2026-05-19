"use client";
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "cooked-favourites";

function load(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function save(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
}

export function useFavourites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => { setIds(load()); }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      save(next);
      return next;
    });
  }, []);

  const isFavourite = useCallback((id: string) => ids.includes(id), [ids]);

  return { toggle, isFavourite };
}
