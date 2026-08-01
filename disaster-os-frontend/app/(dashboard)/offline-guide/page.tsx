"use client";

import { OfflineGuide } from "@/components/features/guide/offline-guide";

export default function OfflineGuidePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Offline Guide</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete survival guides available even without internet</p>
        </div>
      </div>
      <OfflineGuide />
    </div>
  );
}
