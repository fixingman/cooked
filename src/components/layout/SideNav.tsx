"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Settings, Flame } from "lucide-react";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

const navItems = [
  { href: "/",         icon: Home,     label: "Home" },
  { href: "/recipes",  icon: BookOpen, label: "Recipes" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[72px] xl:w-56 shrink-0 h-screen sticky top-0 bg-parchment-100 border-r border-parchment-300 z-30">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-4 h-16 border-b border-parchment-300 hover:bg-parchment-200 transition-colors">
        <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center shrink-0">
          <Flame size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-serif font-semibold text-ink-900 text-lg hidden xl:block tracking-tight">
          Cooked
        </span>
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-2 pt-4 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200",
                isActive ? "text-ink-900" : "text-ink-500 hover:text-ink-700 hover:bg-parchment-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidenav-indicator"
                  className="absolute inset-0 bg-saffron-500/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} className="relative z-10 shrink-0" />
              <span className={cn(
                "relative z-10 text-sm font-medium hidden xl:block",
                isActive ? "text-ink-900" : "text-ink-500"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Version */}
      <div className="p-4 hidden xl:block">
        <p className="text-label text-ink-300 tracking-widest uppercase">v0.20.12</p>
      </div>
    </aside>
  );
}
