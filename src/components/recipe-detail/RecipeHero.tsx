"use client";
import { ChevronLeft, Heart, Link2, Check, MoreVertical, Pencil, Trash2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FoodImage } from "@/components/ui/FoodImage";
import type { Recipe } from "@/types/recipe";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecipeStates } from "@/hooks/useRecipeStates";
import { useDropboxImage } from "@/hooks/useDropboxImage";

interface RecipeHeroProps {
  recipe: Recipe;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RecipeHero({ recipe, onEdit, onDelete }: RecipeHeroProps) {
  const router = useRouter();
  const { isFavourite, toggle } = useFavourites();
  const { isWantToCook, toggleWantToCook, hasCooked } = useRecipeStates();
  const saved = isFavourite(recipe.id);
  const bookmarked = isWantToCook(recipe.id);
  const cooked = hasCooked(recipe.id);
  const dropboxImage = useDropboxImage(recipe.heroImageDropboxPath);
  const heroSrc = dropboxImage ?? recipe.heroImageUrl;
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  function showToast(msg: string) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  function goBack() {
    try {
      const ref = document.referrer;
      if (ref) {
        const url = new URL(ref);
        if (url.origin === window.location.origin && !url.pathname.endsWith("/cook")) {
          router.back();
          return;
        }
      }
    } catch {}
    router.push("/recipes");
  }

  function share() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Link copied");
    });
  }

  return (
    <div className="relative h-[55vw] max-h-[480px] min-h-[260px] -mt-[env(safe-area-inset-top)]">
      <FoodImage
        src={heroSrc}
        alt={recipe.title}
        fill
        priority
        sizes="100vw"
        containerClassName="absolute inset-0"
      />
      <div className="absolute inset-0 bg-hero-scrim" />

      {/* Top controls */}
      <div className="fixed top-0 left-0 right-0 z-30 md:absolute flex items-center justify-between px-page-x pt-header-top pb-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
        >
          <ChevronLeft size={20} className="text-ink-900" />
        </motion.button>
        <div className="flex items-center gap-2">
          {(onEdit || onDelete) && (
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowMenu(m => !m)}
                className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
                aria-label="More options"
                title="More options"
              >
                <MoreVertical size={18} className="text-ink-700" />
              </motion.button>
              {showMenu && (
                <div className="absolute top-12 right-0 bg-parchment-100 rounded-xl shadow-card-lg border border-parchment-200 overflow-hidden z-50 min-w-[160px]">
                  {onEdit && (
                    <button
                      onClick={() => { setShowMenu(false); onEdit(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-ink-700 hover:bg-parchment-200 transition-colors text-left"
                    >
                      <Pencil size={15} className="text-ink-400" />
                      Edit recipe
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setShowMenu(false); onDelete(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <Trash2 size={15} className="text-red-400" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Copy link */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={share}
            className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
            aria-label="Copy link to recipe"
            title="Copy link"
          >
            {copied
              ? <Check size={17} className="text-sage-600" />
              : <Link2 size={17} className="text-ink-700" />
            }
          </motion.button>
          {/* Cook for later */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              toggleWantToCook(recipe.id);
              showToast(bookmarked ? "Removed from list" : "Added to cook later");
            }}
            className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
            aria-label={bookmarked ? "Remove from cook later list" : "Save to cook later"}
            title={bookmarked ? "Remove from cook later" : "Save to cook later"}
          >
            <Bookmark
              size={17}
              className={bookmarked ? "text-saffron-500" : "text-ink-700"}
              fill={bookmarked ? "currentColor" : "none"}
            />
          </motion.button>
          {/* Favourite */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              toggle(recipe.id);
              showToast(saved ? "Removed from favourites" : "Added to favourites");
            }}
            className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
            aria-label={saved ? "Remove from favourites" : "Add to favourites"}
            title={saved ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart
              size={18}
              className={saved ? "text-red-500" : "text-ink-700"}
              fill={saved ? "currentColor" : "none"}
            />
          </motion.button>
        </div>
      </div>

      {/* Toast feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-ink-900/85 text-parchment-100 text-xs px-3.5 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap z-20 pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-label uppercase tracking-widest text-parchment-300/90">
            {recipe.cuisine}
          </span>
          <span className="text-parchment-300/50">·</span>
          <span className="text-label uppercase tracking-widest text-parchment-300/90">
            by {recipe.authorName}
          </span>
          {cooked && (
            <>
              <span className="text-parchment-300/50">·</span>
              <span className="text-label uppercase tracking-widest text-sage-400">✓ Cooked</span>
            </>
          )}
        </div>
        <h1 className="font-serif text-white text-2xl md:text-3xl font-semibold leading-tight text-balance">
          {recipe.title}
        </h1>
        {recipe.subtitle && (
          <p className="text-parchment-300/80 text-sm mt-1">{recipe.subtitle}</p>
        )}
      </div>
    </div>
  );
}
