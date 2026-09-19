import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const file1 = "/root/projects/ai-video-director/tmp/assets/job-1789798681747/scene-1-rendered-TEST.mp4";
const file2 = "/root/projects/ai-video-director/tmp/test-fixtures/video-scene-rendered-TEST.mp4";

const outDir = path.join(process.cwd(), "tmp", "test-fixtures");
const concatListPath = path.join(outDir, "concat-list-TEST.txt");
fs.writeFileSync(concatListPath, `file '${file1}'\nfile '${file2}'`);

const finalOutputPath = path.join(outDir, "final-concat-TEST.mp4");

const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -pix_fmt yuv420p -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -movflags +faststart "${finalOutputPath}"`;

execSync(cmd, { stdio: "pipe" });

const probe = execSync(
  `ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of json "${finalOutputPath}"`
).toString();

console.log("Final concat output:", finalOutputPath);
console.log("Probe:", probe);
