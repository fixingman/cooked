"use client";
import { ChevronLeft, ChevronRight, Pause, Play, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface StepNavControlsProps {
  currentStep: number;
  totalSteps: number;
  isRunning: boolean;
  hasTimer: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleTimer: () => void;
}

export function StepNavControls({
  currentStep,
  totalSteps,
  isRunning,
  hasTimer,
  onPrev,
  onNext,
  onToggleTimer,
}: StepNavControlsProps) {
  const progress = (currentStep - 1) / Math.max(1, totalSteps - 1);

  return (
    <div className="flex items-center justify-between gap-4 px-4">
      {/* Prev */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onPrev}
        disabled={currentStep === 1}
        className="w-12 h-12 rounded-full bg-parchment-200 border border-parchment-300 flex items-center justify-center text-ink-700 disabled:opacity-30 transition-opacity"
      >
        <ChevronLeft size={22} />
      </motion.button>

      {/* Centre: progress ring + play/pause */}
      <div className="flex-1 flex justify-center">
        <ProgressRing progress={progress} size={72} strokeWidth={3.5} color="#6B8C5F" trackColor="#EDE5D8">
          {hasTimer ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onToggleTimer}
              className="w-10 h-10 rounded-full bg-sage-500 flex items-center justify-center text-white"
            >
              {isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </motion.button>
          ) : (
            <div className="font-serif text-sm font-medium text-ink-700">
              {currentStep}/{totalSteps}
            </div>
          )}
        </ProgressRing>
      </div>

      {/* Next / Finish on last step */}
      {currentStep < totalSteps ? (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onNext}
          className="w-12 h-12 rounded-full bg-sage-500 flex items-center justify-center text-white shadow-card-md"
        >
          <ChevronRight size={22} />
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onNext}
          className="w-12 h-12 rounded-full bg-sage-500 flex items-center justify-center text-white shadow-card-md"
        >
          <ChefHat size={20} />
        </motion.button>
      )}
    </div>
  );
}
