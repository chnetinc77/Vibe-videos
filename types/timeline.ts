import type { VisualType } from "./scene-plan";

export interface TimelineScene {
  scene: number;
  startTime: number;
  endTime: number;
  duration: number;
  narration: string;
  assetPath: string;
  assetType: "video" | "image";
  visualType: VisualType;
  voicePath: string;
  textOverlay: string;
  transition: string;
}

export interface Timeline {
  title: string;
  totalDuration: number;
  scenes: TimelineScene[];
}
