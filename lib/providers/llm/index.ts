import { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini";

export function getLLMProvider(): LLMProvider {
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

export * from "./types";
