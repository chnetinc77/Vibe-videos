import { StockProvider, StockVideoResult } from "./types";

export class PexelsProvider implements StockProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideo(query: string, minDurationSeconds: number): Promise<StockVideoResult | null> {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(
      query
    )}&per_page=5&orientation=landscape`;

    const response = await fetch(url, {
      headers: { Authorization: this.apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pexels API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const videos = data?.videos as unknown[];

    if (!videos || videos.length === 0) {
      return null;
    }

    // Prefer videos long enough for the scene, sorted by closest duration match.
    const candidates = videos
      .map((v) => v as Record<string, unknown>)
      .filter((v) => (v.duration as number) >= minDurationSeconds)
      .sort((a, b) => (a.duration as number) - (b.duration as number));

    const chosen = (candidates[0] || videos[0]) as Record<string, unknown>;
    const files = chosen.video_files as Record<string, unknown>[];

    // Pick the file closest to 1920px wide, preferring not to go below 1280.
    const sorted = [...files].sort((a, b) => {
      const aw = a.width as number;
      const bw = b.width as number;
      return Math.abs(aw - 1920) - Math.abs(bw - 1920);
    });

    const bestFile = sorted.find((f) => (f.width as number) >= 1280) || sorted[0];

    if (!bestFile) {
      return null;
    }

    return {
      url: bestFile.link as string,
      width: bestFile.width as number,
      height: bestFile.height as number,
      durationSeconds: chosen.duration as number,
    };
  }
}
