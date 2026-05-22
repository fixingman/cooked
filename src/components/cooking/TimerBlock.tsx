"use client";
import { pad } from "@/lib/formatTime";

interface TimerBlockProps {
  remaining: number;
  label?: string;
}

function FlipCard({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[72px] h-[84px]">
        {/* Card body */}
        <div className="absolute inset-0 bg-ink-900 rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.28)] overflow-hidden">
          {/* Lower half slightly darker for depth */}
          <div className="absolute inset-x-0 top-1/2 bottom-0 bg-black/20" />
        </div>
        {/* Digit */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-timer-md text-parchment-100 tabular-nums tracking-tight select-none">
            {value}
          </span>
        </div>
        {/* Hairline crease */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
      </div>
      <span className="text-label uppercase tracking-widest text-ink-400">{unit}</span>
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
            <FlipCard value={pad(hours)} unit="hr" />
            <span className="text-[2rem] text-ink-700/30 font-light mb-7 select-none">:</span>
          </>
        )}
        <FlipCard value={pad(minutes)} unit="min" />
        <span className="text-[2rem] text-ink-700/30 font-light mb-7 select-none">:</span>
        <FlipCard value={pad(seconds)} unit="sec" />
      </div>
    </div>
  );
}
