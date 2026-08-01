"use client";

import { EmergencyKit } from "@/components/features/kit/emergency-kit";

export default function EmergencyKitPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency Kit</h1>
          <p className="text-sm text-muted-foreground mt-1">Build and track your family's emergency preparedness kit</p>
        </div>
      </div>
      <EmergencyKit />
    </div>
  );
}
