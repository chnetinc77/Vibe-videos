import fs from "fs";
import path from "path";
import type { Timeline } from "@/types/timeline";

function formatSrtTime(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);

  const pad = (n: number, len: number) => n.toString().padStart(len, "0");
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

// Wraps long narration into readable 2-line chunks for on-screen display.
function wrapText(text: string, maxCharsPerLine = 45): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());

  return lines.join("\n");
}

export function generateSrt(jobId: string, timeline: Timeline): string {
  const jobDir = path.join(process.cwd(), "tmp", "assets", jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const srtPath = path.join(jobDir, "captions.srt");

  const entries = timeline.scenes.map((scene, i) => {
    const index = i + 1;
    const start = formatSrtTime(scene.startTime);
    const end = formatSrtTime(scene.endTime);
    const text = wrapText(scene.narration);
    return `${index}\n${start} --> ${end}\n${text}\n`;
  });

  fs.writeFileSync(srtPath, entries.join("\n"));

  return srtPath;
}
