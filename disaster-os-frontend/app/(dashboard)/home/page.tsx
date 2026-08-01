import { FeatureShortcuts } from "@/components/features/home/feature-shortcuts";
import { WeatherCard } from "@/components/features/home/weather-card";
import { AlertsPreviewCard } from "@/components/features/home/alerts-preview-card";
import { SosQuickAccess } from "@/components/features/home/sos-quick-access";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your real-time disaster response command center</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <WeatherCard />
          <FeatureShortcuts />
        </div>
        <div className="space-y-4">
          <SosQuickAccess />
          <AlertsPreviewCard />
        </div>
      </div>
    </div>
  );
}
