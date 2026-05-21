"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { CookingStep } from "@/types/recipe";

interface StepDisplayProps {
  step: CookingStep;
  direction: number;
  totalSteps: number;
  overrideInstruction?: string;
  overrideLabel?: string;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// Settings lines always contain "Speed X" — e.g. "Cook 10 min / 100°C / Speed 2"
function isSettingsLine(s: string) {
  return /speed\s*\d+/i.test(s);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Shared TM bowl icon
function TmIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-sage-500 shrink-0">
      <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TmInstructions({ text }: { text: string }) {
  const sentences = splitSentences(text);

  return (
    // On desktop: constrain width and center; on mobile: full width
    <div className="flex flex-col gap-2.5 w-full md:max-w-sm md:mx-auto">
      {sentences.map((sentence, i) => {
        const isSettings = isSettingsLine(sentence);
        return isSettings ? (
          // Settings card — sage tint, matches left panel identity
          <div
            key={i}
            className="flex items-center gap-2.5 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3"
          >
            <TmIcon />
            <p className="text-sage-700 text-sm font-medium leading-snug">{sentence}</p>
          </div>
        ) : (
          // Action card — parchment tint, same card shape as settings
          <div
            key={i}
            className="bg-parchment-200 border border-parchment-300 rounded-xl px-4 py-3"
          >
            <p className="font-serif text-ink-900 text-base md:text-lg leading-snug text-balance md:text-center">
              {sentence}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function StepDisplay({ step, direction, totalSteps, overrideInstruction, overrideLabel }: StepDisplayProps) {
  const instruction = overrideInstruction ?? step.instruction;
  const label = overrideLabel ?? step.shortLabel;
  const isTm = !!overrideInstruction;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Step header */}
      <div className="mb-4 md:text-center">
        <p className="text-label uppercase tracking-widest text-ink-400">
          Step {step.order} of {totalSteps}
        </p>
        <p className="font-medium text-ink-500 text-sm mt-0.5">{label}</p>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id + (isTm ? "-tm" : "")}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 overflow-y-auto"
          >
            {isTm ? (
              // Vertically balanced: justify-center when content fits, scrolls when it overflows
              <div className="flex flex-col justify-center min-h-full py-2">
                <TmInstructions text={instruction} />
              </div>
            ) : (
              // Regular step: vertically centered, text centered on desktop
              <div className="flex items-center justify-center min-h-full">
                <p className="font-serif text-ink-900 text-xl md:text-2xl leading-relaxed text-balance md:text-center">
                  {instruction}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
