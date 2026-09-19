import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { renderScene } from "../lib/render/renderScene";
import type { TimelineScene } from "../types/timeline";

const fixturePath = path.join(process.cwd(), "tmp", "test-fixtures", "sample-video-scene.json");
const scene: TimelineScene = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

const outputPath = path.join(process.cwd(), "tmp", "test-fixtures", "video-scene-rendered-TEST.mp4");

renderScene(scene, outputPath);

const probe = execSync(
  `ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of json "${outputPath}"`
).toString();

console.log("Rendered to:", outputPath);
console.log("Probe:", probe);
