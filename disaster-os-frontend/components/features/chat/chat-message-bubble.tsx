"use client";

import { motion } from "framer-motion";

import { Bot, RotateCcw, TriangleAlert, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";


/**
 * Single chat message bubble.
 *
 * Why error/retry lives on the individual message rather than a
 * page-level banner: if the user has sent 5 messages and the 6th fails,
 * a top-of-page error banner loses the connection to WHICH message
 * failed. Attaching the retry action directly to the failed message
 * keeps that context intact and lets the user retry without losing
 * everything above it.
 */
export function ChatMessageBubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: (messageId: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex w-full gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex max-w-[75%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground",
          )}
        >
          {message.content || (message.isStreaming ? "\u00A0" : "")}
          {message.isStreaming ? (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle" />
          ) : null}
        </div>

        {message.error ? (
          <div className="flex items-center gap-2 text-xs text-severity-critical">
            <TriangleAlert className="h-3.5 w-3.5" />
            <span>{message.error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-severity-critical hover:bg-severity-critical/10 hover:text-severity-critical"
              onClick={() => onRetry(message.id)}
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
