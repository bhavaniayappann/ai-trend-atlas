"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What is driving Claude Code adoption?",
  "Why is MCP suddenly popular?",
  "Which AI frameworks are growing fastest?",
  "What is replacing traditional RAG?",
];

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">AI Trend Analyst</h2>
              <p className="mt-1 max-w-md text-sm text-muted">
                Ask about emerging technology trends. I analyze discussions across
                Reddit, Hacker News, and GitHub to explain what&apos;s growing and why.
              </p>
            </div>
            <div className="grid max-w-lg grid-cols-2 gap-2">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-xs text-muted transition-colors hover:border-accent/30 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-accent/15 text-foreground"
                    : "bg-surface text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{getMessageText(m.parts)}</p>
              </div>
              {m.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface">
                  <User className="h-3.5 w-3.5 text-muted" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent" />
              </div>
              <div className="rounded-lg bg-surface px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 focus-within:border-accent/50">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any technology trend..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
