"use client";
import { Mic, Camera, Flame } from "lucide-react";
import { UnitToggle } from "@/components/settings/UnitToggle";
import { DietaryPreferences } from "@/components/settings/DietaryPreferences";
import { PermissionToggle } from "@/components/settings/PermissionToggle";
import { AIIntegrationToggle } from "@/components/settings/AIIntegrationToggle";
import { ThermomixToggle } from "@/components/settings/ThermomixToggle";
import { ThermomixEnrichSection } from "@/components/settings/ThermomixEnrichSection";
import { DropboxConnect } from "@/components/settings/DropboxConnect";
import { ImageRefreshSection } from "@/components/settings/ImageRefreshSection";
import { useSettings } from "@/hooks/useSettings";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-label uppercase tracking-widest text-ink-400 mb-4">{title}</h2>
      <div className="bg-parchment-200 border border-parchment-300 rounded-card px-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update, toggleDietary } = useSettings();

  return (
    <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-saffron-500 rounded-xl flex items-center justify-center">
          <Flame size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink-900">Cooked</h1>
          <p className="text-xs text-ink-400">v0.15.3 — Your cooking companion</p>
        </div>
      </div>

      <Section title="Measurement Units">
        <div className="py-4">
          <UnitToggle value={settings.units} onChange={(v) => update({ units: v })} />
        </div>
      </Section>

      <Section title="Dietary Preferences">
        <div className="py-4">
          <DietaryPreferences selected={settings.dietaryPreferences} onToggle={toggleDietary} />
        </div>
      </Section>

      <Section title="Cooking Modes">
        <ThermomixToggle
          enabled={settings.thermomixEnabled}
          onToggle={() => update({ thermomixEnabled: !settings.thermomixEnabled })}
        />
        <div className="border-t border-parchment-300">
          <AIIntegrationToggle
            enabled={settings.aiEnabled}
            onToggle={() => update({ aiEnabled: !settings.aiEnabled })}
          />
        </div>
      </Section>

      <Section title="Permissions">
        <PermissionToggle
          icon={Mic}
          label="Microphone"
          description="Allow voice notes during cooking"
          enabled={settings.microphoneEnabled}
          onToggle={() => update({ microphoneEnabled: !settings.microphoneEnabled })}
        />
        <PermissionToggle
          icon={Camera}
          label="Camera"
          description="Capture photos of your dishes"
          enabled={settings.cameraEnabled}
          onToggle={() => update({ cameraEnabled: !settings.cameraEnabled })}
        />
      </Section>

      <Section title="Cloud Sync">
        <DropboxConnect />
      </Section>

      <Section title="Recipe Images">
        <ImageRefreshSection />
      </Section>

      <Section title="Thermomix">
        <ThermomixEnrichSection />
      </Section>

      <p className="text-center text-xs text-ink-300">Made with care.</p>
    </div>
  );
}
