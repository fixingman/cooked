import type { CookingStep } from "@/types/recipe";
import { Clock, Thermometer } from "lucide-react";
import { formatMinutes } from "@/lib/formatTime";

interface InstructionStepsProps {
  steps: CookingStep[];
}

export function InstructionSteps({ steps }: InstructionStepsProps) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-4 group">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-saffron-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {step.order}
            </div>
            {step.order < steps.length && (
              <div className="w-px flex-1 border-l border-dashed border-parchment-400 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4 px-3 py-2 -mx-3 rounded-xl hover:bg-parchment-200/60 transition-colors duration-200">
            <p className="text-ink-700 text-sm leading-relaxed">{step.instruction}</p>
            {(step.durationSeconds || step.temperature) && (
              <div className="flex items-center gap-3 mt-2.5">
                {step.durationSeconds && (
                  <span className="flex items-center gap-1.5 text-xs text-sage-600 bg-sage-100 px-2.5 py-1 rounded-full">
                    <Clock size={11} />
                    {formatMinutes(Math.round(step.durationSeconds / 60))}
                    {step.timerLabel && ` · ${step.timerLabel}`}
                  </span>
                )}
                {step.temperature && (
                  <span className="flex items-center gap-1.5 text-xs text-saffron-600 bg-saffron-300/30 px-2.5 py-1 rounded-full">
                    <Thermometer size={11} />
                    {step.temperature}°C
                  </span>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
