"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { TimerBlock } from "./TimerBlock";
import type { ThermomixStep } from "@/types/recipe";

interface ThermomixStepPanelProps {
  step: ThermomixStep;
  stepId: string;
  direction: number;
  remaining: number;
  isRunning: boolean;
  onToggleTimer: () => void;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function ThermomixStepPanel({ step, stepId, direction, remaining, isRunning, onToggleTimer }: ThermomixStepPanelProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepId}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5 w-full"
      >
        {/* Bowl icon + label */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-sage-600">
              <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-label text-sage-600 uppercase tracking-widest text-[11px] font-semibold">
            {step.label ?? "Thermomix"}
          </span>
        </div>

        {/* Live countdown */}
        <TimerBlock remaining={remaining} />

        {/* Start / pause */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggleTimer}
          className="flex items-center gap-2 px-5 py-2.5 bg-sage-500 text-white rounded-full text-sm font-medium hover:bg-sage-600 transition-colors"
        >
          {isRunning
            ? <><Pause size={14} fill="currentColor" /> Pause</>
            : <><Play size={14} fill="currentColor" className="ml-0.5" /> Start</>
          }
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
