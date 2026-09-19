import { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import { ResilientLLMProvider } from "./resilient";

function buildPrimary(): LLMProvider {
  const provider = process.env.LLM_PROVIDER;

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return new GeminiProvider(apiKey);
  }

  throw new Error(`Unknown or unset LLM_PROVIDER: "${provider}"`);
}

function buildFallback(): LLMProvider | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GroqProvider(apiKey);
}

export function getLLMProvider(): LLMProvider {
  const primary = buildPrimary();
  const fallback = buildFallback();
  return new ResilientLLMProvider(primary, fallback);
}

export * from "./types";
