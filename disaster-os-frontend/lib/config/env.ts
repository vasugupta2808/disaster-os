import { z } from "zod";

/**
 * Validated environment variables.
 *
 * Why this file exists:
 * Next.js inlines `process.env.NEXT_PUBLIC_*` references at build time, but
 * gives you zero runtime guarantee they're actually set. Without this file,
 * a missing NEXT_PUBLIC_FIREBASE_API_KEY surfaces as a cryptic
 * "Firebase: Error (auth/invalid-api-key)" deep inside the Firebase SDK,
 * with no indication of *which* env var is the actual problem.
 *
 * This module validates every required var ONCE, at module load time
 * (which happens at app startup, since lib/firebase/client.ts imports it
 * immediately), and throws a clear, actionable error if anything is
 * missing - before any feature code ever runs.
 */

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: z.string().min(1),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables. Did you create .env.local ` +
        `from .env.example?\n${issues}`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
