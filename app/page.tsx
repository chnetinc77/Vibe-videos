"use client";

import { useState, useRef } from "react";

type Style = "cinematic" | "educational" | "motivational";

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "Queued…",
  WRITING_SCRIPT: "Writing script…",
  PLANNING_SCENES: "Planning scenes…",
  COLLECTING_VISUALS: "Collecting visuals…",
  GENERATING_VOICE: "Generating voiceover…",
  RENDERING: "Rendering final video…",
  COMPLETED: "Done!",
  FAILED: "Failed",
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [style, setStyle] = useState<Style>("cinematic");
  const [useCustomScript, setUseCustomScript] = useState(false);
  const [customScript, setCustomScript] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  const [reviewScript, setReviewScript] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function pollStatus(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Status check failed.");

        setStatus(data.status);
        if (data.title) setTitle(data.title);

        if (data.status === "SCRIPT_READY") {
          stopPolling();
          setLoading(false);
          setReviewScript(data.script || "");
          setReviewTitle(data.title || "");
        } else if (data.status === "COMPLETED") {
          stopPolling();
          setLoading(false);
        } else if (data.status === "FAILED") {
          stopPolling();
          setLoading(false);
          setError(data.error || "Generation failed.");
        }
      } catch (err) {
        stopPolling();
        setLoading(false);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }, 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus("QUEUED");
    setJobId(null);
    setTitle(null);
    stopPolling();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          durationSeconds: durationMinutes * 60,
          style,
          budget: "balanced",
          script: useCustomScript ? customScript : undefined,
          autoApprove,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.[0]?.message || "Generation failed.");

      setJobId(data.jobId);
      pollStatus(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    setStatus("PLANNING_SCENES");

    try {
      const res = await fetch(`/api/jobs/${jobId}/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: reviewScript, title: reviewTitle }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to continue.");

      pollStatus(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const awaitingReview = status === "SCRIPT_READY" && !loading;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">AI Video Director</h1>
      <p className="text-slate-400 mb-10">What do you want to make?</p>

      {!jobId && (
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Create a documentary about Figure AI and Brett Adcock"
            rows={3}
            required
            minLength={3}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 resize-none focus:outline-none focus:border-slate-400"
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                max={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-slate-400"
              >
                <option value="cinematic">Cinematic</option>
                <option value="educational">Educational</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={useCustomScript}
              onChange={(e) => setUseCustomScript(e.target.checked)}
            />
            I want to provide my own exact script
          </label>

          {useCustomScript && (
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Paste your exact narration script here…"
              rows={6}
              className="bg-slate-900 border border-slate-700 rounded-lg p-3 resize-none focus:outline-none focus:border-slate-400"
            />
          )}

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
            />
            Skip review — generate the whole video automatically
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition"
          >
            {loading ? "Generating…" : "Generate Video"}
          </button>
        </form>
      )}

      {loading && status && status !== "SCRIPT_READY" && (
        <div className="mt-8 w-full max-w-md flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-300">{STATUS_LABELS[status] || status}</p>
        </div>
      )}

      {error && (
        <div className="mt-8 w-full max-w-md bg-red-950 border border-red-800 text-red-200 rounded-lg p-4">
          {error}
        </div>
      )}

      {awaitingReview && (
        <div className="mt-8 w-full max-w-2xl flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Review the script before continuing</h2>
          <input
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 font-semibold focus:outline-none focus:border-slate-400"
          />
          <textarea
            value={reviewScript}
            onChange={(e) => setReviewScript(e.target.value)}
            rows={10}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-slate-400"
          />
          <button
            onClick={handleApprove}
            className="bg-indigo-600 hover:bg-indigo-500 rounded-lg py-3 font-semibold transition"
          >
            Approve &amp; Continue
          </button>
        </div>
      )}

      {!loading && status === "COMPLETED" && jobId && (
        <div className="mt-10 w-full max-w-2xl flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <video
            controls
            className="w-full rounded-lg border border-slate-800"
            src={`/api/video/${jobId}`}
          />
          <a
            href={`/api/video/${jobId}`}
            download={`${title}.mp4`}
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Download MP4
          </a>
        </div>
      )}
    </main>
  );
}
