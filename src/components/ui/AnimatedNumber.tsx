"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({ value, className, format }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 80, damping: 18 });
  const displayed = useTransform(spring, (v) =>
    format ? format(Math.round(v)) : String(Math.round(v)).padStart(2, "0")
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{displayed}</motion.span>;
}
