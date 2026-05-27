"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { uploadBinary } from "@/lib/dropbox/client";
import type { Recipe } from "@/types/recipe";

interface ImageOption {
  url: string;
  thumb: string;
  alt: string;
  isCurrent?: boolean;
}

interface ImagePickerModalProps {
  recipe: Recipe;
  currentSrc: string | null; // resolved display src (may be Dropbox URL)
  onClose: () => void;
}

export function ImagePickerModal({ recipe, currentSrc, onClose }: ImagePickerModalProps) {
  const { updateRecipe } = useUserRecipes();
  const { status: dropboxStatus, getValidAccessToken } = useDropboxAuth();

  const [unsplashImages, setUnsplashImages] = useState<ImageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected] = useState<ImageOption | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    fetch("/api/recipes/search-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: recipe.title, cuisine: recipe.cuisine }),
    })
      .then(r => r.json())
      .then(data => {
        setUnsplashImages(data.images ?? []);
        setLoading(false);
      })
      .catch(() => { setFetchError("Could not load images."); setLoading(false); });
  }, [recipe.title, recipe.cuisine]);

  // Current image shown first (uses resolved Dropbox URL if available for display, heroImageUrl for storage)
  const currentOption: ImageOption | null = (currentSrc ?? recipe.heroImageUrl)
    ? { url: recipe.heroImageUrl ?? currentSrc!, thumb: currentSrc ?? recipe.heroImageUrl!, alt: recipe.title, isCurrent: true }
    : null;

  const allImages = currentOption ? [currentOption, ...unsplashImages] : unsplashImages;

  async function handleSave() {
    if (!selected) return;
    // Selecting "Current" = no change needed
    if (selected.isCurrent) { onClose(); return; }

    setSaving(true);
    if (dropboxStatus === "connected") {
      try {
        const token = await getValidAccessToken();
        if (token) {
          const res = await fetch(selected.url, { signal: AbortSignal.timeout(10_000) });
          if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            const imagePath = `/images/${recipe.id}.jpg`;
            await uploadBinary(token, imagePath, dataUrl);
            updateRecipe(recipe.id, {
              heroImageUrl: selected.url,
              heroImageDropboxPath: imagePath,
              imageSource: "ai-found",
              imageQuality: "ok",
            });
            onClose();
            return;
          }
        }
      } catch {}
    }
    updateRecipe(recipe.id, { heroImageUrl: selected.url, imageSource: "ai-found", imageQuality: "ok" });
    onClose();
  }

  const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1];
  const panelVariants = isDesktop ? {
    hidden: { x: "100%", transition: { duration: 0.22, ease: EXIT_EASE } },
    visible: { x: 0, transition: { type: "spring" as const, stiffness: 340, damping: 38 } },
  } : {
    hidden: { y: "100%", transition: { duration: 0.22, ease: EXIT_EASE } },
    visible: { y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 38 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="panel"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={[
          "fixed z-50 flex flex-col bg-parchment-100 overflow-hidden",
          "bottom-0 left-0 right-0 max-h-[90dvh] rounded-t-[1.5rem] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]",
          "md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[480px] md:max-h-none md:rounded-none md:rounded-tl-[1.5rem] md:rounded-bl-[1.5rem] md:shadow-[-8px_0_48px_rgba(0,0,0,0.14)]",
        ].join(" ")}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-parchment-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-parchment-300">
          <h2 className="font-serif text-lg text-ink-900 font-semibold">Change image</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment-200 transition-colors"
          >
            <X size={18} className="text-ink-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-parchment-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : fetchError ? (
            <p className="text-sm text-ink-400 text-center py-16">{fetchError}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {allImages.map((img, i) => {
                  const isSelected = selected?.url === img.url;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(img)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden focus:outline-none group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumb}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                      {img.isCurrent && (
                        <div className="absolute bottom-1.5 left-1.5 bg-ink-900/70 backdrop-blur-sm text-parchment-100 text-[10px] font-medium px-1.5 py-0.5 rounded-md leading-tight">
                          Current
                        </div>
                      )}
                      <div className={[
                        "absolute inset-0 rounded-xl transition-all duration-150 ring-inset",
                        isSelected ? "ring-2 ring-saffron-500" : "group-hover:ring-2 group-hover:ring-parchment-400",
                      ].join(" ")} />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-saffron-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check size={11} className="text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-300 mt-4 text-center">Unsplash · tap to select</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pt-3 pb-5 md:pb-5 border-t border-parchment-300 bg-parchment-100">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full py-3 bg-sage-500 text-white rounded-xl text-sm font-medium hover:bg-sage-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Saving…" : selected?.isCurrent ? "Keep current" : "Use this image"}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
