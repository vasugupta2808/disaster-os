"use client";

import { motion } from "framer-motion";

import { ChevronRight, Radio, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, NetworkError } from "@/lib/api/client";
import { getDisasterAlerts } from "@/lib/api/alerts";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import type { DisasterAlert, Severity } from "@/types/domain";


const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

/** Maps severity to the Tailwind classes for its badge - kept as one
 * lookup here rather than scattered conditionals, and reused verbatim by
 * the full Alerts page later so badges look identical everywhere. */
const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  critical: "bg-severity-critical/10 text-severity-critical border-severity-critical/20",
  high: "bg-severity-high/10 text-severity-high border-severity-high/20",
  medium: "bg-severity-medium/10 text-severity-medium border-severity-medium/20",
  low: "bg-severity-low/10 text-severity-low border-severity-low/20",
  info: "bg-severity-info/10 text-severity-info border-severity-info/20",
};

export function AlertsPreviewCard() {
  const geo = useGeolocation();
  const [alerts, setAlerts] = useState<DisasterAlert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Alerts don't strictly require location (a global feed is a
    // reasonable fallback), so we don't block on geo.loading here - we
    // just pass coordinates through if/when they become available.
    if (geo.loading) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDisasterAlerts({
      latitude: geo.latitude ?? undefined,
      longitude: geo.longitude ?? undefined,
      limit: 3,
    })
      .then((data) => {
        if (!cancelled) setAlerts(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof NetworkError || err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not load alerts.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [geo.loading, geo.latitude, geo.longitude]);

  return (
    <div className="rounded-2xl glass-panel p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recent alerts</h2>
        </div>
        <Link
          href="/alerts"
          className="flex items-center text-xs font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : error ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <TriangleAlert className="h-4 w-4" />
            {error}
          </div>
        ) : alerts && alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{alert.locationLabel}</p>
              </div>
              <Badge
                variant="outline"
                className={SEVERITY_BADGE_CLASS[alert.severity]}
              >
                {SEVERITY_LABEL[alert.severity]}
              </Badge>
            </motion.div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No active alerts in your area.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
