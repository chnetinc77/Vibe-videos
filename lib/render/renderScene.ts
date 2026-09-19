import { execSync } from "child_process";
import type { TimelineScene } from "@/types/timeline";

function escapeForDrawtext(text: string): string {
  return text.replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export function renderScene(scene: TimelineScene, outputPath: string): void {
  const duration = scene.duration;
  const isVideo = scene.assetType === "video";
  const frameCount = Math.max(1, Math.round(duration * 30));

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
    // Every image-based scene gets a Ken Burns effect — no static frames anywhere in the video.
    // Alternate zoom-in vs. zoom-out by scene number so consecutive image scenes don't feel identical.
    inputArgs = `-framerate 30 -loop 1 -i "${scene.assetPath}"`;

    const zoomIn = scene.scene % 2 === 0;
    const zoomExpr = zoomIn
      ? "min(zoom+0.0012,1.15)"
      : "if(eq(on,1),1.15,max(zoom-0.0012,1.0))";

    vf = `scale=2400:1350:force_original_aspect_ratio=increase,crop=2400:1350,zoompan=z='${zoomExpr}':d=${frameCount}:s=1920x1080:fps=30`;
  }

  const cmd = `ffmpeg -y ${inputArgs} -i "${scene.voicePath}" -t ${duration} -vf "${vf}" -map 0:v:0 -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -shortest "${outputPath}"`;

  execSync(cmd, { stdio: "pipe" });
}
