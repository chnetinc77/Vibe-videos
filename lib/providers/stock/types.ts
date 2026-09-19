export interface StockVideoResult {
  url: string;
  width: number;
  height: number;
  durationSeconds: number;
}

export interface StockProvider {
  searchVideo(query: string, minDurationSeconds: number): Promise<StockVideoResult | null>;
}
