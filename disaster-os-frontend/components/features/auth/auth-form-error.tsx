"use client";

import { motion } from "framer-motion";

import { TriangleAlert } from "lucide-react";


/** Shared between login and register forms - both need to surface the
 * same kind of "your credentials/sign-up attempt failed" message in the
 * same visual style, so this is one component instead of two copies. */
export function AuthFormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-4 flex items-start gap-2 rounded-lg border border-severity-critical/20 bg-severity-critical/5 p-3 text-sm text-severity-critical"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}
