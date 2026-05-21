"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { ThermomixStep } from "@/types/recipe";

interface ThermomixStepPanelProps {
  step: ThermomixStep;
  stepId: string;
  direction: number;
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-parchment-100 rounded-2xl px-4 py-3 min-w-[72px]">
      <span className="font-serif text-xl font-medium text-ink-900">{value}</span>
      <span className="text-label text-ink-400 uppercase tracking-widest text-[10px]">{label}</span>
    </div>
  );
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function ThermomixStepPanel({ step, stepId, direction }: ThermomixStepPanelProps) {
  const tempDisplay = step.tempC === "Varoma" ? "Varoma" : `${step.tempC}°C`;
  const mins = Math.floor(step.timeSeconds / 60);
  const secs = step.timeSeconds % 60;
  const timeDisplay = secs > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${mins} min`;

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

        {/* Speed / Temp / Time badges */}
        <div className="flex items-center gap-2">
          <StatBadge label="Speed" value={`${step.speed}`} />
          <StatBadge label="Temp" value={tempDisplay} />
          <StatBadge label="Time" value={timeDisplay} />
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
