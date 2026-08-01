"use client";

import { ImageAnalysis } from "@/components/features/analysis/image-analysis";

export default function ImageAnalysisPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Disaster Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered threat assessment for any emergency situation</p>
        </div>
      </div>
      <ImageAnalysis />
    </div>
  );
}
