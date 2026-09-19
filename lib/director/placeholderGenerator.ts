import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { Scene } from "@/types/scene-plan";

const ASSETS_DIR = path.join(process.cwd(), "tmp", "assets");

const PLACEHOLDER_COLORS: Record<string, string> = {
  ai_image: "0x2C3E50",
  ai_video: "0x8E44AD",
  chart: "0x16A085",
};

function escapeForDrawtext(text: string): string {
  return text.replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export function generatePlaceholder(jobId: string, scene: Scene): string {
  const jobDir = path.join(ASSETS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const destPath = path.join(jobDir, `scene-${scene.scene}-placeholder.png`);
  const color = PLACEHOLDER_COLORS[scene.visual_type] || "0x34495E";
  const label = scene.text_overlay || `[${scene.visual_type.toUpperCase()} PLACEHOLDER]`;
  const safeLabel = escapeForDrawtext(label);

  const cmd = `ffmpeg -y -f lavfi -i color=c=${color}:s=1920x1080 -vf "drawtext=text='${safeLabel}':fontcolor=white:fontsize=54:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 "${destPath}"`;

  execSync(cmd, { stdio: "pipe" });

  return destPath;
}
