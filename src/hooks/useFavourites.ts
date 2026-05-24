"use client";
import { useCallback } from "react";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDropboxSync } from "@/hooks/useDropboxSync";

export function useFavourites() {
  const { getValidAccessToken } = useDropboxAuth();
  const { value: ids, setValue } = useDropboxSync<string[]>({
    dropboxPath:     "/favourites.json",
    localStorageKey: "cooked-favourites",
    defaultValue:    [],
    getValidAccessToken,
    merge: (local, remote) => Array.from(new Set([...remote, ...local])),
  });

  const toggle = useCallback((id: string) => {
    setValue((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, [setValue]);

  const isFavourite = useCallback((id: string) => ids.includes(id), [ids]);

  return { toggle, isFavourite, favouriteIds: ids };
}
