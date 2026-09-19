import fs from "fs";
import path from "path";
import { getImageProvider } from "@/lib/providers/image";
import type { ScenePlan } from "@/types/scene-plan";

const ASSETS_DIR = path.join(process.cwd(), "tmp", "assets");

export async function generateAiImages(jobId: string, scenePlan: ScenePlan): Promise<ScenePlan> {
  const jobDir = path.join(ASSETS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const image = getImageProvider();

  for (const scene of scenePlan.scenes) {
    if (scene.visual_type === "ai_image" || scene.visual_type === "ai_video") {
      const prompt = scene.visual_prompt || scene.text_overlay || scene.narration;
      const buffer = await image.generateImage(prompt, 1920, 1080);
      const destPath = path.join(jobDir, `scene-${scene.scene}-ai.png`);
      fs.writeFileSync(destPath, buffer);
      scene.asset_path = destPath;
    }
  }

  return scenePlan;
}
