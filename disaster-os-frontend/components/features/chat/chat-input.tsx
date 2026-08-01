"use client";

import { Square, ArrowUp } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Chat input.
 *
 * Why a manually-managed textarea height instead of a fixed-height input:
 * disaster-related questions are often multi-sentence ("My basement is
 * flooding and I have an elderly relative who can't walk, what do I do
 * first?") - a single-line input would truncate the user's view of what
 * they're typing right when clarity matters most.
 */
export function ChatInput({
  onSend,
  onStop,
  isSending,
}: {
  onSend: (message: string) => void;
  onStop: () => void;
  isSending: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }

  function handleSubmit() {
    if (!value.trim() || isSending) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/40">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about emergency procedures, safety steps, or what to do..."
          rows={1}
          className="max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
        />
        {isSending ? (
          <Button size="icon" variant="secondary" onClick={onStop} aria-label="Stop generating">
            <Square className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!value.trim()}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        This assistant provides general guidance and is not a substitute for
        emergency services. In a life-threatening situation, contact local
        emergency services immediately.
      </p>
    </div>
  );
}
