"use client";

import { motion } from "framer-motion";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Radio,
  Shield,
  Siren,
} from "lucide-react";
import { useState } from "react";

import { SosConfirmationDialog } from "@/components/features/sos/sos-confirmation-dialog";
import type { Severity } from "@/types/domain";
import type { SosRequest, SosStatus } from "@/types/sos";


/**
 * Active SOS view - shown after sending an SOS.
 *
 * This is the dashboard a user sees while their SOS is active. It shows:
 * 1. Status tracker (active → acknowledged → responding → resolved)
 * 2. AI-generated emergency guidance (instructions + emergency numbers)
 * 3. Location info and cancel option
 *
 * Realtime updates come via the useSos hook's Firestore listener -
 * when status changes in Firestore, this component re-renders with the
 * new status automatically.
 */

interface SosActiveViewProps {
  sos: SosRequest;
  onCancel: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  onClearError: () => void;
}

// ── Status step definitions ─────────────────────────────────────────

interface StatusStep {
  status: SosStatus;
  label: string;
  icon: typeof Siren;
}

const STATUS_STEPS: StatusStep[] = [
  { status: "active", label: "SOS Sent", icon: Siren },
  { status: "acknowledged", label: "Acknowledged", icon: Radio },
  { status: "responding", label: "Help Coming", icon: Shield },
  { status: "resolved", label: "Resolved", icon: CheckCircle2 },
];

function getStepIndex(status: SosStatus): number {
  if (status === "cancelled") return -1;
  const index = STATUS_STEPS.findIndex((s) => s.status === status);
  return index >= 0 ? index : 0;
}

// ── Urgency badge ───────────────────────────────────────────────────

const URGENCY_CONFIG: Record<Severity, { label: string; className: string }> = {
  critical: { label: "CRITICAL", className: "bg-severity-critical text-white" },
  high: { label: "HIGH", className: "bg-severity-high text-white" },
  medium: { label: "MEDIUM", className: "bg-severity-medium text-white" },
  low: { label: "LOW", className: "bg-severity-low text-white" },
  info: { label: "INFO", className: "bg-severity-info text-white" },
};

// ── Emergency type display names ────────────────────────────────────

const EMERGENCY_TYPE_LABELS: Record<string, string> = {
  medical: "Medical Emergency",
  fire: "Fire",
  flood: "Flood",
  earthquake: "Earthquake",
  trapped: "Trapped / Structural Collapse",
  violence: "Violence / Threat",
  accident: "Accident",
  other: "Other Emergency",
};

export function SosActiveView({
  sos,
  onCancel,
  submitting,
  error,
  onClearError,
}: SosActiveViewProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const currentStepIndex = getStepIndex(sos.status);
  const isCancelled = sos.status === "cancelled";
  const isTerminal = sos.status === "resolved" || isCancelled;
  const urgency = URGENCY_CONFIG[sos.guidance.urgency] ?? URGENCY_CONFIG.medium;

  async function handleCancel() {
    setShowCancelConfirm(false);
    await onCancel();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Header with urgency badge */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-severity-critical/10">
          <span className="relative flex h-10 w-10 items-center justify-center">
            {!isTerminal && (
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-severity-critical/40" />
            )}
            <Siren className="h-6 w-6 text-severity-critical" />
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {isCancelled ? "SOS Cancelled" : "SOS Active"}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${urgency.className}`}
          >
            {urgency.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {EMERGENCY_TYPE_LABELS[sos.emergencyType] ?? sos.emergencyType}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-severity-critical/20 bg-severity-critical/5 p-3"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-severity-critical" />
            <p className="flex-1 text-sm text-severity-critical">{error}</p>
            <button
              type="button"
              onClick={onClearError}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Status tracker */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Status</h2>
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;
            const isUpcoming = currentStepIndex < index;
            const StepIcon = step.icon;

            return (
              <div key={step.status} className="flex flex-1 items-center">
                {/* Step circle */}
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isCompleted
                        ? "bg-severity-low text-white"
                        : isCurrent
                          ? "bg-severity-critical text-white shadow-md"
                          : isCancelled
                            ? "bg-muted text-muted-foreground"
                            : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCancelled && isUpcoming ? (
                      <Ban className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </motion.div>
                  <span
                    className={`text-[10px] font-medium ${
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                          ? "text-severity-low"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STATUS_STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded-full transition-colors ${
                      isCompleted
                        ? "bg-severity-low"
                        : isCancelled
                          ? "bg-muted"
                          : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency guidance */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Emergency Guidance</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {sos.guidance.situationSummary}
        </p>

        {/* Instructions */}
        <ol className="space-y-2.5">
          {sos.guidance.instructions.map((instruction, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-severity-critical/10 text-xs font-bold text-severity-critical">
                {index + 1}
              </span>
              <span className="pt-0.5 text-sm text-foreground">{instruction}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Emergency numbers */}
      {sos.guidance.emergencyNumbers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Emergency Contacts</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sos.guidance.emergencyNumbers.map((contact, index) => (
              <MotionA
                key={index}
                href={`tel:${contact.number}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:border-severity-critical/30 hover:bg-severity-critical/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-severity-critical/10">
                  <Phone className="h-4 w-4 text-severity-critical" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{contact.label}</p>
                  <p className="text-sm font-semibold text-severity-critical">{contact.number}</p>
                </div>
              </MotionA>
            ))}
          </div>
        </div>
      )}

      {/* Location & meta info */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {sos.latitude !== null && sos.longitude !== null && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(sos.createdAt).toLocaleTimeString()}
          </span>
          {sos.message && (
            <span className="basis-full text-xs italic text-muted-foreground">
              &ldquo;{sos.message}&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* Cancel button */}
      {!isTerminal && (
        <button
          type="button"
          onClick={() => setShowCancelConfirm(true)}
          disabled={submitting}
          className="mx-auto w-fit rounded-lg border border-border bg-card px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:opacity-50"
        >
          Cancel SOS
        </button>
      )}

      {isCancelled && (
        <p className="text-center text-xs text-muted-foreground">
          This SOS request has been cancelled. You can send a new one if needed.
        </p>
      )}

      {/* Cancel confirmation dialog */}
      <SosConfirmationDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirm={handleCancel}
        title="Cancel SOS Request?"
        description="Are you sure you want to cancel your SOS request? Only do this if you no longer need emergency assistance."
        confirmLabel="Yes, Cancel SOS"
        variant="warning"
        loading={submitting}
      />
    </div>
  );
}
