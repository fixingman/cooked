import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipes";
import { CookingShell } from "@/components/cooking/CookingShell";

interface PageProps {
  params: { slug: string };
}

export default function CookingPage({ params }: PageProps) {
  const recipe = getRecipe(params.slug);
  if (!recipe) notFound();

  return <CookingShell recipe={recipe} />;
}
