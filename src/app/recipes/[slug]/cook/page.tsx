"use client";
import { useEffect, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { getRecipe } from "@/lib/recipes";
import { CookingShell } from "@/components/cooking/CookingShell";
import type { Recipe } from "@/types/recipe";

interface PageProps {
  params: { slug: string };
}

export default function CookingPage({ params }: PageProps) {
  const { slug } = params;
  const searchParams = useSearchParams();
  const builtIn = getRecipe(slug);
  const isUserSlug = slug.startsWith("user-");

  const [userRecipe, setUserRecipe] = useState<Recipe | null | undefined>(
    isUserSlug ? undefined : null
  );

  useEffect(() => {
    if (!isUserSlug) return;
    try {
      const stored = localStorage.getItem("cooked-user-recipes");
      const found = stored
        ? (JSON.parse(stored) as Recipe[]).find(r => r.slug === slug) ?? null
        : null;
      setUserRecipe(found);
    } catch {
      setUserRecipe(null);
    }
  }, [isUserSlug, slug]);

  if (isUserSlug && userRecipe === undefined) {
    return <div className="h-screen bg-parchment-100" />;
  }

  const recipe = builtIn ?? userRecipe;
  if (!recipe) notFound();

  const thermomixMode = searchParams.get("tm") === "1" && !!recipe.thermomixAvailable;

  return <CookingShell recipe={recipe} thermomixMode={thermomixMode} />;
}
