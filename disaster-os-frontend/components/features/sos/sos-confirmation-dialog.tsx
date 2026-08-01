"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Confirmation dialog for SOS actions.
 *
 * Used for both send and cancel confirmations. A dedicated component
 * rather than a generic confirm() because:
 * 1. It uses Radix Dialog for accessibility (focus trapping, ESC to
 *    close, screen reader announcements) - critical for a panic-situation UI.
 * 2. The visual treatment differs from a normal dialog - send uses the
 *    severity-critical red, cancel uses muted/destructive styling.
 */

interface SosConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  variant: "danger" | "warning";
  loading?: boolean;
  children?: ReactNode;
}

export function SosConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  variant,
  loading = false,
}: SosConfirmationDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                variant === "danger"
                  ? "bg-severity-critical/10 text-severity-critical"
                  : "bg-severity-medium/10 text-severity-medium"
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </span>
          </div>

          {/* Title */}
          <Dialog.Title className="text-center text-lg font-semibold text-foreground">
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="mt-2 text-center text-sm text-muted-foreground">
            {description}
          </Dialog.Description>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={loading}
              >
                Go back
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                variant === "danger"
                  ? "bg-severity-critical hover:bg-severity-critical/90 focus:ring-severity-critical"
                  : "bg-severity-medium hover:bg-severity-medium/90 focus:ring-severity-medium"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing…
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
