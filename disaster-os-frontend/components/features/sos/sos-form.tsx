"use client";

import { motion } from "framer-motion";

import { MapPin, Siren } from "lucide-react";
import { useState } from "react";

import { SosSeveritySelector } from "@/components/features/sos/sos-severity-selector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SosSeverity } from "@/types/sos";


export function SosForm({
  onSend,
  sending,
  error,
  locationLoading,
  locationDenied,
  userLatitude,
  userLongitude,
}: {
  onSend: (params: { situation: string; severity: SosSeverity }) => void;
  sending: boolean;
  error: string | null;
  locationLoading: boolean;
  locationDenied: boolean;
  userLatitude: number | null;
  userLongitude: number | null;
}) {
  const [severity, setSeverity] = useState<SosSeverity>("critical");
  const [situation, setSituation] = useState("");

  const hasLocation = userLatitude !== null && userLongitude !== null;

  function handleSend() {
    if (!hasLocation || sending) return;
    onSend({ situation: situation.trim() || "Emergency — no additional details provided.", severity });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Severity */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">How urgent is your situation?</p>
        <SosSeveritySelector value={severity} onChange={setSeverity} />
      </div>

      {/* Situation */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Describe your situation{" "}
          <span className="font-normal text-muted-foreground">(optional but helpful)</span>
        </p>
        <Textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="e.g. Building collapse, trapped on third floor. Two people injured."
          rows={3}
          maxLength={2000}
          className="resize-none"
          disabled={sending}
        />
      </div>

      {/* Location status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        {locationLoading ? (
          "Getting your location..."
        ) : locationDenied ? (
          <span className="text-severity-critical">
            Location access denied — enable it in browser settings for accurate dispatch.
          </span>
        ) : hasLocation ? (
          `Location ready: ${userLatitude!.toFixed(4)}, ${userLongitude!.toFixed(4)}`
        ) : (
          "Could not determine location."
        )}
      </div>

      {/* Error */}
      {error ? (
        <p className="text-sm text-severity-critical">{error}</p>
      ) : null}

      {/* Send button - deliberately large and high-contrast */}
      <Button
        onClick={handleSend}
        disabled={sending || locationLoading || locationDenied || !hasLocation}
        className="h-14 w-full gap-2 bg-severity-critical text-base font-semibold text-white hover:bg-severity-critical/90 disabled:opacity-50"
        size="lg"
      >
        <Siren className={`h-5 w-5 ${sending ? "animate-pulse" : ""}`} />
        {sending ? "Sending SOS..." : "Send SOS Now"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        In a life-threatening emergency, also call your local emergency number (112 / 911 / 100).
      </p>
    </motion.div>
  );
}
