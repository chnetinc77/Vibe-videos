import { execSync } from "child_process";
import type { TimelineScene } from "@/types/timeline";

function escapeForDrawtext(text: string): string {
  return text.replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export function renderScene(scene: TimelineScene, outputPath: string): void {
  const duration = scene.duration;
  const isVideo = scene.assetType === "video";

  let inputArgs: string;
  let vf: string;

  if (isVideo) {
    inputArgs = `-stream_loop -1 -i "${scene.assetPath}"`;
    const label = scene.textOverlay ? escapeForDrawtext(scene.textOverlay) : "";
    const drawtext = label
      ? `,drawtext=text='${label}':fontcolor=white:fontsize=48:x=40:y=h-th-40:box=1:boxcolor=black@0.5:boxborderw=10`
      : "";
    vf = `fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080${drawtext}`;
  } else {
    // Explicit -framerate on the input prevents the frozen-frame bug that can occur
    // when looping a still image without a defined frame rate.
    inputArgs = `-framerate 30 -loop 1 -i "${scene.assetPath}"`;
    vf = `fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black`;
  }

  const cmd = `ffmpeg -y ${inputArgs} -i "${scene.voicePath}" -t ${duration} -vf "${vf}" -map 0:v:0 -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -shortest "${outputPath}"`;

  execSync(cmd, { stdio: "pipe" });
}
