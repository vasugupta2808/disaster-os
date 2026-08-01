"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Trash2,
  Shield,
  Zap,
  FileText,
  Camera,
  Building2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { analyzeDisasterSituation } from "@/lib/api/disaster-analysis";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import type { DisasterAnalysisResult } from "@/types/disaster-analysis";
import type { Severity } from "@/types/domain";
import Tilt from "react-parallax-tilt";


/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-severity-critical/10", text: "text-severity-critical", label: "Critical" },
  high: { bg: "bg-severity-high/10", text: "text-severity-high", label: "High" },
  medium: { bg: "bg-severity-medium/10", text: "text-severity-medium", label: "Medium" },
  low: { bg: "bg-severity-low/10", text: "text-severity-low", label: "Low" },
  info: { bg: "bg-severity-info/10", text: "text-severity-info", label: "Info" },
};

const URGENCY_LEVELS: Severity[] = ["info", "low", "medium", "high", "critical"];

const QUICK_SCENARIOS = [
  "Building collapsed nearby",
  "Flooding in the area",
  "Fire spreading rapidly",
  "Earthquake just felt",
  "Chemical smell detected",
  "Power lines down",
  "Landslide blocking road",
  "Severe storm approaching",
];

function formatDisasterType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Cyclone", "/ Cyclone")
    .replace("Hazmat", "/ Hazmat");
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnalysisEntry {
  id: string;
  situation: string;
  result: DisasterAnalysisResult;
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ImageAnalysis() {
  const geo = useGeolocation();
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<DisasterAnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisEntry[]>([]);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!situation.trim() || loading) return;
    setLoading(true);
    setError(null);
    setCurrentResult(null);
    setShowReasoning(false);

    try {
      const params: { situation: string; latitude?: number; longitude?: number } = {
        situation: situation.trim(),
      };
      if (geo.latitude !== null && geo.longitude !== null) {
        params.latitude = geo.latitude;
        params.longitude = geo.longitude;
      }

      const result = await analyzeDisasterSituation(params);
      setCurrentResult(result);

      setHistory((prev) => [
        { id: `analysis-${Date.now()}`, situation: situation.trim(), result, timestamp: new Date() },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [situation, loading, geo.latitude, geo.longitude]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold text-foreground">Disaster Analysis</h1>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe a disaster situation and get an AI-powered threat assessment with actionable instructions.
        </p>
      </div>

      {/* Quick scenarios */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_SCENARIOS.map((scenario) => (
          <Tilt key={scenario} tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.05} transitionSpeed={2000}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSituation(scenario)}
            >
              {scenario}
            </Button>
          </Tilt>
        ))}
      </div>

      {/* Input area */}
      <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={2500}>
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Textarea
                id="situation-input"
                placeholder="Describe the disaster situation in detail... (e.g., 'A strong earthquake just hit, buildings are shaking, cracks in walls, power is out')"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={loading}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {geo.latitude !== null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location included ({geo.latitude.toFixed(2)}°, {geo.longitude!.toFixed(2)}°)
                    </span>
                  )}
                </div>
                <Button
                  id="analyze-button"
                  onClick={handleAnalyze}
                  disabled={!situation.trim() || loading}
                  className="gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {loading ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>

            {/* Image upload placeholder */}
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-center">
              <Camera className="h-5 w-5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground/60">
                Image upload coming soon — describe the situation above for now
              </p>
            </div>
          </CardContent>
        </Card>
      </Tilt>

      {/* Loading skeleton */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-severity-high/30">
          <CardContent className="flex items-center gap-3 py-5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-severity-high" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Analysis failed</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAnalyze} className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {currentResult && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Type + Urgency header */}
            <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={2500}>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={cn("text-sm px-3 py-1", SEVERITY_STYLES[currentResult.urgency].bg, SEVERITY_STYLES[currentResult.urgency].text)} variant="outline">
                      <Zap className="mr-1 h-3.5 w-3.5" />
                      {formatDisasterType(currentResult.disasterType)}
                    </Badge>
                    <Badge className={cn("text-sm px-3 py-1", SEVERITY_STYLES[currentResult.urgency].bg, SEVERITY_STYLES[currentResult.urgency].text)} variant="outline">
                      {SEVERITY_STYLES[currentResult.urgency].label} Urgency
                    </Badge>
                  </div>

                  {/* Urgency gauge */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Threat Level</p>
                    <div className="flex gap-1">
                      {URGENCY_LEVELS.map((level) => {
                        const isActive = URGENCY_LEVELS.indexOf(currentResult.urgency) >= URGENCY_LEVELS.indexOf(level);
                        return (
                          <div
                            key={level}
                            className={cn(
                              "h-2 flex-1 rounded-full transition-all",
                              isActive ? SEVERITY_STYLES[level].bg.replace("/10", "") : "bg-muted",
                            )}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Info</span>
                      <span>Critical</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-sm leading-relaxed text-foreground">{currentResult.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </Tilt>

            {/* Instructions */}
            {currentResult.instructions.length > 0 && (
              <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.01} transitionSpeed={2500}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      Action Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {currentResult.instructions.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground/90 leading-relaxed">{step}</p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </Tilt>
            )}

            {/* Emergency numbers + Shelters grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Emergency Numbers */}
              {currentResult.emergencyNumbers.length > 0 && (
                <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.02} transitionSpeed={2500}>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-severity-critical" />
                        Emergency Numbers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {currentResult.emergencyNumbers.map((num, i) => (
                        <a
                          key={i}
                          href={`tel:${num.number}`}
                          className="flex items-center justify-between rounded-lg border border-border p-2.5 transition-colors hover:bg-secondary"
                        >
                          <span className="text-sm text-foreground">{num.label}</span>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {num.number}
                          </Badge>
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                </Tilt>
              )}

              {/* Nearby Shelters */}
              {currentResult.shelters.length > 0 && (
                <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.02} transitionSpeed={2500}>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-severity-info" />
                        Nearby Shelters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {currentResult.shelters.map((shelter, i) => (
                        <div key={i} className="rounded-lg border border-border p-2.5 space-y-1">
                          <p className="text-sm font-medium text-foreground">{shelter.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shelter.address}
                          </p>
                          {shelter.distanceKm !== null && (
                            <Badge variant="secondary" className="text-[10px]">
                              {shelter.distanceKm.toFixed(1)} km away
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </Tilt>
              )}
            </div>

            {/* Reasoning note */}
            {currentResult.reasoningNote && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    AI Reasoning
                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", showReasoning && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {showReasoning && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 text-sm text-muted-foreground leading-relaxed overflow-hidden"
                      >
                        {currentResult.reasoningNote}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            <Separator />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center gap-2 text-sm font-medium text-foreground"
              id="analysis-history-toggle"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", showHistory && "rotate-90")} />
              Analysis History ({history.length})
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="cursor-pointer rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
                      onClick={() =>
                        setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-[10px]",
                              SEVERITY_STYLES[entry.result.urgency].bg,
                              SEVERITY_STYLES[entry.result.urgency].text,
                            )}
                            variant="outline"
                          >
                            {SEVERITY_STYLES[entry.result.urgency].label}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {formatDisasterType(entry.result.disasterType)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <AnimatePresence>
                        {expandedHistoryId === entry.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 space-y-1.5 overflow-hidden"
                          >
                            <p className="text-xs text-muted-foreground italic">
                              &quot;{entry.situation}&quot;
                            </p>
                            <p className="text-sm text-foreground/80">{entry.result.summary}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1 text-xs text-muted-foreground"
                    onClick={() => {
                      setHistory([]);
                      setShowHistory(false);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear history
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
