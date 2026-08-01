"use client";

import { useCallback, useRef, useState } from "react";

import { ApiError, NetworkError } from "@/lib/api/client";
import { streamChatMessage } from "@/lib/api/chat";
import { analyzeDisasterSituation } from "@/lib/api/disaster-analysis";
import type { ChatMessage } from "@/types/chat";

/**
 * useChat - all chat state and streaming logic, kept out of the page
 * component so the page stays a thin layout and this logic is reusable/
 * testable independently.
 *
 * In-memory only (per this step's scope decision) - messages live in
 * React state and reset on refresh. The hook's shape is intentionally
 * persistence-agnostic though: swapping in Firestore later means adding
 * a sync effect here, not rewriting the message-sending logic itself.
 */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        // Every user message gets a structured analysis attempt
        // alongside the conversational reply - starts in "loading" so
        // the card's skeleton renders immediately, not after a delay.
        analysis: { status: "loading" },
      };

      const userMessageId = userMessage.id;

      const assistantMessageId = generateId();
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      // History sent to the backend is everything BEFORE this new
      // exchange - the backend appends the new user message itself
      // when calling Gemini, so we don't duplicate it here.
      const historyForRequest = messages.map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsSending(true);

      // Fire the structured analysis call independently of the
      // streaming chat call below - neither should block or be blocked
      // by the other. A failure here only marks THIS message's analysis
      // as errored; it must never affect the conversational reply.
      void analyzeDisasterSituation({ situation: trimmed })
        .then((result) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessageId ? { ...m, analysis: { status: "success", result } } : m,
            ),
          );
        })
        .catch((err: unknown) => {
          const message =
            err instanceof NetworkError || err instanceof ApiError
              ? err.message
              : "Could not analyze this message.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessageId ? { ...m, analysis: { status: "error", error: message } } : m,
            ),
          );
        });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let accumulated = "";
        for await (const delta of streamChatMessage({
          message: trimmed,
          history: historyForRequest,
          signal: controller.signal,
        })) {
          accumulated += delta;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: accumulated } : m)),
          );
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, isStreaming: false } : m)),
        );
      } catch (err) {
        const message =
          err instanceof NetworkError || err instanceof ApiError
            ? err.message
            : "Something went wrong while generating a response.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, isStreaming: false, error: message }
              : m,
          ),
        );
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isSending],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /** Removes a failed assistant message and re-sends its preceding user
   * message - used by the retry button on errored messages. */
  const retryMessage = useCallback(
    (failedMessageId: string) => {
      const failedIndex = messages.findIndex((m) => m.id === failedMessageId);
      if (failedIndex <= 0) return;

      const userMessage = messages[failedIndex - 1];
      if (!userMessage || userMessage.role !== "user") return;

      setMessages((prev) => prev.slice(0, failedIndex - 1));
      void sendMessage(userMessage.content);
    },
    [messages, sendMessage],
  );

  return { messages, isSending, sendMessage, stopStreaming, retryMessage };
}
