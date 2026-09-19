import fs from "fs";
import path from "path";
import { getStockProvider, getFallbackStockProvider } from "@/lib/providers/stock";
import type { ScenePlan } from "@/types/scene-plan";

const ASSETS_DIR = path.join(process.cwd(), "tmp", "assets");

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download asset from ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

export async function collectAssets(jobId: string, scenePlan: ScenePlan): Promise<ScenePlan> {
  const jobDir = path.join(ASSETS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const stock = getStockProvider();
  const fallbackStock = getFallbackStockProvider();

  for (const scene of scenePlan.scenes) {
    if (scene.visual_type === "stock") {
      let result = await stock.searchVideo(scene.search_query, scene.duration);

      if (!result && fallbackStock) {
        result = await fallbackStock.searchVideo(scene.search_query, scene.duration);
      }

      if (!result) {
        throw new Error(
          `No stock footage found for scene ${scene.scene} (query: "${scene.search_query}")`
        );
      }

      const destPath = path.join(jobDir, `scene-${scene.scene}.mp4`);
      await downloadFile(result.url, destPath);
      scene.asset_path = destPath;
    }
  }

  return scenePlan;
}
