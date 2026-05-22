import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "difficulty" | "cuisine" | "dietary";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  overlay?: boolean;
  className?: string;
}

const difficultyColors: Record<string, string> = {
  easy:   "bg-sage-100 text-sage-700",
  medium: "bg-saffron-300/40 text-saffron-700",
  hard:   "bg-red-100 text-red-700",
};

const overlayDifficultyColors: Record<string, string> = {
  easy:   "bg-sage-500/80 text-white",
  medium: "bg-saffron-500/80 text-white",
  hard:   "bg-red-500/80 text-white",
};

export function Badge({ label, variant = "default", overlay = false, className }: BadgeProps) {
  const isDifficulty = variant === "difficulty";
  const colorMap = overlay ? overlayDifficultyColors : difficultyColors;
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-label uppercase tracking-widest backdrop-blur-sm",
      isDifficulty && colorMap[label] ? colorMap[label] : overlay ? "bg-white/20 text-white" : "bg-parchment-300 text-ink-500",
      className
    )}>
      {label}
    </span>
  );
}
