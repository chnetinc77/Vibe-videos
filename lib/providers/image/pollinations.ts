import { ImageProvider } from "./types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PollinationsProvider implements ImageProvider {
  async generateImage(prompt: string, width: number, height: number): Promise<Buffer> {
    const encoded = encodeURIComponent(prompt);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Pollinations API error (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 5000) {
          throw new Error(`Pollinations returned a suspiciously small image (${buffer.length} bytes)`);
        }

        return buffer;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(
      `Pollinations image generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }
}
