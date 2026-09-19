import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { renderScene } from "./renderScene";
import type { Timeline } from "@/types/timeline";

export function renderFinalVideo(jobId: string, timeline: Timeline): string {
  const jobDir = path.join(process.cwd(), "tmp", "assets", jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const sceneFiles: string[] = [];

  for (const scene of timeline.scenes) {
    const sceneOutputPath = path.join(jobDir, `rendered-scene-${scene.scene}.mp4`);
    renderScene(scene, sceneOutputPath);
    sceneFiles.push(sceneOutputPath);
  }

  // Build the concat list file FFmpeg needs.
  const concatListPath = path.join(jobDir, "concat-list.txt");
  const concatListContent = sceneFiles.map((f) => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatListContent);

  const finalOutputPath = path.join(jobDir, "final-video.mp4");

  // Concatenate (re-encoding, since scenes may have subtly different params) and normalize audio loudness.
  const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -pix_fmt yuv420p -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -movflags +faststart "${finalOutputPath}"`;

  execSync(cmd, { stdio: "pipe" });

  return finalOutputPath;
}
