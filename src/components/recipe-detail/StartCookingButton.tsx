"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface StartCookingButtonProps {
  slug: string;
  thermomixAvailable?: boolean;
}

export function StartCookingButton({ slug, thermomixAvailable }: StartCookingButtonProps) {
  const { settings } = useSettings();
  const showTmToggle = settings.thermomixEnabled && thermomixAvailable;
  const [useTm, setUseTm] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setVisible(window.scrollY > 320);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const href = `/recipes/${slug}/cook${useTm ? "?tm=1" : ""}`;

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
      {showTmToggle && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          onClick={() => setUseTm((v) => !v)}
          className={`w-full flex items-center justify-center gap-2.5 mb-3 py-2.5 px-4 rounded-xl border transition-colors duration-200 text-sm font-medium ${
            useTm
              ? "bg-sage-100 border-sage-300 text-sage-700"
              : "bg-parchment-200 border-parchment-300 text-ink-500 hover:text-ink-700"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {useTm ? "Cooking with Thermomix" : "Cook with Thermomix instead"}
          {useTm && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto w-4 h-4 rounded-full bg-sage-500 flex items-center justify-center"
            >
              <svg width="8" height="8" viewBox="0 0 10 8" fill="white">
                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </motion.span>
          )}
        </motion.button>
      )}

      <Link href={href} className="block">
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="w-full bg-sage-500 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-card-md animate-pulse-glow font-semibold text-base"
          style={{ boxShadow: "0 4px 24px rgba(107, 140, 95, 0.4)" }}
        >
          <ChefHat size={20} />
          Start Cooking
        </motion.div>
      </Link>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
