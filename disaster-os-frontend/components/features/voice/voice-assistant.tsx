"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Square,
  Bot,
  User,
  Loader2,
  Repeat,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { streamChatMessage } from "@/lib/api/chat";
import Tilt from "react-parallax-tilt";


/* ------------------------------------------------------------------ */
/*  Web Speech API types                                               */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

type AssistantStatus = "idle" | "listening" | "processing" | "speaking";

/* ------------------------------------------------------------------ */
/*  Quick commands                                                     */
/* ------------------------------------------------------------------ */

const QUICK_COMMANDS = [
  "Earthquake safety tips",
  "Find nearest shelter",
  "First aid for burns",
  "Flood evacuation steps",
  "Emergency numbers in India",
  "CPR instructions",
  "How to purify water",
  "Wildfire escape plan",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function VoiceAssistant() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [autoTTS, setAutoTTS] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(false);
  const shouldRestartRef = useRef(false);

  /* Scroll to bottom on new messages */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interimText]);

  /* Init speech APIs */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result || !result[0]) continue;
        const transcript = result[0].transcript;
        if (result.isFinal) final += transcript;
        else interim += transcript;
      }
      setInterimText(interim);
      if (final.trim()) {
        setInterimText("");
        handleSend(final.trim());
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        console.error("Speech recognition error:", e.error);
      }
      isListeningRef.current = false;
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
      setInterimText("");
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      if (shouldRestartRef.current) {
        shouldRestartRef.current = false;
        try {
          recognition.start();
          isListeningRef.current = true;
        } catch { /* ignore */ }
      } else {
        setStatus((prev) => (prev === "listening" ? "idle" : prev));
        setInterimText("");
      }
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      recognition.abort();
      synthRef.current?.cancel();
      abortRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Start/stop listening */
  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListeningRef.current) {
      shouldRestartRef.current = false;
      recognition.stop();
      isListeningRef.current = false;
      setStatus("idle");
      setInterimText("");
    } else {
      synthRef.current?.cancel();
      try {
        recognition.start();
        isListeningRef.current = true;
        setStatus("listening");
      } catch {
        /* may throw if already started */
      }
    }
  }, []);

  /* Speak text */
  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ""));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    synthRef.current.speak(utterance);
  }, []);

  /* Send message to AI */
  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const recognition = recognitionRef.current;
      if (recognition && isListeningRef.current) {
        shouldRestartRef.current = false;
        recognition.stop();
        isListeningRef.current = false;
      }
      synthRef.current?.cancel();

      const userMsg: VoiceMessage = { id: `u-${Date.now()}`, role: "user", content };
      const assistantMsg: VoiceMessage = { id: `a-${Date.now()}`, role: "assistant", content: "", isStreaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStatus("processing");
      setTextInput("");

      const history = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let fullResponse = "";
      try {
        for await (const delta of streamChatMessage({
          message: content,
          history,
          signal: controller.signal,
        })) {
          fullResponse += delta;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullResponse } : m)),
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullResponse, isStreaming: false } : m,
          ),
        );

        if (autoTTS && fullResponse) {
          speak(fullResponse);
        } else {
          setStatus("idle");
        }

        /* Restart listening in continuous mode */
        if (continuousMode && recognition && !autoTTS) {
          setTimeout(() => {
            try {
              recognition.start();
              isListeningRef.current = true;
              setStatus("listening");
            } catch { /* ignore */ }
          }, 500);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorText = "Sorry, I encountered an error. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: errorText, isStreaming: false } : m,
          ),
        );
        setStatus("idle");
      }
    },
    [messages, autoTTS, continuousMode, speak],
  );

  /* Status config */
  const statusConfig: Record<AssistantStatus, { label: string; color: string; bg: string }> = {
    idle: { label: "Tap to speak", color: "text-muted-foreground", bg: "bg-secondary" },
    listening: { label: "Listening...", color: "text-severity-critical", bg: "bg-severity-critical/10" },
    processing: { label: "Processing...", color: "text-severity-medium", bg: "bg-severity-medium/10" },
    speaking: { label: "Speaking...", color: "text-primary", bg: "bg-primary/10" },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Voice Assistant</h1>
          <p className="text-sm text-muted-foreground">Hands-free emergency guidance</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            id="tts-toggle"
            variant={autoTTS ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setAutoTTS(!autoTTS)}
          >
            {autoTTS ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Auto-speak
          </Button>
          {speechSupported && (
            <Button
              id="continuous-mode-toggle"
              variant={continuousMode ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setContinuousMode(!continuousMode)}
            >
              <Repeat className="h-3.5 w-3.5" />
              Continuous
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-3" ref={scrollRef}>
        {messages.length === 0 && status === "idle" && (
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.03} transitionSpeed={2500}>
            <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Disaster Response Assistant</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {speechSupported
                    ? "Tap the microphone or type to ask about disaster safety"
                    : "Type a question about disaster safety below"}
                </p>
              </div>
            </div>
          </Tilt>
        )}

        <div className="space-y-3 pb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.isStreaming && (
                  <span className="inline-block h-3 w-1 animate-pulse bg-current ml-0.5" />
                )}
                {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 h-6 w-6"
                    onClick={() => speak(msg.content)}
                    aria-label="Speak this message"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-3.5 w-3.5 text-foreground" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Interim transcript */}
          {interimText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end gap-2.5"
            >
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/20 px-3.5 py-2.5 text-sm text-primary italic">
                {interimText}
                <span className="inline-block h-3 w-1 animate-pulse bg-primary ml-0.5" />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Mic className="h-3.5 w-3.5 text-severity-critical" />
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Quick commands */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 pb-4">
          {QUICK_COMMANDS.map((cmd) => (
            <Tilt key={cmd} tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.04} transitionSpeed={2000}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleSend(cmd)}
              >
                <Sparkles className="h-3 w-3" />
                {cmd}
              </Button>
            </Tilt>
          ))}
        </div>
      )}

      {/* Mic button + text input */}
      <div className="border-t border-border pt-4 space-y-3">
        {/* Central mic button */}
        {speechSupported && (
          <Tilt tiltMaxAngleX={12} tiltMaxAngleY={12} scale={1.05} transitionSpeed={2000}>
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {status === "listening" && (
                  <div className="absolute inset-0 rounded-full bg-severity-critical/20 animate-pulse-ring" />
                )}
                <Button
                  id="voice-mic-button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-16 w-16 rounded-full transition-all",
                    currentStatus.bg,
                    status === "listening" && "ring-2 ring-severity-critical",
                    status === "processing" && "ring-2 ring-severity-medium",
                  )}
                  onClick={toggleListening}
                  disabled={status === "processing"}
                  aria-label={status === "listening" ? "Stop listening" : "Start listening"}
                >
                  {status === "processing" ? (
                    <Loader2 className="h-6 w-6 animate-spin text-severity-medium" />
                  ) : status === "listening" ? (
                    <Square className="h-5 w-5 text-severity-critical" />
                  ) : status === "speaking" ? (
                    <Volume2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Mic className="h-6 w-6 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className={cn("text-xs font-medium", currentStatus.color)}>{currentStatus.label}</p>
            </div>
          </Tilt>
        )}

        {/* Text input fallback */}
        <div className="flex gap-2">
          <Input
            id="voice-text-input"
            placeholder={speechSupported ? "Or type your question..." : "Type your question..."}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(textInput);
              }
            }}
            disabled={status === "processing"}
          />
          <Button
            id="voice-send-button"
            size="icon"
            onClick={() => handleSend(textInput)}
            disabled={!textInput.trim() || status === "processing"}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
