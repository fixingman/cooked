"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { CookingStep } from "@/types/recipe";

interface StepDisplayProps {
  step: CookingStep;
  direction: number;
  totalSteps: number;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function StepDisplay({ step, direction, totalSteps }: StepDisplayProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-4">
        <p className="text-label uppercase tracking-widest text-ink-400">
          Step {step.order} of {totalSteps}
        </p>
        <p className="font-medium text-ink-500 text-sm mt-0.5">{step.shortLabel}</p>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-start"
          >
            <p className="font-serif text-ink-900 text-xl md:text-2xl leading-relaxed text-balance">
              {step.instruction}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
