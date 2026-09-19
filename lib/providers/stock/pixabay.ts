import { StockProvider, StockVideoResult } from "./types";

export class PixabayProvider implements StockProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideo(query: string, minDurationSeconds: number): Promise<StockVideoResult | null> {
    const url = `https://pixabay.com/api/videos/?key=${this.apiKey}&q=${encodeURIComponent(query)}&per_page=5`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pixabay API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const hits = data?.hits as Record<string, unknown>[];

    if (!hits || hits.length === 0) {
      return null;
    }

    const candidates = hits.filter((h) => (h.duration as number) >= minDurationSeconds);
    const chosen = (candidates[0] || hits[0]) as Record<string, unknown>;
    const videos = chosen.videos as Record<string, Record<string, unknown>>;

    const preferOrder = ["large", "medium", "small", "tiny"];
    let bestFile: Record<string, unknown> | undefined;
    for (const key of preferOrder) {
      if (videos[key]) {
        bestFile = videos[key];
        break;
      }
    }

    if (!bestFile) {
      return null;
    }

    return {
      url: bestFile.url as string,
      width: bestFile.width as number,
      height: bestFile.height as number,
      durationSeconds: chosen.duration as number,
    };
  }
}
