"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

const navItems = [
  { href: "/",         icon: Home,         label: "Home" },
  { href: "/recipes",  icon: BookOpen,     label: "Recipes" },
  { href: "/shopping", icon: ShoppingCart, label: "Shopping" },
  { href: "/settings", icon: Settings,     label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-parchment-100/95 backdrop-blur-md border-t border-parchment-300 pb-safe-bottom md:hidden">
      <div className="flex items-center justify-around h-nav-h px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-4 py-2 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-saffron-500/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon
                size={22}
                className={cn(
                  "transition-colors duration-200",
                  isActive ? "text-saffron-500" : "text-ink-500"
                )}
                strokeWidth={isActive ? 2.2 : 1.7}
              />
              <span className={cn(
                "text-label tracking-widest uppercase transition-colors duration-200 text-[0.65rem]",
                isActive ? "text-saffron-500" : "text-ink-500"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
