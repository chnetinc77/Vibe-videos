import { LLMProvider, ScriptGenerationInput, ScriptGenerationResult, ScenePlanningInput } from "./types";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const WORDS_PER_MINUTE = 135;

function stripJsonFences(text: string): string {
  return text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
}

export class GroqProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callGroq(prompt: string): Promise<string> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Groq API returned no content.");
    }

    return text;
  }

  async generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
    const targetWords = Math.round((input.durationSeconds / 60) * WORDS_PER_MINUTE);

    const prompt = `You are a documentary scriptwriter. Write a factual, ${input.style} narration script about: "${input.topic}".

Requirements:
- Target length: approximately ${targetWords} words (for a ${Math.round(input.durationSeconds / 60)}-minute video)
- Factual and accurate — do not invent statistics, quotes, or events
- Written as continuous narration text, not a list of scenes
- No stage directions, no scene numbers, no visual descriptions — narration text only
- Start with a strong hook in the first sentence
- End with a clear closing thought

Also provide a short, compelling video title.

Respond ONLY with valid JSON in this exact format, no markdown fences, no extra text:
{"title": "...", "script": "..."}`;

    const rawText = await this.callGroq(prompt);
    const cleaned = stripJsonFences(rawText);

    let parsed: { title: string; script: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse Groq script response as JSON: " + cleaned.slice(0, 200));
    }

    const wordCount = parsed.script.trim().split(/\s+/).length;

    return {
      title: parsed.title,
      script: parsed.script,
      wordCount,
    };
  }

  async planScenes(input: ScenePlanningInput): Promise<unknown> {
    const prompt = `You are a video director breaking a narration script into scenes for production.

Title: "${input.title}"
Total target duration: ${input.durationSeconds} seconds
Script:
"""
${input.script}
"""

Break this script into scenes. For EACH scene, decide the cheapest visual that still communicates the idea well, following this priority order:
1. "stock" — real stock footage (use for general b-roll: offices, cities, people working, generic concepts). PREFER THIS whenever it's sufficient.
2. "chart" — a data chart/graphic (use when the narration cites a specific statistic, number, or comparison).
3. "ai_image" — a generated static image (use when a specific, non-stock-able visual is needed but motion isn't important).
4. "ai_video" — generated video with motion (use ONLY when motion is essential — this is the most expensive option, use sparingly, ideally no more than 1 in 5 scenes).

Rules:
- Split the narration into natural scene breaks, each roughly 5-12 seconds of spoken narration.
- Every scene's narration text, concatenated in order, must reconstruct the full original script.
- "search_query" is a short stock-footage search phrase (used only when visual_type is "stock").
- "visual_prompt" is a detailed image/video generation prompt (used only when visual_type is "ai_image" or "ai_video"; empty string otherwise).
- "text_overlay" is a short on-screen text for the scene, or empty string if none needed.
- "transition" is one of: "cut", "fade", "dissolve".
- Scene durations should sum to approximately ${input.durationSeconds} seconds.

Respond ONLY with valid JSON, no markdown fences, no extra text, in this exact format:
{
  "title": "...",
  "duration": ${input.durationSeconds},
  "scenes": [
    {
      "scene": 1,
      "duration": 8,
      "narration": "...",
      "visual_type": "stock",
      "visual_prompt": "",
      "search_query": "...",
      "text_overlay": "...",
      "transition": "cut"
    }
  ]
}`;

    const rawText = await this.callGroq(prompt);
    const cleaned = stripJsonFences(rawText);

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse Groq scene plan response as JSON: " + cleaned.slice(0, 300));
    }
  }
}
