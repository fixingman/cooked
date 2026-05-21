"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface FoodImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  sizes?: string;
}

export function FoodImage({
  src,
  alt,
  fill,
  width,
  height,
  priority,
  className,
  containerClassName,
  sizes,
}: FoodImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fallbackSrc = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80";

  return (
    <div className={cn("overflow-hidden", containerClassName)}>
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
      {!loaded && (
        <div className="absolute inset-0 skeleton" />
      )}
    </div>
  );
}
