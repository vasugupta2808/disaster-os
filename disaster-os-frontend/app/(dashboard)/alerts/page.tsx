"use client";

import { LiveAlerts } from "@/components/features/alerts/live-alerts";

export default function AlertsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time disaster alerts from global monitoring networks</p>
        </div>
      </div>
      <LiveAlerts />
    </div>
  );
}
