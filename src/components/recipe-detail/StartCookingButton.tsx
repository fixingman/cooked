"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface StartCookingButtonProps {
  slug: string;
  thermomixAvailable?: boolean;
}

const TmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function StartCookingButton({ slug, thermomixAvailable }: StartCookingButtonProps) {
  const { settings } = useSettings();
  const showTm = settings.thermomixEnabled && thermomixAvailable;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setVisible(window.scrollY > 320);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="start-cooking-bar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="sticky bottom-0 left-0 right-0 p-4 pb-safe-bottom bg-gradient-to-t from-parchment-100 via-parchment-100/95 to-transparent pt-8 -mx-4 md:-mx-6"
        >
          {showTm ? (
            <div className="flex gap-2.5">
              <Link href={`/recipes/${slug}/cook`} className="flex-1" title="Start cooking without Thermomix">
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-parchment-200 border border-parchment-300 text-ink-700 rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-medium text-sm hover:bg-parchment-300 transition-colors"
                >
                  <ChefHat size={17} />
                  Standard
                </motion.div>
              </Link>
              <Link href={`/recipes/${slug}/cook?tm=1`} className="flex-[1.6]" title="Start cooking with Thermomix">
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-sage-500 text-white rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm hover:bg-sage-600 transition-colors"
                  style={{ boxShadow: "0 4px 20px rgba(107, 140, 95, 0.35)" }}
                >
                  <TmIcon />
                  Cook with Thermomix
                </motion.div>
              </Link>
            </div>
          ) : (
            <Link href={`/recipes/${slug}/cook`} className="block" title="Start step-by-step cooking mode">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="w-full bg-sage-500 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-semibold text-base"
                style={{ boxShadow: "0 4px 24px rgba(107, 140, 95, 0.4)" }}
              >
                <ChefHat size={20} />
                Start Cooking
              </motion.div>
            </Link>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
