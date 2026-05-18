"use client";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { FoodImage } from "@/components/ui/FoodImage";
import type { Recipe } from "@/types/recipe";
import { useState } from "react";

interface RecipeHeroProps {
  recipe: Recipe;
}

export function RecipeHero({ recipe }: RecipeHeroProps) {
  const [saved, setSaved] = useState(false);

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
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-safe-top">
        <Link href="/recipes">
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
          >
            <ChevronLeft size={20} className="text-ink-900" />
          </motion.div>
        </Link>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setSaved((s) => !s)}
          className="w-10 h-10 bg-parchment-100/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card"
        >
          <Heart
            size={18}
            className={saved ? "text-red-500 fill-red-500" : "text-ink-700"}
            fill={saved ? "currentColor" : "none"}
          />
        </motion.button>
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
