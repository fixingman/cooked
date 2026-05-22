"use client";
import { pad } from "@/lib/formatTime";

interface TimerBlockProps {
  remaining: number;
  label?: string;
}

function DigitCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="bg-white rounded-2xl shadow-card-md w-[76px] h-[72px] flex items-center justify-center">
        <span className="text-timer-lg text-ink-900 tabular-nums">{value}</span>
      </div>
      <span className="text-label uppercase tracking-widest text-ink-400">{label}</span>
    </div>
  );
}

export function TimerBlock({ remaining, label }: TimerBlockProps) {
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <p className="text-label uppercase tracking-widest text-ink-400">{label}</p>
      )}
      <div className="flex items-center gap-2">
        {hours > 0 && (
          <>
            <DigitCard value={pad(hours)} label="h" />
            <span className="text-timer-md text-ink-300 pb-6">:</span>
          </>
        )}
        <DigitCard value={pad(minutes)} label="min" />
        <span className="text-timer-md text-ink-300 pb-6">:</span>
        <DigitCard value={pad(seconds)} label="sec" />
      </div>
    </div>
  );
}
