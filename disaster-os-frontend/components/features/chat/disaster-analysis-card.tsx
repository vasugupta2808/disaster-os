"use client";

import { motion } from "framer-motion";

import {
  AlertOctagon,
  ChevronDown,
  ListOrdered,
  MapPin,
  Phone,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import type { DisasterType, UrgencyLevel } from "@/types/disaster-analysis";


const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Informational",
};

const URGENCY_BADGE_CLASS: Record<UrgencyLevel, string> = {
  critical: "bg-severity-critical text-white border-transparent",
  high: "bg-severity-high/10 text-severity-high border-severity-high/20",
  medium: "bg-severity-medium/10 text-severity-medium border-severity-medium/20",
  low: "bg-severity-low/10 text-severity-low border-severity-low/20",
  info: "bg-severity-info/10 text-severity-info border-severity-info/20",
};

const DISASTER_TYPE_LABEL: Record<DisasterType, string> = {
  earthquake: "Earthquake",
  flood: "Flood",
  fire: "Fire",
  hurricane_cyclone: "Hurricane / Cyclone",
  tornado: "Tornado",
  landslide: "Landslide",
  tsunami: "Tsunami",
  heatwave: "Heatwave",
  cold_wave: "Cold Wave",
  drought: "Drought",
  industrial_hazmat: "Industrial / Hazmat",
  medical_emergency: "Medical Emergency",
  civil_unrest: "Civil Unrest",
  other: "Other",
  unknown: "Unclassified",
};

/**
 * Structured disaster analysis card.
 *
 * Why this is a visually distinct "card" rather than blended into the
 * chat bubble styling: this is structured data meant to be scanned, not
 * prose meant to be read top-to-bottom like the conversational reply
 * next to it. A clearly bounded card with its own internal hierarchy
 * (badge -> instructions -> numbers -> shelters) signals "this is a
 * different kind of content" at a glance.
 */
export function DisasterAnalysisCard({ analysis }: { analysis: ChatMessage["analysis"] }) {
  if (!analysis) return null;

  if (analysis.status === "loading") {
    return (
      <CardShell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </CardShell>
    );
  }

  if (analysis.status === "error") {
    return (
      <CardShell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="h-4 w-4" />
          {analysis.error ?? "Could not generate a structured analysis for this message."}
        </div>
      </CardShell>
    );
  }

  const result = analysis.result;
  if (!result) return null;

  const isCritical = result.urgency === "critical";

  return (
    <CardShell critical={isCritical}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={URGENCY_BADGE_CLASS[result.urgency]}>
          {isCritical ? <AlertOctagon className="mr-1 h-3 w-3" /> : null}
          {URGENCY_LABEL[result.urgency]}
        </Badge>
        <Badge variant="outline" className="border-border bg-secondary text-foreground">
          {DISASTER_TYPE_LABEL[result.disasterType]}
        </Badge>
      </div>

      <p className="mt-3 text-sm text-foreground">{result.summary}</p>

      {result.instructions.length > 0 ? (
        <Section icon={ListOrdered} title="What to do">
          <ol className="space-y-1.5">
            {result.instructions.map((step, index) => (
              <li key={index} className="flex gap-2 text-sm text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {result.emergencyNumbers.length > 0 ? (
        <Section icon={Phone} title="Emergency numbers">
          <div className="flex flex-wrap gap-2">
            {result.emergencyNumbers.map((entry) => (
              <a
                key={entry.label}
                href={`tel:${entry.number}`}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
              >
                <span className="text-muted-foreground">{entry.label}:</span>
                {entry.number}
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      {result.shelters.length > 0 ? (
        <Section icon={MapPin} title="Nearby shelters">
          <div className="space-y-1.5">
            {result.shelters.map((shelter) => (
              <div key={shelter.placeId ?? shelter.name} className="text-sm">
                <span className="font-medium text-foreground">{shelter.name}</span>
                <span className="text-muted-foreground"> — {shelter.address}</span>
                {shelter.distanceKm !== null ? (
                  <span className="text-muted-foreground"> ({shelter.distanceKm} km)</span>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Enable location access to see real nearby shelters for this situation.
        </p>
      )}

      {result.reasoningNote ? <ReasoningDisclosure note={result.reasoningNote} /> : null}
    </CardShell>
  );
}

function CardShell({
  children,
  critical = false,
}: {
  children: React.ReactNode;
  critical?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        critical ? "border-severity-critical/30 bg-severity-critical/5" : "border-border bg-card",
      )}
    >
      {children}
    </motion.div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ListOrdered;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ReasoningDisclosure({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-border/60 pt-2">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        Why this assessment?
      </button>
      {open ? <p className="mt-1.5 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
