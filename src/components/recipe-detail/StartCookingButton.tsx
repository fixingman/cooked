"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";

interface StartCookingButtonProps {
  slug: string;
}

export function StartCookingButton({ slug }: StartCookingButtonProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 pb-safe-bottom bg-gradient-to-t from-parchment-100 via-parchment-100/95 to-transparent pt-8 -mx-4 md:-mx-6">
      <Link href={`/recipes/${slug}/cook`} className="block">
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="w-full bg-sage-500 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-card-md animate-pulse-glow font-semibold text-base"
          style={{ boxShadow: "0 4px 24px rgba(107, 140, 95, 0.4)" }}
        >
          <ChefHat size={20} />
          Start Cooking
        </motion.div>
      </Link>
    </div>
  );
}
