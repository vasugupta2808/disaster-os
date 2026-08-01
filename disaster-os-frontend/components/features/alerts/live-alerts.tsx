"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Radio,
  RefreshCw,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  Loader2,
  WifiOff,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Tilt from "react-parallax-tilt";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDisasterAlerts } from "@/lib/api/alerts";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import type { DisasterAlert, Severity } from "@/types/domain";


/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REFRESH_INTERVAL = 30; // seconds
const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; dot: string; label: string }> = {
  critical: { bg: "bg-severity-critical/10", text: "text-severity-critical", dot: "bg-severity-critical", label: "Critical" },
  high: { bg: "bg-severity-high/10", text: "text-severity-high", dot: "bg-severity-high", label: "High" },
  medium: { bg: "bg-severity-medium/10", text: "text-severity-medium", dot: "bg-severity-medium", label: "Medium" },
  low: { bg: "bg-severity-low/10", text: "text-severity-low", dot: "bg-severity-low", label: "Low" },
  info: { bg: "bg-severity-info/10", text: "text-severity-info", dot: "bg-severity-info", label: "Info" },
};

const SOURCE_LABELS: Record<string, string> = {
  reliefweb: "ReliefWeb",
  openweather: "OpenWeather",
  nasa_firms: "NASA FIRMS",
};

/* ------------------------------------------------------------------ */
/*  Audio helper                                                       */
/* ------------------------------------------------------------------ */

function playAlertBeep() {
  try {
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 800;
    gain1.gain.value = 0.15;
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 600;
    gain2.gain.value = 0.15;
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.45);

    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* audio not available */
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LiveAlerts() {
  const geo = useGeolocation();
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [muted, setMuted] = useState(false);
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevAlertIdsRef = useRef<Set<string>>(new Set());

  /* Fetch alerts */
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { latitude?: number; longitude?: number; limit?: number } = { limit: 30 };
      if (geo.latitude !== null && geo.longitude !== null) {
        params.latitude = geo.latitude;
        params.longitude = geo.longitude;
      }
      const data = await getDisasterAlerts(params);
      const newIds = new Set(data.map((a) => a.id));
      const newCritical = data.filter(
        (a) => a.severity === "critical" && !prevAlertIdsRef.current.has(a.id),
      );
      if (newCritical.length > 0 && !muted) {
        playAlertBeep();
      }
      prevAlertIdsRef.current = newIds;
      setAlerts(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [geo.latitude, geo.longitude, muted]);

  /* Initial fetch when geolocation resolves */
  useEffect(() => {
    if (!geo.loading) {
      fetchAlerts();
    }
  }, [geo.loading, fetchAlerts]);

  /* Auto-refresh countdown */
  useEffect(() => {
    if (geo.loading) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAlerts();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [geo.loading, fetchAlerts]);

  /* Filtered alerts */
  const filtered = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  /* Severity counts */
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: alerts.length };
    for (const s of SEVERITY_ORDER) map[s] = 0;
    for (const a of alerts) map[a.severity] = (map[a.severity] || 0) + 1;
    return map;
  }, [alerts]);

  /* Geolocation loading state */
  if (geo.loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground">Live Alerts</h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-critical opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-severity-critical" />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {geo.latitude !== null
              ? "Real-time disaster alerts based on your location"
              : "Global disaster alerts — enable location for local alerts"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Countdown */}
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.01} transitionSpeed={2500}>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{countdown}s</span>
              <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </Tilt>

          {/* Mute */}
          <Button
            id="alert-mute-toggle"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute alerts" : "Mute alerts"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {/* Refresh */}
          <Button
            id="alert-refresh"
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAlerts();
              setCountdown(REFRESH_INTERVAL);
            }}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last updated + location */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {lastUpdated && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        )}
        {geo.latitude !== null && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {geo.latitude.toFixed(2)}°, {geo.longitude!.toFixed(2)}°
          </span>
        )}
        {geo.permissionDenied && (
          <span className="flex items-center gap-1 text-severity-medium">
            <WifiOff className="h-3 w-3" />
            Location denied — showing global alerts
          </span>
        )}
      </div>

      {/* Severity tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" className="gap-1 text-xs">
            All
            <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[10px]">
              {counts.all}
            </Badge>
          </TabsTrigger>
          {SEVERITY_ORDER.map((s) => (
            <TabsTrigger key={s} value={s} className="gap-1 text-xs">
              <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_STYLES[s].dot)} />
              {SEVERITY_STYLES[s].label}
              {(counts[s] ?? 0) > 0 && (
                <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[10px]">
                  {counts[s]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {/* Error state */}
          {error && (
            <Card className="border-severity-high/30">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertTriangle className="h-5 w-5 shrink-0 text-severity-high" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Failed to load alerts</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchAlerts()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading skeleton */}
          {loading && alerts.length === 0 && !error && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No alerts</p>
                <p className="text-xs text-muted-foreground/70">
                  {filter === "all"
                    ? "No active alerts in your area. Stay prepared."
                    : `No ${SEVERITY_STYLES[filter as Severity].label.toLowerCase()} alerts right now.`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Alert list */}
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((alert, i) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  index={i}
                  isExpanded={expandedId === alert.id}
                  onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alert card                                                         */
/* ------------------------------------------------------------------ */

function AlertCard({
  alert,
  index,
  isExpanded,
  onToggle,
}: {
  alert: DisasterAlert;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const style = SEVERITY_STYLES[alert.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.02} transitionSpeed={2500}>
        <Card
          className={cn(
            "cursor-pointer overflow-hidden border transition-all hover:shadow-sm",
            alert.severity === "critical" && "border-severity-critical/30",
          )}
          onClick={onToggle}
          id={`alert-${alert.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Severity indicator */}
              <div className="relative mt-0.5">
                <div className={cn("h-3 w-3 rounded-full", style.dot)} />
                {alert.severity === "critical" && (
                  <div className={cn("absolute inset-0 rounded-full animate-pulse-ring", style.dot)} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">{alert.title}</h3>
                  <Badge className={cn("shrink-0 text-[10px]", style.bg, style.text)} variant="outline">
                    {style.label}
                  </Badge>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <MotionP
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-foreground/80 leading-relaxed overflow-hidden"
                    >
                      {alert.description}
                    </MotionP>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    {SOURCE_LABELS[alert.source] ?? alert.source}
                  </span>
                  {alert.locationLabel && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.locationLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(alert.publishedAt), { addSuffix: true })}
                  </span>
                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Details
                    </a>
                  )}
                </div>
              </div>

              {/* Expand icon */}
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
            </div>
          </CardContent>
        </Card>
      </Tilt>
    </motion.div>
  );
}
