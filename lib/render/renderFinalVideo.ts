import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { renderScene } from "./renderScene";
import { generateSrt } from "./captionGenerator";
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

  const concatListPath = path.join(jobDir, "concat-list.txt");
  const concatListContent = sceneFiles.map((f) => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatListContent);

  const srtPath = generateSrt(jobId, timeline);

  const finalOutputPath = path.join(jobDir, "final-video.mp4");

  const subtitleStyle = "FontName=DejaVu Sans,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=60";

  const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -vf "subtitles='${srtPath}':force_style='${subtitleStyle}'" -c:v libx264 -pix_fmt yuv420p -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -movflags +faststart "${finalOutputPath}"`;

  execSync(cmd, { stdio: "pipe" });

  return finalOutputPath;
}
