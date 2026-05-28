import { redirect } from "next/navigation";

interface Props {
  searchParams: { url?: string; title?: string; text?: string };
}

// Web Share Target handler — registered in manifest.json share_target.action
// Browser navigates here when user shares a page to Cooked via native share sheet.
// Redirects to home with share_url param; ShareHandler on the home page opens the import modal.
export default function SharePage({ searchParams }: Props) {
  const url = searchParams.url ?? searchParams.text ?? "";
  if (url.startsWith("http")) {
    redirect(`/?share_url=${encodeURIComponent(url)}`);
  }
  redirect("/");
}
