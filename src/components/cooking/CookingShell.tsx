"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Recipe } from "@/types/recipe";
import { useCookingTimer } from "@/hooks/useCookingTimer";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { TimerBlock } from "./TimerBlock";
import { StepDisplay } from "./StepDisplay";
import { StepIngredients } from "./StepIngredients";
import { StepNavControls } from "./StepNavControls";
import { CompletionScreen } from "./CompletionScreen";

interface CookingShellProps {
  recipe: Recipe;
  thermomixMode?: boolean;
}

export function CookingShell({ recipe, thermomixMode = false }: CookingShellProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [completed, setCompleted] = useState(false);

  const step = recipe.steps[stepIndex];
  const hasTmStep = thermomixMode && !!step.thermomix;
  const timer = useCookingTimer(step.durationSeconds ?? 0);

  const goNext = useCallback(() => {
    if (stepIndex < recipe.steps.length - 1) {
      setDirection(1);
      setStepIndex((i) => i + 1);
      timer.reset(recipe.steps[stepIndex + 1].durationSeconds ?? 0);
    } else {
      setCompleted(true);
    }
  }, [stepIndex, recipe.steps, timer]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
      timer.reset(recipe.steps[stepIndex - 1].durationSeconds ?? 0);
    }
  }, [stepIndex, recipe.steps, timer]);

  const swipe = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrev });

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    (navigator as Navigator & { wakeLock: { request(type: "screen"): Promise<WakeLockSentinel> } })
      .wakeLock.request("screen").then(l => { lock = l; }).catch(() => {});
    return () => { lock?.release(); };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === " ") {
        e.preventDefault();
        if (step.durationSeconds && step.durationSeconds > 0) timer.toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, timer, step]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 bg-parchment-100 z-50 flex flex-col overflow-hidden"
      {...swipe}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe-top py-4 border-b border-parchment-300">
        <button onClick={() => router.back()}>
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition-colors"
          >
            <X size={20} />
          </motion.div>
        </button>
        <div className="text-center">
          <p className="font-serif text-sm font-medium text-ink-900 line-clamp-1 max-w-[180px]">
            {recipe.title}
            {thermomixMode && <span className="ml-1.5 text-sage-500 font-sans text-xs">· TM</span>}
          </p>
        </div>
        <div className="w-8" />
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-parchment-300">
        <motion.div
          className="h-full bg-sage-500"
          animate={{ width: `${((stepIndex + 1) / recipe.steps.length) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Main content — splits into 2 columns on iPad landscape */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel: ingredients + optional timer */}
        <div className="md:w-1/2 flex flex-col items-center justify-center p-6 gap-6 border-b md:border-b-0 md:border-r border-parchment-300">
          <StepIngredients
            allIngredients={recipe.ingredients}
            stepIngredientIds={step.ingredients}
            stepInstruction={step.instruction}
            stepId={step.id}
            direction={direction}
          />
          {!hasTmStep && step.durationSeconds && step.durationSeconds > 0 && (
            <TimerBlock remaining={timer.remaining} label={step.timerLabel} />
          )}
        </div>

        {/* Right panel: step instruction */}
        <div className="flex-1 flex flex-col p-6 md:p-8">
          <div className="flex-1 overflow-hidden">
            <StepDisplay
              step={step}
              direction={direction}
              overrideInstruction={thermomixMode && step.thermomix ? step.thermomix.instruction : undefined}
            />
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-parchment-300 bg-parchment-100/95 backdrop-blur-sm py-4">
        <StepNavControls
          currentStep={stepIndex + 1}
          totalSteps={recipe.steps.length}
          isRunning={timer.isRunning}
          hasTimer={!hasTmStep && !!step.durationSeconds && step.durationSeconds > 0}
          onPrev={goPrev}
          onNext={goNext}
          onToggleTimer={timer.toggle}
        />
        <div className="pb-safe-bottom" />
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {completed && <CompletionScreen recipe={recipe} />}
      </AnimatePresence>
    </motion.div>
  );
}
