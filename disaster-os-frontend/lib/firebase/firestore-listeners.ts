/**
 * Firestore realtime listeners.
 *
 * This file is the ONLY place in the frontend that calls the Firestore
 * client SDK directly. Every other data operation goes through our
 * FastAPI backend. This exception exists because Firestore's onSnapshot
 * listener is genuinely better than polling for the SOS status tracker —
 * a status change (pending → active → resolved) needs to appear
 * instantly on the user's screen, not after a poll interval. That
 * real-time push model is exactly what Firestore's client SDK is built
 * for and what the server-side Admin SDK can't replicate.
 *
 * Security: reads here are gated by Firestore Security Rules (not just
 * Firebase Auth token validation) — the rules must allow users to read
 * their own SOS documents. See FIRESTORE_RULES.md in the backend repo
 * for the rules that need to be deployed alongside this app.
 */

import {
  doc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { firestore } from "@/lib/firebase/client";
import type { SosRequest } from "@/types/sos";

/**
 * Subscribes to real-time updates for a single SOS document.
 *
 * Returns an unsubscribe function — call it in a useEffect cleanup to
 * stop listening when the component unmounts or the sosId changes.
 *
 * Usage:
 *   useEffect(() => {
 *     const unsub = subscribeSosStatus(sosId, (sos) => setSos(sos));
 *     return () => unsub();
 *   }, [sosId]);
 */
export function subscribeSosStatus(
  sosId: string,
  onUpdate: (sos: SosRequest | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const docRef = doc(firestore, "sos_requests", sosId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }

      const data = snapshot.data();

      // Convert Firestore Timestamp → ISO 8601 string, matching the
      // shape returned by the backend's REST endpoints so the UI can
      // treat both sources identically.
      const toIso = (val: unknown): string => {
        if (val && typeof (val as { toDate?: unknown }).toDate === "function") {
          return (val as { toDate: () => Date }).toDate().toISOString();
        }
        return String(val ?? new Date().toISOString());
      };

      onUpdate({
        id: snapshot.id,
        uid: data["uid"] ?? "",
        status: data["status"] ?? "pending",
        severity: data["severity"] ?? "high",
        situation: data["situation"] ?? "",
        latitude: data["latitude"] ?? 0,
        longitude: data["longitude"] ?? 0,
        locationLabel: data["location_label"] ?? "Unknown location",
        createdAt: toIso(data["created_at"]),
        updatedAt: toIso(data["updated_at"]),
        resolvedBy: data["resolved_by"] ?? null,
        resolutionNote: data["resolution_note"] ?? null,
        message: data["message"],
        emergencyType: data["emergency_type"] ?? "other",
        guidance: data["guidance"] ?? {
          urgency: "medium",
          situationSummary: "",
          instructions: [],
          emergencyNumbers: [],
        },
      });
    },
    (error) => {
      console.error("SOS listener error:", error);
      onError?.(error);
    },
  );
}
