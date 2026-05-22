import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface RecipeRatingProps {
  rating: number;
  size?: number;
  className?: string;
  valueClassName?: string;
}

export function RecipeRating({ rating, size = 12, className, valueClassName }: RecipeRatingProps) {
  if (!rating) return null;
  return (
    <div className={cn("flex items-center gap-1 text-saffron-500", className)}>
      <Star size={size} fill="currentColor" />
      <span className={cn("text-xs text-ink-500", valueClassName)}>{rating}</span>
    </div>
  );
}
