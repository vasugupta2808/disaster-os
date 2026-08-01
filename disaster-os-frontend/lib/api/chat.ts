import { auth } from "@/lib/firebase/client";
import { env } from "@/lib/config/env";
import { ApiError, NetworkError } from "@/lib/api/client";

/**
 * Streaming chat API call.
 *
 * Why this can't use the shared apiClient from lib/api/client.ts: that
 * client awaits a full JSON body and returns one parsed object. Chat
 * streaming needs to read the response body incrementally and hand text
 * deltas to the UI as they arrive - fundamentally different shape, so it
 * gets its own minimal fetch call here rather than forcing the shared
 * client to support two incompatible response modes.
 *
 * Why not EventSource: EventSource can't send custom headers, and we
 * need to attach a Firebase ID token (Authorization: Bearer ...) to
 * every request. A raw fetch() with a streamed response body, parsed as
 * Server-Sent Events manually, gives us both streaming AND auth headers.
 *
 * Expected backend contract (built in Step 3): POST
 * /api/v1/chat/stream returns `Content-Type: text/event-stream`, with
 * each event's `data:` line containing a JSON object of shape
 * `{ delta: string }` for a text chunk, or `{ done: true }` as the final
 * event. A `data: {"error": "..."}` event signals a server-side failure
 * mid-stream (e.g. Gemini API error after some tokens were already sent).
 */

export interface ChatStreamChunk {
  delta?: string;
  done?: boolean;
  error?: string;
}

export async function* streamChatMessage(params: {
  message: string;
  /** Prior turns, so the backend can pass conversation context to
   * Gemini. Kept minimal (role + content) - we don't send our internal
   * id/createdAt/isStreaming fields the backend doesn't need. */
  history: { role: "user" | "assistant"; content: string }[];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  const currentUser = auth.currentUser;

  let response: Response;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (currentUser) {
      headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
    }

    response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/api/v1/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: params.message, history: params.history }),
      signal: params.signal,
    });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok || !response.body) {
    // Mirror the same error-shape handling as the regular apiClient,
    // so chat errors look consistent with every other feature's errors.
    const payload: unknown = await response.json().catch(() => null);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "object"
    ) {
      const err = (payload as { error: { code: string; message: string } }).error;
      throw new ApiError(err.message, err.code, response.status);
    }
    throw new ApiError("The chat service returned an unexpected error.", "UNKNOWN_ERROR", response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line. Process every
      // complete event in the buffer, keep any trailing partial event
      // for the next read.
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
        if (!dataLine) continue;

        const jsonStr = dataLine.slice(5).trim();
        let chunk: ChatStreamChunk;
        try {
          chunk = JSON.parse(jsonStr);
        } catch {
          continue; // Skip malformed events rather than crashing the stream.
        }

        if (chunk.error) {
          throw new ApiError(chunk.error, "STREAM_ERROR", 500);
        }
        if (chunk.delta) {
          yield chunk.delta;
        }
        if (chunk.done) {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
