"use client";
import { useState } from "react";
import { Mic, Camera, Flame, Archive } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { UnitToggle } from "@/components/settings/UnitToggle";
import { DietaryPreferences } from "@/components/settings/DietaryPreferences";
import { PermissionToggle } from "@/components/settings/PermissionToggle";
import { AIIntegrationToggle } from "@/components/settings/AIIntegrationToggle";
import { ThermomixToggle } from "@/components/settings/ThermomixToggle";
import { ThermomixEnrichSection } from "@/components/settings/ThermomixEnrichSection";
import { DropboxConnect } from "@/components/settings/DropboxConnect";
import { ImageRefreshSection } from "@/components/settings/ImageRefreshSection";
import { PantryModal } from "@/components/pantry/PantryModal";
import { useSettings } from "@/hooks/useSettings";
import { usePantry } from "@/hooks/usePantry";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-label uppercase tracking-widest text-ink-400 mb-4">{title}</h2>
      <div className="bg-parchment-200 border border-parchment-300 rounded-card px-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update, toggleDietary } = useSettings();
  const { items: pantryItems } = usePantry();
  const [pantryOpen, setPantryOpen] = useState(false);

  return (
    <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-saffron-500 rounded-xl flex items-center justify-center">
          <Flame size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-900">Cooked</h1>

          <p className="text-xs text-ink-400">v0.25.3 — Your cooking companion</p>
        </div>
      </div>

      {/* Preferences — how you like to cook */}
      <Section title="Preferences">
        <div className="py-4">
          <UnitToggle value={settings.units} onChange={(v) => update({ units: v })} />
        </div>
        <div className="border-t border-parchment-300 py-4">
          <DietaryPreferences selected={settings.dietaryPreferences} onToggle={toggleDietary} />
        </div>
      </Section>

      {/* AI — suggestions & generation */}
      <Section title="AI">
        <AIIntegrationToggle
          enabled={settings.aiEnabled}
          onToggle={() => update({ aiEnabled: !settings.aiEnabled })}
        />
      </Section>

      {/* Thermomix — toggle + retroactive enrichment */}
      <Section title="Thermomix">
        <ThermomixToggle
          enabled={settings.thermomixEnabled}
          onToggle={() => update({ thermomixEnabled: !settings.thermomixEnabled })}
        />
        <div className="border-t border-parchment-300">
          <ThermomixEnrichSection />
        </div>
      </Section>

      {/* Pantry */}
      <Section title="Pantry">
        <div className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Archive size={18} className="text-ink-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-ink-800">My Pantry</p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {pantryItems.length === 0
                    ? "No items yet"
                    : `${pantryItems.length} item${pantryItems.length !== 1 ? "s" : ""}${pantryItems.filter(i => i.low).length > 0 ? ` · ${pantryItems.filter(i => i.low).length} running low` : ""}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPantryOpen(true)}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-ink-900 text-parchment-100 transition-opacity"
            >
              Manage
            </button>
          </div>
        </div>
      </Section>

      {/* Device — mic & camera permissions */}
      <Section title="Device">
        <PermissionToggle
          icon={Mic}
          label="Microphone"
          description="Allow voice notes during cooking"
          enabled={settings.microphoneEnabled}
          onToggle={() => update({ microphoneEnabled: !settings.microphoneEnabled })}
          comingSoon
        />
        <div className="border-t border-parchment-300">
          <PermissionToggle
            icon={Camera}
            label="Camera"
            description="Capture photos of your dishes"
            enabled={settings.cameraEnabled}
            onToggle={() => update({ cameraEnabled: !settings.cameraEnabled })}
            comingSoon
          />
        </div>
      </Section>

      {/* Sync — cloud storage & images */}
      <Section title="Sync">
        <DropboxConnect />
        <div className="border-t border-parchment-300">
          <ImageRefreshSection />
        </div>
      </Section>

      <p className="text-center text-xs text-ink-300">Made with care.</p>

      <AnimatePresence>
        {pantryOpen && <PantryModal onClose={() => setPantryOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
