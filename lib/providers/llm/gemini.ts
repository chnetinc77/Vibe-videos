import { LLMProvider, ScriptGenerationInput, ScriptGenerationResult } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";
const WORDS_PER_MINUTE = 135; // average narration pace

export class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini API returned no text content.");
    }

    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/```$/, "");

    let parsed: { title: string; script: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse Gemini response as JSON: " + cleaned.slice(0, 200));
    }

    const wordCount = parsed.script.trim().split(/\s+/).length;

    return {
      title: parsed.title,
      script: parsed.script,
      wordCount,
    };
  }
}
