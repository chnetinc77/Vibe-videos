import { StockProvider } from "./types";
import { PexelsProvider } from "./pexels";
import { PixabayProvider } from "./pixabay";

export function getStockProvider(): StockProvider {
  const provider = process.env.STOCK_PROVIDER;

  if (provider === "pexels") {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      throw new Error("PEXELS_API_KEY is not set in environment variables.");
    }
    return new PexelsProvider(apiKey);
  }

  throw new Error(`Unknown or unset STOCK_PROVIDER: "${provider}"`);
}

export function getFallbackStockProvider(): StockProvider | null {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new PixabayProvider(apiKey);
}

export * from "./types";
