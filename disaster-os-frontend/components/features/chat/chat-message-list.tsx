"use client";

import { useEffect, useRef, useState } from "react";

import { ChatEmptyState } from "@/components/features/chat/chat-empty-state";
import { ChatMessageBubble } from "@/components/features/chat/chat-message-bubble";
import { DisasterAnalysisCard } from "@/components/features/chat/disaster-analysis-card";
import type { ChatMessage } from "@/types/chat";

/**
 * Scrollable message list.
 *
 * Auto-scroll logic: we want new tokens streaming in to keep the latest
 * message visible WITHOUT fighting a user who has manually scrolled up
 * to re-read earlier messages. The `isPinnedToBottom` ref tracks whether
 * the user was already at (or near) the bottom before new content
 * arrived - we only auto-scroll if they were. This is the same pattern
 * chat UIs like Slack/Discord use.
 */
export function ChatMessageList({
  messages,
  onRetry,
  onSelectPrompt,
}: {
  messages: ChatMessage[];
  onRetry: (messageId: string) => void;
  onSelectPrompt: (prompt: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);

  useEffect(() => {
    if (!isPinnedToBottom) return;
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isPinnedToBottom]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < 80);
  }

  if (messages.length === 0) {
    return <ChatEmptyState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-2">
            <ChatMessageBubble message={message} onRetry={onRetry} />
            {message.role === "user" && message.analysis ? (
              <DisasterAnalysisCard analysis={message.analysis} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
