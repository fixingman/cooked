"use client";
import { pad } from "@/lib/formatTime";

interface TimerBlockProps {
  remaining: number; // seconds
  label?: string;
}

function DigitCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-card-md px-4 py-3 min-w-[80px] text-center">
        <span className="font-serif text-timer-lg text-ink-900 tabular-nums">{value}</span>
      </div>
      <span className="text-label uppercase tracking-widest text-ink-400 mt-1.5">{label}</span>
    </div>
  );
}

export function TimerBlock({ remaining, label }: TimerBlockProps) {
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <p className="text-label uppercase tracking-widest text-ink-400">{label}</p>
      )}
      <div className="flex items-end gap-3">
        {hours > 0 && (
          <>
            <DigitCard value={pad(hours)} label="h" />
            <span className="font-serif text-timer-md text-ink-300 mb-4">:</span>
          </>
        )}
        <DigitCard value={pad(minutes)} label="min" />
        <span className="font-serif text-timer-md text-ink-300 mb-4">:</span>
        <DigitCard value={pad(seconds)} label="sec" />
      </div>
    </div>
  );
}
