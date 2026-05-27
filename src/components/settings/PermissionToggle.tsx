"use client";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PermissionToggleProps {
  icon: LucideIcon;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  comingSoon?: boolean;
}

export function PermissionToggle({ icon: Icon, label, description, enabled, onToggle, comingSoon }: PermissionToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-parchment-300 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-parchment-200 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={18} className={comingSoon ? "text-ink-300" : "text-ink-500"} />
        </div>
        <div>
          <p className={`text-sm font-medium ${comingSoon ? "text-ink-400" : "text-ink-900"}`}>{label}</p>
          <p className="text-xs text-ink-400 mt-0.5">{description}</p>
        </div>
      </div>
      {comingSoon ? (
        <span className="text-[11px] font-medium text-ink-400 bg-parchment-300 px-2 py-1 rounded-lg">
          Coming soon
        </span>
      ) : (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? "bg-sage-500" : "bg-parchment-300"}`}
        >
          <motion.div
            animate={{ x: enabled ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-card"
          />
        </motion.button>
      )}
    </div>
  );
}
