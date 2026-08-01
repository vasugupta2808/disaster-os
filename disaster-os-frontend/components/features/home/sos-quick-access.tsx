"use client";

import { motion } from "framer-motion";

import { ArrowRight, Siren } from "lucide-react";
import Link from "next/link";
import Tilt from "react-parallax-tilt";


/**
 * SOS quick-access card.
 * Redesigned as a critical, glowing 3D component.
 */
export function SosQuickAccess() {
  return (
    <Link href="/sos" className="block relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-500 rounded-[1.5rem] blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse" />
      <Tilt
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
        scale={1.01}
        transitionSpeed={2000}
        className="relative"
      >
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white shadow-xl ring-1 ring-white/20"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-2xl bg-white/40" />
                <Siren className="h-7 w-7 text-white" />
              </span>
              <div>
                <p className="text-lg font-bold tracking-tight">Need emergency help?</p>
                <p className="text-sm font-medium text-white/90">Send an SOS request now</p>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/25 group-hover:translate-x-1 transition-all">
              <ArrowRight className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl" />
        </motion.div>
      </Tilt>
    </Link>
  );
}
