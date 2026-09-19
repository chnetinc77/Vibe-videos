import { generatePlaceholder } from "./placeholderGenerator";
import type { ScenePlan } from "@/types/scene-plan";
import type { Timeline, TimelineScene } from "@/types/timeline";

export function buildTimeline(jobId: string, scenePlan: ScenePlan): Timeline {
  let cursor = 0;
  const timelineScenes: TimelineScene[] = [];

  for (const scene of scenePlan.scenes) {
    const duration = scene.actual_voice_duration ?? scene.duration;

    let assetPath = scene.asset_path;
    let assetType: "video" | "image" = scene.visual_type === "stock" ? "video" : "image";

    if (!assetPath) {
      assetPath = generatePlaceholder(jobId, scene);
      assetType = "image";
    }

    if (!scene.voice_path) {
      throw new Error(`Scene ${scene.scene} has no voice_path — voice generation must run first.`);
    }

    timelineScenes.push({
      scene: scene.scene,
      startTime: cursor,
      endTime: cursor + duration,
      duration,
      narration: scene.narration,
      assetPath,
      assetType,
      visualType: scene.visual_type,
      voicePath: scene.voice_path,
      textOverlay: scene.text_overlay,
      transition: scene.transition,
    });

    cursor += duration;
  }

  return {
    title: scenePlan.title,
    totalDuration: cursor,
    scenes: timelineScenes,
  };
}
