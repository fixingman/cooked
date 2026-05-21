"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { CookingStep, ThermomixStep } from "@/types/recipe";

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

// ─── TM machine settings (the slot badges) ───────────────────────────────────

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-parchment-100 border border-parchment-300 rounded-2xl px-4 py-3 min-w-[72px]">
      <span className="font-serif text-xl font-medium text-ink-900">{value}</span>
      <span className="text-label text-ink-400 uppercase tracking-widest text-[10px]">{label}</span>
    </div>
  );
}

function TmIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-sage-500 shrink-0">
      <path d="M6 4h12l1 4H5L6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 8c0 6 2 10 7 10s7-4 7-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8v6M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TmSettingsPanel({ tm }: { tm: ThermomixStep }) {
  const tempDisplay = tm.tempC === "Varoma" ? "Varoma" : `${tm.tempC}°C`;
  const mins = Math.floor(tm.timeSeconds / 60);
  const secs = tm.timeSeconds % 60;
  const timeDisplay = secs > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${mins} min`;

  return (
    <div className="flex flex-col items-center gap-3 pb-1">
      {/* Identity */}
      <div className="flex items-center gap-1.5">
        <TmIcon />
        <span className="text-label text-sage-600 uppercase tracking-widest text-[11px] font-semibold">
          {tm.label ?? "Thermomix"}
        </span>
      </div>
      {/* Slots */}
      <div className="flex items-center gap-2">
        <StatBadge label="Speed" value={`${tm.speed}`} />
        <StatBadge label="Temp"  value={tempDisplay} />
        <StatBadge label="Time"  value={timeDisplay} />
      </div>
    </div>
  );
}

// ─── Instruction sentence splitting ──────────────────────────────────────────

function isSettingsLine(s: string) {
  return /speed\s*\d+/i.test(s);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean);
}

function TmInstructions({ text }: { text: string }) {
  const sentences = splitSentences(text);
  return (
    <div className="flex flex-col gap-2 w-full md:max-w-sm md:mx-auto">
      {sentences.map((sentence, i) =>
        isSettingsLine(sentence) ? (
          // Machine command — sage tint, matches StatBadge identity colour
          <div key={i} className="flex items-center gap-2.5 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3">
            <TmIcon />
            <p className="text-sage-700 text-sm font-medium leading-snug">{sentence}</p>
          </div>
        ) : (
          // Action sentence — neutral card
          <div key={i} className="bg-parchment-200 border border-parchment-300 rounded-xl px-4 py-3">
            <p className="font-serif text-ink-900 text-base md:text-lg leading-snug text-balance md:text-center">
              {sentence}
            </p>
          </div>
        )
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StepDisplay({ step, direction, totalSteps, overrideInstruction, overrideLabel }: StepDisplayProps) {
  const instruction = overrideInstruction ?? step.instruction;
  const label = overrideLabel ?? step.shortLabel;
  const isTm = !!overrideInstruction;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Step header */}
      <div className="mb-4 md:text-center shrink-0">
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
              <div className="flex flex-col items-center gap-5 min-h-full justify-center py-2">
                {/* Machine settings slots */}
                {step.thermomix && <TmSettingsPanel tm={step.thermomix} />}
                {/* Divider */}
                <div className="w-full max-w-sm border-t border-parchment-300" />
                {/* Instructions */}
                <TmInstructions text={instruction} />
              </div>
            ) : (
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
