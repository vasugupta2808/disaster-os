"use client";

import {
  type User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { auth } from "@/lib/firebase/client";
import type { AppUser } from "@/types/domain";

/**
 * Auth context - the backbone of the app.
 *
 * Why this exists as a Context (not just calling Firebase auth functions
 * directly in each component):
 *
 * 1. Single source of truth for "who is logged in right now", computed
 *    once via Firebase's onAuthStateChanged listener, instead of every
 *    component independently subscribing (wasteful, and risks state
 *    getting out of sync between components).
 * 2. The dashboard route group's layout (app/(dashboard)/layout.tsx) reads
 *    `user` + `loading` from here to decide whether to render the app shell
 *    or redirect to /login - one auth guard, not ten.
 * 3. lib/api/client.ts (built in the next step) will call
 *    `auth.currentUser?.getIdToken()` to attach a fresh Firebase ID token
 *    to every backend request - this provider is what guarantees
 *    `auth.currentUser` reflects reality by the time that happens.
 *
 * `loading` distinguishes "we don't know yet if you're logged in" (initial
 * page load, before Firebase has responded) from "we know you're logged
 * out" (loading=false, user=null) - collapsing these into one boolean
 * would cause a flash-of-login-page on every refresh, even for users who
 * ARE logged in.
 */

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppUser(firebaseUser: FirebaseUser): AppUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

/** Maps Firebase's cryptic auth error codes to messages safe and clear
 * enough to show directly in the UI. Unrecognized codes fall back to a
 * generic message rather than leaking Firebase's internal error format. */
function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong while signing in. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChanged fires once immediately with the current state
    // (null or a user, restored from persisted session), then again on
    // every subsequent sign-in/sign-out. This single subscription is what
    // keeps `user` accurate app-wide without polling.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toAppUser(firebaseUser) : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signInWithEmail(email: string, password: string) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function signUpWithEmail(email: string, password: string) {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function signOut() {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Consumer hook. Throws if used outside AuthProvider so misuse fails
 * loudly at the call site instead of silently returning undefined. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
