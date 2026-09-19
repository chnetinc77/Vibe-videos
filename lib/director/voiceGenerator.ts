import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { getVoiceProvider } from "@/lib/providers/voice";
import type { ScenePlan } from "@/types/scene-plan";

const ASSETS_DIR = path.join(process.cwd(), "tmp", "assets");

function getAudioDuration(filePath: string): number {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  )
    .toString()
    .trim();
  return parseFloat(output);
}

export async function generateVoices(jobId: string, scenePlan: ScenePlan): Promise<ScenePlan> {
  const jobDir = path.join(ASSETS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const voice = getVoiceProvider();

  for (const scene of scenePlan.scenes) {
    const audioBuffer = await voice.generateSpeech(scene.narration);
    const destPath = path.join(jobDir, `scene-${scene.scene}-voice.mp3`);
    fs.writeFileSync(destPath, audioBuffer);

    scene.voice_path = destPath;
    scene.actual_voice_duration = getAudioDuration(destPath);
  }

  return scenePlan;
}
