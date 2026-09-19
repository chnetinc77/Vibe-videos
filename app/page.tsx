"use client";

import { useState } from "react";

type Style = "cinematic" | "educational" | "motivational";

interface GenerateResult {
  status: string;
  jobId: string;
  title: string;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [style, setStyle] = useState<Style>("cinematic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          durationSeconds: durationMinutes * 60,
          style,
          budget: "balanced",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.errors?.[0]?.message || "Generation failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">AI Video Director</h1>
      <p className="text-slate-400 mb-10">What do you want to make?</p>

      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Create a documentary about Figure AI and Brett Adcock"
          rows={3}
          required
          minLength={5}
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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition"
        >
          {loading ? "Generating… this can take a few minutes" : "Generate Video"}
        </button>
      </form>

      {error && (
        <div className="mt-8 w-full max-w-md bg-red-950 border border-red-800 text-red-200 rounded-lg p-4">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-10 w-full max-w-2xl flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">{result.title}</h2>
          <video
            controls
            className="w-full rounded-lg border border-slate-800"
            src={`/api/video/${result.jobId}`}
          />
          
            href={`/api/video/${result.jobId}`}
            download={`${result.title}.mp4`}
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Download MP4
          </a>
        </div>
      )}
    </main>
  );
}
