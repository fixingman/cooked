import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "difficulty" | "cuisine" | "dietary";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const difficultyColors: Record<string, string> = {
  easy:   "bg-sage-100 text-sage-700",
  medium: "bg-saffron-300/40 text-saffron-700",
  hard:   "bg-red-100 text-red-700",
};

export function Badge({ label, variant = "default", className }: BadgeProps) {
  const isDifficulty = variant === "difficulty";
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-label uppercase tracking-widest",
      isDifficulty && difficultyColors[label] ? difficultyColors[label] : "bg-parchment-300 text-ink-500",
      className
    )}>
      {label}
    </span>
  );
}
