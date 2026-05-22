"use client";
import { motion, AnimatePresence } from "framer-motion";
import { FoodImage } from "@/components/ui/FoodImage";

interface IngredientContextProps {
  imageUrl: string;
  stepId: string;
}

export function IngredientContext({ imageUrl, stepId }: IngredientContextProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepId}
        initial={{ opacity: 0, scale: 0.88, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 1.06, rotate: 4 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="relative w-full aspect-square max-w-[240px] mx-auto"
      >
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-card-lg">
          <FoodImage
            src={imageUrl}
            alt="Current step"
            fill
            sizes="240px"
            containerClassName="absolute inset-0"
          />
        </div>
        {/* Decorative ring */}
        <div className="absolute -inset-3 rounded-[calc(1.5rem+12px)] border-2 border-parchment-300/60" />
      </motion.div>
    </AnimatePresence>
  );
}
