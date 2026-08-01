import {
  AlertTriangle,
  Backpack,
  Bot,
  Building2,
  Flame,
  Home,
  ImageIcon,
  Mic,
  Radio,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Tent,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Navigation config - single source of truth for the sidebar.
 *
 * Why this exists as data, not JSX: adding feature #11 later means adding
 * one object to this array, not hunting through sidebar JSX to find where
 * nav items live. The sidebar component below just maps over this.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short description shown in tooltips / mobile nav for clarity. */
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
    description: "Overview: weather, alerts, and quick access",
  },
  {
    label: "AI Chat",
    href: "/chat",
    icon: Bot,
    description: "Ask the AI disaster response assistant",
  },
  {
    label: "Image Analysis",
    href: "/image-analysis",
    icon: ImageIcon,
    description: "Analyze disaster damage from photos",
  },
  {
    label: "SOS",
    href: "/sos",
    icon: AlertTriangle,
    description: "Send an emergency SOS request",
  },
  {
    label: "Shelters",
    href: "/shelters",
    icon: Tent,
    description: "Find nearby emergency shelters",
  },
  {
    label: "Hospitals",
    href: "/hospitals",
    icon: Building2,
    description: "Find nearby hospitals",
  },
  {
    label: "Fire Stations",
    href: "/fire-stations",
    icon: Flame,
    description: "Find nearby fire stations",
  },
  {
    label: "Police",
    href: "/police",
    icon: ShieldAlert,
    description: "Find nearby police stations",
  },
  {
    label: "Offline Guide",
    href: "/offline-guide",
    icon: WifiOff,
    description: "Emergency guidance, available without internet",
  },
  {
    label: "Live Alerts",
    href: "/alerts",
    icon: Radio,
    description: "Real-time disaster alerts in your area",
  },
  {
    label: "Voice Assistant",
    href: "/voice-assistant",
    icon: Mic,
    description: "Hands-free voice-guided assistance",
  },
  {
    label: "Emergency Kit",
    href: "/emergency-kit",
    icon: Backpack,
    description: "Track your emergency preparedness checklist",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Manage your account and preferences",
  },
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    description: "SOS request management (admin only)",
  },
];
