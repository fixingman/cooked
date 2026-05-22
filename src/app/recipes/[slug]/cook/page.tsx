import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipes";
import { CookingShell } from "@/components/cooking/CookingShell";

interface PageProps {
  params: { slug: string };
  searchParams: { tm?: string };
}

export default function CookingPage({ params, searchParams }: PageProps) {
  const recipe = getRecipe(params.slug);
  if (!recipe) notFound();

  const thermomixMode = searchParams.tm === "1" && !!recipe.thermomixAvailable;

  return <CookingShell recipe={recipe} thermomixMode={thermomixMode} />;
}
