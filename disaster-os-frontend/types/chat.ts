/**
 * Chat-specific types.
 *
 * Kept separate from types/domain.ts rather than folded in - chat has
 * enough internal complexity (message roles, streaming status) that a
 * dedicated file is clearer than growing domain.ts indefinitely.
 */

import type { DisasterAnalysisResult } from "@/types/disaster-analysis";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO 8601
  /** True while an assistant message is still streaming in. Lets the UI
   * show a "typing" cursor on this specific message rather than a
   * separate global spinner that disappears the moment the first token
   * arrives. */
  isStreaming?: boolean;
  /** Set if this specific message failed to send/generate - lets us
   * show a retry affordance on the exact message that failed, instead
   * of a generic top-of-page error banner that loses context. */
  error?: string;

  /** Disaster analysis state - only ever set on `role: "user"` messages,
   * since the analysis describes the situation the USER described, even
   * though it renders visually alongside the assistant's reply. Kept as
   * one nested object (rather than three flat fields) so "no analysis
   * requested/attempted yet" is naturally represented by this whole
   * field being undefined. */
  analysis?: {
    status: "loading" | "success" | "error";
    result?: DisasterAnalysisResult;
    error?: string;
  };
}
