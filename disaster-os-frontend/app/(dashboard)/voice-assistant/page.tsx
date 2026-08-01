"use client";

import { VoiceAssistant } from "@/components/features/voice/voice-assistant";

export default function VoiceAssistantPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Voice Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">Hands-free emergency guidance powered by AI</p>
        </div>
      </div>
      <VoiceAssistant />
    </div>
  );
}
