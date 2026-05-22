"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   "bg-sage-500 text-white hover:bg-sage-600 shadow-card",
  secondary: "bg-parchment-200 text-ink-700 hover:bg-parchment-300 border border-parchment-300",
  ghost:     "text-ink-500 hover:text-ink-900 hover:bg-parchment-200",
  danger:    "bg-red-500 text-white hover:bg-red-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-xl gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-4 text-base rounded-2xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200 select-none cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...(props as Record<string, unknown>)}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
