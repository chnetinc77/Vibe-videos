import { ImageProvider } from "./types";
import { PollinationsProvider } from "./pollinations";

export function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER;

  if (provider === "pollinations") {
    return new PollinationsProvider();
  }

  throw new Error(`Unknown or unset IMAGE_PROVIDER: "${provider}"`);
}

export * from "./types";
