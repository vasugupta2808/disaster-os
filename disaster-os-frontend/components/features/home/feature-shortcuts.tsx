"use client";

import { motion } from "framer-motion";

import Link from "next/link";
import Tilt from "react-parallax-tilt";

import { NAV_ITEMS } from "@/components/layout/nav-items";


/**
 * Feature shortcuts grid.
 * Redesigned with 3D tilt effects and glassmorphism.
 */
export function FeatureShortcuts() {
  const shortcuts = NAV_ITEMS.filter(
    (item) => item.href !== "/home" && item.href !== "/settings",
  );

  return (
    <div className="rounded-2xl glass-panel p-6 sm:p-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-6">Quick access</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 relative z-10">
        {shortcuts.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, type: "spring" }}
          >
            <Tilt
              tiltMaxAngleX={8}
              tiltMaxAngleY={8}
              scale={1.02}
              transitionSpeed={2500}
              className="h-full"
            >
              <Link
                href={item.href}
                className="flex h-full flex-col items-center gap-3 rounded-xl glass-card p-4 text-center transition-all hover:bg-white/60 dark:hover:bg-slate-800/80 hover:shadow-2xl hover:border-primary/30 group/link"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 shadow-sm group-hover/link:bg-primary/20 group-hover/link:text-primary transition-colors">
                  <item.icon className="h-5 w-5 text-foreground group-hover/link:text-primary transition-colors" strokeWidth={2} />
                </span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </Link>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
