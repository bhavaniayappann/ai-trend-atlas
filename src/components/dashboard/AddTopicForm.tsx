"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, CheckCircle2 } from "lucide-react";
import type { Topic } from "@/lib/types";

interface AddTopicFormProps {
  topics: Topic[];
}

export function AddTopicForm({ topics: initialTopics }: AddTopicFormProps) {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const customTopics = topics.filter((t) => t.is_custom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          description: description.trim() || undefined,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add topic");

      const newTopic = data.topic as Topic;
      setTopics((prev) => {
        const without = prev.filter((t) => t.slug !== newTopic.slug);
        return [newTopic, ...without];
      });

      setLabel("");
      setDescription("");
      setKeywords("");
      setSuccess(`Added "${newTopic.label}"`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">Custom Topics</h2>
      </div>
      <p className="mt-1 text-xs text-muted">
        Add topics to track. They appear in the Galaxy and get matched during ingestion.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Topic name (e.g. Gemini CLI)"
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
        />
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Keywords, comma-separated (optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && (
          <p className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {success}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !label.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-accent/15 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {loading ? "Adding..." : "Add Topic"}
        </button>
      </form>

      {customTopics.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted">Your topics ({customTopics.length})</p>
          {customTopics.map((topic) => (
            <div
              key={topic.id}
              className="rounded-md border border-border bg-background px-3 py-2"
            >
              <p className="text-sm font-medium text-foreground">{topic.label}</p>
              {topic.description && (
                <p className="mt-0.5 text-xs text-muted">{topic.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
