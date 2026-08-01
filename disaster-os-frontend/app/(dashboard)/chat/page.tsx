"use client";

import { ChatInput } from "@/components/features/chat/chat-input";
import { ChatMessageList } from "@/components/features/chat/chat-message-list";
import { useChat } from "@/lib/hooks/use-chat";

/**
 * AI Disaster Chat page.
 *
 * Deliberately thin - all real logic lives in useChat (state/streaming)
 * and the two child components (list rendering, input handling). This
 * page's only job is composing them and wiring callbacks between them.
 */
export default function ChatPage() {
  const { messages, isSending, sendMessage, stopStreaming, retryMessage } = useChat();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Assistant</h1>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          messages={messages}
          onRetry={retryMessage}
          onSelectPrompt={(prompt) => void sendMessage(prompt)}
        />
      </div>
      <ChatInput
        onSend={(message) => void sendMessage(message)}
        onStop={stopStreaming}
        isSending={isSending}
      />
    </div>
  );
}
