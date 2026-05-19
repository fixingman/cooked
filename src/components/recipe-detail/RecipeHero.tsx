"use client";
import { ChevronLeft, Heart, Link2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodImage } from "@/components/ui/FoodImage";
import type { Recipe } from "@/types/recipe";
import { useFavourites } from "@/hooks/useFavourites";

interface RecipeHeroProps {
  recipe: Recipe;
}

export function RecipeHero({ recipe }: RecipeHeroProps) {
  const router = useRouter();
  const { isFavourite, toggle } = useFavourites();
  const saved = isFavourite(recipe.id);
  const [copied, setCopied] = useState(false);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/recipes");
  }

  function share() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative h-[55vw] max-h-[480px] min-h-[260px]">
      <FoodImage
        src={recipe.heroImageUrl}
        alt={recipe.title}
        fill
        priority
        sizes="100vw"
        containerClassName="absolute inset-0"
      />
      <div className="absolute inset-0 bg-hero-scrim" />

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-page-x pt-header-top pb-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
        >
          <ChevronLeft size={20} className="text-ink-900" />
        </motion.button>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={share}
            className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
            aria-label="Copy link"
          >
            {copied
              ? <Check size={17} className="text-sage-600" />
              : <Link2 size={17} className="text-ink-700" />
            }
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => toggle(recipe.id)}
            className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
          >
            <Heart
              size={18}
              className={saved ? "text-red-500 fill-red-500" : "text-ink-700"}
              fill={saved ? "currentColor" : "none"}
            />
          </motion.button>
        </div>
      </div>

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
