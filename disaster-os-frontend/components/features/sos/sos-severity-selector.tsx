"use client";

import { cn } from "@/lib/utils";
import type { SosSeverity } from "@/types/sos";

const SEVERITY_OPTIONS: {
  value: SosSeverity;
  label: string;
  description: string;
  className: string;
}[] = [
  {
    value: "critical",
    label: "Critical",
    description: "Immediate threat to life",
    className:
      "border-severity-critical/30 bg-severity-critical/5 text-severity-critical " +
      "hover:bg-severity-critical/10 data-[selected=true]:bg-severity-critical data-[selected=true]:text-white data-[selected=true]:border-severity-critical",
  },
  {
    value: "high",
    label: "High",
    description: "Serious injury or danger",
    className:
      "border-severity-high/30 bg-severity-high/5 text-severity-high " +
      "hover:bg-severity-high/10 data-[selected=true]:bg-severity-high data-[selected=true]:text-white data-[selected=true]:border-severity-high",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Need help, not immediate danger",
    className:
      "border-severity-medium/30 bg-severity-medium/5 text-severity-medium " +
      "hover:bg-severity-medium/10 data-[selected=true]:bg-severity-medium data-[selected=true]:text-white data-[selected=true]:border-severity-medium",
  },
];

export function SosSeveritySelector({
  value,
  onChange,
}: {
  value: SosSeverity;
  onChange: (v: SosSeverity) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SEVERITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg border p-3 text-left transition-all",
            opt.className,
          )}
        >
          <p className="text-sm font-semibold">{opt.label}</p>
          <p className="mt-0.5 text-xs opacity-80">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}
