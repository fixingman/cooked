"use client";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCookingMode = pathname.endsWith("/cook");

  if (isCookingMode) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen min-h-dvh">
      <SideNav />
      <main className="flex-1 min-w-0 pb-nav-h md:pb-safe-bottom pt-safe-top">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
