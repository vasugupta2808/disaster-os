"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Tilt from "react-parallax-tilt";
import {
  Search,
  WifiOff,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Mountain,
  Droplets,
  Flame,
  Wind,
  Waves,
  Landmark,
  Thermometer,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GuideStep {
  text: string;
}

interface GuidePhase {
  before: GuideStep[];
  during: GuideStep[];
  after: GuideStep[];
}

interface DisasterGuide {
  id: string;
  name: string;
  icon: typeof Mountain;
  description: string;
  color: string;
  phases: GuidePhase;
}

/* ------------------------------------------------------------------ */
/*  Data — hardcoded so it works 100% offline                          */
/* ------------------------------------------------------------------ */

const GUIDES: DisasterGuide[] = [
  {
    id: "earthquake",
    name: "Earthquake",
    icon: Mountain,
    description: "Sudden ground shaking caused by tectonic activity",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    phases: {
      before: [
        { text: "Secure heavy furniture, water heaters, and appliances to walls using straps or bolts" },
        { text: "Identify safe spots in each room — under sturdy tables, against interior walls" },
        { text: "Prepare an emergency kit with water, food, flashlight, and first aid supplies" },
        { text: "Practice 'Drop, Cover, and Hold On' drills with your family regularly" },
        { text: "Know how to shut off gas, water, and electricity in your home" },
        { text: "Store important documents in a waterproof, fireproof container" },
      ],
      during: [
        { text: "DROP to your hands and knees to prevent being knocked down" },
        { text: "Take COVER under a sturdy desk or table — protect your head and neck" },
        { text: "HOLD ON to your shelter until the shaking stops completely" },
        { text: "If outdoors, move to an open area away from buildings, trees, and power lines" },
        { text: "If driving, pull over safely, stop, and stay inside the vehicle" },
        { text: "Do NOT run outside or use elevators during shaking" },
        { text: "If near the coast, move to higher ground immediately — tsunami risk" },
      ],
      after: [
        { text: "Check yourself and others for injuries — provide first aid as needed" },
        { text: "Inspect your home for structural damage before re-entering" },
        { text: "Be prepared for aftershocks — they can be strong and damaging" },
        { text: "Check gas lines for leaks — if you smell gas, leave immediately and call emergency services" },
        { text: "Use a flashlight, not candles, to avoid fire risk from gas leaks" },
        { text: "Listen to official channels for updates and follow instructions" },
      ],
    },
  },
  {
    id: "flood",
    name: "Flood",
    icon: Droplets,
    description: "Rising water levels from heavy rain, storms, or dam failure",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    phases: {
      before: [
        { text: "Know your area's flood risk — check flood maps and evacuation routes" },
        { text: "Elevate electrical systems, appliances, and valuables above potential flood level" },
        { text: "Install check valves in plumbing to prevent floodwater backup" },
        { text: "Prepare waterproof bags for important documents and electronics" },
        { text: "Stock emergency supplies including drinking water, as tap water may be contaminated" },
        { text: "Sign up for local emergency alert systems and weather notifications" },
      ],
      during: [
        { text: "Move immediately to higher ground — do NOT wait for instructions" },
        { text: "NEVER walk, swim, or drive through flood waters — 6 inches can knock you down" },
        { text: "Stay off bridges over fast-moving water" },
        { text: "If trapped in a building, go to the highest level — do NOT go into a closed attic" },
        { text: "Disconnect electrical appliances — do not touch electrical equipment if wet" },
        { text: "Avoid contact with floodwater — it may be contaminated with sewage or chemicals" },
      ],
      after: [
        { text: "Return home only when authorities say it is safe" },
        { text: "Photograph all damage for insurance claims before cleaning up" },
        { text: "Discard any food that has come in contact with floodwater" },
        { text: "Clean and disinfect everything that got wet — mold can develop within 24-48 hours" },
        { text: "Have your home's electrical system inspected before turning power back on" },
        { text: "Watch for weakened roads, bridges, and structures" },
      ],
    },
  },
  {
    id: "wildfire",
    name: "Wildfire",
    icon: Flame,
    description: "Uncontrolled fire in forests, grasslands, or brush areas",
    color: "from-red-500/20 to-orange-500/20 border-red-500/30",
    phases: {
      before: [
        { text: "Create a 30-foot defensible space around your home — remove dead vegetation and debris" },
        { text: "Use fire-resistant materials for roofing and exterior walls if possible" },
        { text: "Install ember-resistant vents and keep gutters clean of leaves" },
        { text: "Plan multiple evacuation routes and practice with your family" },
        { text: "Prepare a go-bag with essentials, documents, medications, and N95 masks" },
        { text: "Keep garden hoses and a ladder accessible for firefighters" },
      ],
      during: [
        { text: "Evacuate IMMEDIATELY when ordered — wildfires move fast and unpredictably" },
        { text: "Wear protective clothing — long sleeves, pants, boots, N95 mask, goggles" },
        { text: "Close all windows and doors but leave them unlocked for firefighters" },
        { text: "Turn off gas and propane — leave lights on so firefighters can see your home in smoke" },
        { text: "If trapped, call 911 — stay in your home, away from exterior walls and windows" },
        { text: "Drive with headlights on, windows up, and vents closed to avoid smoke" },
      ],
      after: [
        { text: "Return only when fire officials declare the area safe" },
        { text: "Watch for hot spots, smoldering stumps, and flare-ups for several days" },
        { text: "Avoid damaged or fallen power lines and utility poles" },
        { text: "Wear a dust mask (N95) and wet debris down before cleanup to avoid inhaling ash" },
        { text: "Check your roof and attic for hidden embers — they can reignite hours later" },
        { text: "Document all damage with photos and contact your insurance provider" },
      ],
    },
  },
  {
    id: "cyclone",
    name: "Cyclone / Hurricane",
    icon: Wind,
    description: "Massive rotating storm system with destructive winds and rain",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    phases: {
      before: [
        { text: "Board up windows with plywood or install storm shutters" },
        { text: "Trim trees and remove dead branches that could become projectiles" },
        { text: "Stock at least 7 days of water (1 gallon/person/day) and non-perishable food" },
        { text: "Fill your vehicle's fuel tank and withdraw emergency cash" },
        { text: "Charge all devices and portable batteries — power outages may last days" },
        { text: "Know your evacuation zone and identify the nearest hurricane shelter" },
      ],
      during: [
        { text: "Stay indoors in an interior room on the lowest floor, away from windows" },
        { text: "If flooding threatens, move to a higher floor — never stay in a basement" },
        { text: "Do NOT go outside during the eye of the storm — the worst winds follow" },
        { text: "Close all interior doors and brace external doors" },
        { text: "Use a mattress or heavy blankets to protect against flying debris" },
        { text: "Keep your emergency radio on for official updates" },
      ],
      after: [
        { text: "Stay away from floodwaters and downed power lines" },
        { text: "Use generators outdoors only — carbon monoxide kills silently" },
        { text: "Boil tap water until authorities confirm it is safe" },
        { text: "Photograph all damage before making temporary repairs" },
        { text: "Be cautious of weakened structures — walls, roofs, and floors may collapse" },
        { text: "Check in on neighbors, especially elderly and those with disabilities" },
      ],
    },
  },
  {
    id: "tsunami",
    name: "Tsunami",
    icon: Waves,
    description: "Massive ocean waves caused by earthquakes or underwater landslides",
    color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30",
    phases: {
      before: [
        { text: "Know if you live, work, or vacation in a tsunami hazard zone" },
        { text: "Learn the natural warning signs — earthquake, rapid sea recession, unusual ocean roar" },
        { text: "Identify evacuation routes to high ground (100+ feet above sea level)" },
        { text: "Practice evacuation with your family — you may have only minutes" },
        { text: "Have a go-bag ready near the door with essentials" },
        { text: "Sign up for tsunami warning systems and alerts" },
      ],
      during: [
        { text: "If you feel a strong earthquake near the coast, move to high ground IMMEDIATELY" },
        { text: "Do NOT wait for an official warning — natural signs are your first alert" },
        { text: "Move inland and uphill — aim for at least 100 feet above sea level or 2 miles inland" },
        { text: "If caught by the wave, grab onto something that floats" },
        { text: "NEVER go to the beach to watch a tsunami — waves arrive as a series, not just one" },
        { text: "If in a boat in deep water, head further out to sea — tsunamis are dangerous near shore" },
      ],
      after: [
        { text: "Stay away from the coast until officials declare it safe — more waves may come" },
        { text: "Avoid wading in floodwater — it may be contaminated or electrically charged" },
        { text: "Be alert for secondary hazards — landslides, fires, and contaminated water" },
        { text: "Check for structural damage before entering any building" },
        { text: "Help injured or trapped people if you can do so safely" },
        { text: "Listen to official channels for updates — all-clear may take hours" },
      ],
    },
  },
  {
    id: "landslide",
    name: "Landslide",
    icon: Landmark,
    description: "Rapid movement of rock, soil, and debris down a slope",
    color: "from-stone-500/20 to-yellow-700/20 border-stone-500/30",
    phases: {
      before: [
        { text: "Learn if your area is prone to landslides — steep slopes, recent wildfires, heavy rain areas" },
        { text: "Watch for warning signs: new cracks in walls/foundations, tilting trees, unusual water seepage" },
        { text: "Install flexible pipe fittings to avoid gas or water leaks during ground movement" },
        { text: "Plant ground cover on slopes to stabilize soil and reduce erosion" },
        { text: "Build channels or deflection walls to direct mudflow away from structures" },
        { text: "Have an evacuation plan with multiple routes away from valleys and hillsides" },
      ],
      during: [
        { text: "If indoors, take cover under a sturdy desk or table — move away from the path of the slide" },
        { text: "If outdoors, run to the nearest high ground away from the slide path" },
        { text: "If near a stream, be alert for sudden changes in water flow or color (muddy)" },
        { text: "If you cannot escape, curl into a tight ball and protect your head" },
        { text: "Listen for unusual sounds — trees cracking, boulders knocking, rumbling" },
        { text: "NEVER cross a road with flowing mud or debris" },
      ],
      after: [
        { text: "Stay away from the slide area — additional slides may occur" },
        { text: "Check for injured or trapped people near the slide — call emergency services" },
        { text: "Report broken utility lines (gas, water, power, sewage) to authorities" },
        { text: "Watch for flooding — landslides can dam rivers and create flood risk" },
        { text: "Inspect your home's foundation for damage before re-entering" },
        { text: "Replant damaged ground to prevent future erosion and slides" },
      ],
    },
  },
  {
    id: "heatwave",
    name: "Heat Wave",
    icon: Thermometer,
    description: "Prolonged period of excessively hot weather beyond normal levels",
    color: "from-orange-500/20 to-red-400/20 border-orange-500/30",
    phases: {
      before: [
        { text: "Identify air-conditioned public spaces (malls, libraries) as cooling shelters" },
        { text: "Install window reflectors, awnings, or blackout curtains to reduce heat" },
        { text: "Check that your AC is working and stock up on fans and water" },
        { text: "Learn the signs of heat exhaustion and heat stroke — it can be fatal" },
        { text: "Plan outdoor activities for early morning or evening when temperatures are lower" },
        { text: "Check on elderly neighbors and those without AC — they are most vulnerable" },
      ],
      during: [
        { text: "Stay indoors in air conditioning as much as possible" },
        { text: "Drink plenty of water — do NOT wait until you are thirsty" },
        { text: "Avoid alcohol, caffeine, and heavy meals — they increase dehydration" },
        { text: "Wear lightweight, light-colored, loose-fitting clothing" },
        { text: "NEVER leave children or pets in a parked vehicle — temperatures can reach 140°F in minutes" },
        { text: "If you must work outdoors, take frequent breaks in shade and drink water every 15 minutes" },
        { text: "Watch for heat stroke signs: hot dry skin, confusion, rapid pulse — call 911 immediately" },
      ],
      after: [
        { text: "Continue drinking plenty of water for several days after the heat breaks" },
        { text: "Check on vulnerable neighbors and confirm they are safe" },
        { text: "Inspect your home for heat damage — cracked walls, warped materials, AC strain" },
        { text: "Monitor for delayed heat illness — symptoms can appear hours later" },
        { text: "Review your heat emergency plan and stock supplies for next time" },
        { text: "Report any public infrastructure damage (road buckling, power issues) to authorities" },
      ],
    },
  },
  {
    id: "chemical",
    name: "Chemical Spill",
    icon: FlaskConical,
    description: "Release of hazardous substances into the environment",
    color: "from-lime-500/20 to-green-500/20 border-lime-500/30",
    phases: {
      before: [
        { text: "Know what hazardous materials are stored or transported near your home" },
        { text: "Identify a room in your home that can be sealed — interior, above ground, minimal windows" },
        { text: "Keep plastic sheeting, duct tape, and scissors ready to seal doors/windows" },
        { text: "Stock N95 or P100 respirator masks for each family member" },
        { text: "Know your area's chemical emergency evacuation routes" },
        { text: "Program the Poison Control number (1-800-222-1222) into your phone" },
      ],
      during: [
        { text: "If told to shelter-in-place: go to your sealed room, close all openings, turn off HVAC" },
        { text: "If told to evacuate: go upwind, uphill, and upstream from the contamination" },
        { text: "Cover your mouth and nose with a wet cloth if no mask is available" },
        { text: "Do NOT touch or walk through any visible spills, vapors, or suspicious substances" },
        { text: "If exposed: remove contaminated clothing and wash skin with soap and water for 15 minutes" },
        { text: "If chemicals contact your eyes: flush with clean water for at least 20 minutes" },
        { text: "Call 911 and local hazmat teams — report what you observed" },
      ],
      after: [
        { text: "Follow decontamination instructions from hazmat teams precisely" },
        { text: "Do NOT return to the area until authorities declare it safe" },
        { text: "Seek medical attention if you experience dizziness, nausea, difficulty breathing, or skin irritation" },
        { text: "Dispose of contaminated clothing in sealed bags — do not wash with other laundry" },
        { text: "Air out your home by opening windows and running fans once authorities give the all-clear" },
        { text: "Report lingering smells or symptoms to local environmental health authorities" },
      ],
    },
  },
];

const STORAGE_KEY = "disaster-os-bookmarked-guides";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OfflineGuide() {
  const [search, setSearch] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Load bookmarks from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setBookmarks(new Set(JSON.parse(stored) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  /* Persist bookmarks */
  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    },
    [],
  );

  /* Filter guides */
  const filtered = useMemo(() => {
    let result = GUIDES;
    if (showBookmarked) result = result.filter((g) => bookmarks.has(g.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.phases.before.some((s) => s.text.toLowerCase().includes(q)) ||
          g.phases.during.some((s) => s.text.toLowerCase().includes(q)) ||
          g.phases.after.some((s) => s.text.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [search, showBookmarked, bookmarks]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Offline Survival Guide</h1>
          <Badge variant="secondary" className="gap-1 text-xs">
            <WifiOff className="h-3 w-3" />
            Available Offline
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Step-by-step survival guides for major disaster types. All content is stored locally — no internet needed.
        </p>
      </div>

      {/* Search + Bookmark filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="guide-search"
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          id="bookmark-filter-toggle"
          variant={showBookmarked ? "default" : "outline"}
          size="sm"
          onClick={() => setShowBookmarked(!showBookmarked)}
          className="gap-1.5 shrink-0"
        >
          <BookmarkCheck className="h-4 w-4" />
          Bookmarked{bookmarks.size > 0 && ` (${bookmarks.size})`}
        </Button>
      </div>

      {/* Guide grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No guides found</p>
            <p className="text-xs text-muted-foreground/70">
              {showBookmarked ? "No bookmarked guides match your search." : "Try a different search term."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((guide, i) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                index={i}
                isBookmarked={bookmarks.has(guide.id)}
                isExpanded={expandedId === guide.id}
                onToggleBookmark={() => toggleBookmark(guide.id)}
                onToggleExpand={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Expanded detail overlay */}
      <AnimatePresence>
        {expandedId && (
          <GuideDetail
            guide={GUIDES.find((g) => g.id === expandedId)!}
            isBookmarked={bookmarks.has(expandedId)}
            onToggleBookmark={() => toggleBookmark(expandedId)}
            onClose={() => setExpandedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function GuideCard({
  guide,
  index,
  isBookmarked,
  isExpanded,
  onToggleBookmark,
  onToggleExpand,
}: {
  guide: DisasterGuide;
  index: number;
  isBookmarked: boolean;
  isExpanded: boolean;
  onToggleBookmark: () => void;
  onToggleExpand: () => void;
}) {
  const Icon = guide.icon;

  const getCardColor = (id: string) => {
    if (["earthquake", "landslide"].includes(id)) return "var(--clr-orange)";
    if (["flood", "tsunami"].includes(id)) return "var(--clr-blue)";
    if (["wildfire", "heatwave"].includes(id)) return "var(--clr-red)";
    return "var(--clr-green)";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.02} transitionSpeed={2000} className="h-full">
        <div
          className={cn(
            "flex h-full cursor-pointer flex-col justify-between rounded-xl border border-transparent bg-[var(--bg-dark)] p-4 transition-all hover:shadow-xl sm:p-5",
            isExpanded && "border-primary",
          )}
          onClick={onToggleExpand}
          id={`guide-card-${guide.id}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between text-[var(--color-gray-light)]">
            <div className="text-sm font-semibold tracking-wide">3 phases</div>
            <button
              className="text-white transition-colors hover:text-[var(--color-gray-light)]"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
            </button>
          </div>

          {/* Body */}
          <div className="mt-4 flex-1">
            <h3 className="text-xl font-bold tracking-tight text-white">{guide.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-gray-light)]">{guide.description}</p>

            <div className="mt-6">
              <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-gray-medium)]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: "100%", backgroundColor: getCardColor(guide.id) }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-medium text-[var(--color-gray-light)]">
                <span>Progress</span>
                <span>
                  {guide.phases.before.length + guide.phases.during.length + guide.phases.after.length} steps
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="-mb-4 -mx-4 mt-6 flex items-center justify-between rounded-b-xl border-t border-[var(--color-gray-medium)] bg-[var(--bg-footer)] p-4 pt-4 sm:-mb-5 sm:-mx-5 sm:p-5">
            <ul className="flex items-center space-x-[-10px]">
              <li className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-gray-dark)] bg-[var(--bg-dark)]">
                <Icon className="h-4 w-4 text-white" />
              </li>
            </ul>
            <span className="rounded-full border border-[var(--color-gray-medium)] px-4 py-1.5 text-xs font-bold text-[var(--color-white)] transition-colors hover:bg-[var(--color-gray-medium)]">
              View guide
            </span>
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
}

function GuideDetail({
  guide,
  isBookmarked,
  onToggleBookmark,
  onClose,
}: {
  guide: DisasterGuide;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
}) {
  const Icon = guide.icon;

  const phaseConfig = [
    { key: "before" as const, label: "Before", icon: ShieldCheck, description: "Preparation steps" },
    { key: "during" as const, label: "During", icon: AlertTriangle, description: "Survival actions" },
    { key: "after" as const, label: "After", icon: RotateCcw, description: "Recovery steps" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={2500} className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          id={`guide-detail-${guide.id}`}
          onClick={(e) => e.stopPropagation()}
        >
      <div className={cn("rounded-t-xl bg-gradient-to-r p-5", guide.color)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/90 shadow">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{guide.name}</h2>
              <p className="text-sm text-muted-foreground">{guide.description}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="before">
          <TabsList className="w-full">
            {phaseConfig.map((phase) => (
              <TabsTrigger key={phase.key} value={phase.key} className="flex-1 gap-1.5 text-xs">
                <phase.icon className="h-3.5 w-3.5" />
                {phase.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {phaseConfig.map((phase) => (
            <TabsContent key={phase.key} value={phase.key}>
              <ScrollArea className="h-[320px] pr-3">
                <p className="mb-3 text-xs font-medium text-muted-foreground">{phase.description}</p>
                <ol className="space-y-2.5">
                  {guide.phases[phase.key].map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-2.5 text-sm"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{step.text}</span>
                    </motion.li>
                  ))}
                </ol>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
        </motion.div>
      </Tilt>
    </div>
  );
}
