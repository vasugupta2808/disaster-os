"use client";

import { motion } from "framer-motion";

import { Bot } from "lucide-react";
import Tilt from "react-parallax-tilt";


const SUGGESTED_PROMPTS = [
  "What should I do during an earthquake if I'm indoors?",
  "How do I purify water if the supply is contaminated?",
  "What are the signs of heatstroke and how do I treat it?",
  "How should I prepare my home before a flood warning?",
];

/**
 * Chat empty state with suggested prompts.
 *
 * Why these specific prompts: each demonstrates a different disaster
 * category (earthquake, water safety, heat, flood) so a first-time user
 * (or a hackathon judge) immediately sees the assistant's range without
 * needing to think of a question themselves.
 */
export function ChatEmptyState({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
      <Tilt tiltMaxAngleX={12} tiltMaxAngleY={12} scale={1.06} transitionSpeed={2500}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
        >
          <Bot className="h-6 w-6 text-primary" />
        </motion.div>
      </Tilt>

      <div>
        <h2 className="text-base font-semibold text-foreground">
          AI Disaster Response Assistant
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ask anything about emergency preparedness, safety procedures, or what
          to do during a disaster.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <Tilt
            key={prompt}
            tiltMaxAngleX={8}
            tiltMaxAngleY={8}
            scale={1.03}
            transitionSpeed={2000}
            className="w-full"
          >
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => onSelectPrompt(prompt)}
              className="w-full rounded-lg border border-border bg-card p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
            >
              {prompt}
            </motion.button>
          </Tilt>
        ))}
      </div>
    </div>
  );
}
