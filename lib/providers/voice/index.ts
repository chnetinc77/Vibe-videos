import { VoiceProvider } from "./types";
import { FishAudioProvider } from "./fishaudio";

export function getVoiceProvider(): VoiceProvider {
  const provider = process.env.VOICE_PROVIDER;

  if (provider === "fishaudio") {
    const apiKey = process.env.FISHAUDIO_API_KEY;
    if (!apiKey) {
      throw new Error("FISHAUDIO_API_KEY is not set in environment variables.");
    }
    return new FishAudioProvider(apiKey);
  }

  throw new Error(`Unknown or unset VOICE_PROVIDER: "${provider}"`);
}

export * from "./types";
