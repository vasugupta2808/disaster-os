import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

import { env } from "@/lib/config/env";

/**
 * Firebase client SDK initialization.
 *
 * Why the `getApps().length` guard: Next.js's dev server hot-reloads
 * modules on every file save. Without this guard, `initializeApp()` would
 * run again on every hot reload and throw
 * "Firebase: Firebase App named '[DEFAULT]' already exists" - a classic
 * Next.js + Firebase footgun. Checking `getApps()` first makes this module
 * safe to import from anywhere, any number of times.
 *
 * What this client SDK is used for (per our architecture decision):
 * - Auth: sign in/up, session state, ID token retrieval for calling our
 *   FastAPI backend.
 * - Firestore: REALTIME READS ONLY (e.g. watching SOS status, live alert
 *   feed via onSnapshot). All Firestore WRITES that need validation go
 *   through the backend's Admin SDK instead - see ARCHITECTURE notes in
 *   the backend repo. This client never writes directly to Firestore for
 *   anything business-critical.
 */

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp: FirebaseApp = getApps().length
  ? getApps()[0]!
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);
export default firebaseApp;
