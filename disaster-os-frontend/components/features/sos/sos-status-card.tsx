"use client";

import { motion } from "framer-motion";

import { CheckCircle, Clock, MapPin, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Tilt from "react-parallax-tilt";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SosRequest, SosStatus } from "@/types/sos";


const STATUS_CONFIG: Record<
  SosStatus,
  { label: string; description: string; icon: typeof Clock; className: string }
> = {
  pending: {
    label: "Pending",
    description: "Your SOS has been received. Awaiting response.",
    icon: Clock,
    className: "border-severity-medium/30 bg-severity-medium/5 text-severity-medium",
  },
  active: {
    label: "Active",
    description: "Your SOS has been broadcast to the network.",
    icon: Clock,
    className: "border-severity-high/30 bg-severity-high/5 text-severity-high",
  },
  acknowledged: {
    label: "Acknowledged",
    description: "Your SOS has been seen by responders.",
    icon: Clock,
    className: "border-severity-info/30 bg-severity-info/5 text-severity-info",
  },
  responding: {
    label: "Help is coming",
    description: "A responder is on the way.",
    icon: CheckCircle,
    className: "border-severity-critical/30 bg-severity-critical/5 text-severity-critical",
  },
  resolved: {
    label: "Resolved",
    description: "Your SOS has been marked as resolved.",
    icon: CheckCircle,
    className: "border-severity-low/30 bg-severity-low/5 text-severity-low",
  },
  cancelled: {
    label: "Cancelled",
    description: "Your SOS was cancelled.",
    icon: XCircle,
    className: "border-border bg-secondary text-muted-foreground",
  },
};

export function SosStatusCard({
  sos,
  onCancel,
  cancelling,
}: {
  sos: SosRequest;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const config = STATUS_CONFIG[sos.status];
  const StatusIcon = config.icon;
  const isActive = sos.status === "pending" || sos.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4"
    >
      {/* Status banner */}
      <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.02} transitionSpeed={2500}>
        <div className={cn("flex items-start gap-3 rounded-xl border p-4", config.className)}>
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            {sos.status === "pending" && (
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-current opacity-40" />
            )}
            <StatusIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">{config.label}</p>
            <p className="mt-0.5 text-sm opacity-90">{config.description}</p>
          </div>
        </div>
      </Tilt>

      {/* SOS details */}
      <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.01} transitionSpeed={2500}>
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Severity</span>
              <span className="font-medium capitalize text-foreground">{sos.severity}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Sent</span>
              <span className="text-right text-foreground">
                {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Location</span>
              <span className="flex items-center gap-1 text-right text-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {sos.locationLabel}
              </span>
            </div>
            {sos.situation ? (
              <div>
                <p className="text-muted-foreground">Situation</p>
                <p className="mt-1 text-foreground">{sos.situation}</p>
              </div>
            ) : null}
            {sos.resolutionNote ? (
              <div>
                <p className="text-muted-foreground">Responder note</p>
                <p className="mt-1 text-foreground">{sos.resolutionNote}</p>
              </div>
            ) : null}
          </div>
        </div>
      </Tilt>

      {/* Cancel button — only shown while SOS is still active */}
      {isActive ? (
        <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.04} transitionSpeed={2000}>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={cancelling}
            className="w-full border-severity-critical/30 text-severity-critical hover:bg-severity-critical/5"
          >
            {cancelling ? "Cancelling..." : "Cancel SOS"}
          </Button>
        </Tilt>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        SOS ID: <span className="font-mono">{sos.id.slice(0, 8)}</span>
      </p>
    </motion.div>
  );
}
