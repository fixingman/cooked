"use client";
import { ChevronLeft, Heart, Link2, Check, MoreVertical, Pencil, Trash2, Bookmark, ImagePlus } from "lucide-react";
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
  onChangeImage?: () => void;
}

export function RecipeHero({ recipe, onEdit, onDelete, onChangeImage }: RecipeHeroProps) {
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
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/recipes");
    }
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
          {(onEdit || onDelete || onChangeImage) && (
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
                  {onChangeImage && (
                    <button
                      onClick={() => { setShowMenu(false); onChangeImage(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-ink-700 hover:bg-parchment-200 transition-colors text-left"
                    >
                      <ImagePlus size={15} className="text-ink-400" />
                      Change image
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => { setShowMenu(false); onEdit(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-ink-700 hover:bg-parchment-200 transition-colors text-left border-t border-parchment-200"
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
              showToast(bookmarked ? "Removed from list" : "Saved for later.");
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[calc(var(--nav-h)+1.25rem)] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-ink-900 text-parchment-100 text-sm font-medium px-5 py-3 rounded-xl shadow-card-lg whitespace-nowrap">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
        <div className="flex items-center gap-2 mb-2">
          {[
            recipe.cuisine && recipe.cuisine !== "any" ? { text: recipe.cuisine, cl: "text-parchment-300/90" } : null,
            cooked ? { text: "✓ Cooked", cl: "text-sage-400" } : null,
            recipe.imageSource === "ai-found" ? { text: "AI image", cl: "text-parchment-400/70" } : null,
            recipe.imageQuality === "low" && recipe.imageSource !== "ai-found" ? { text: "Low res", cl: "text-amber-400/80" } : null,
          ].filter(Boolean).map((bit, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-parchment-300/50">·</span>}
              <span className={`text-label uppercase tracking-widest ${bit!.cl}`}>{bit!.text}</span>
            </span>
          ))}
        </div>
        <h1 className="font-display text-white text-2xl md:text-3xl font-semibold leading-tight text-balance">
          {recipe.title}
        </h1>
        {recipe.subtitle && (
          <p className="text-parchment-300/80 text-sm mt-1">{recipe.subtitle}</p>
        )}
      </div>
    </div>
  );
}
