import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { execSync } from "child_process";
import { validateVideoRequest } from "@/types/video-request";
import { getLLMProvider } from "@/lib/providers/llm";
import { planScenes } from "@/lib/director/scenePlanner";
import { collectAssets } from "@/lib/director/assetCollector";
import { generateVoices } from "@/lib/director/voiceGenerator";
import { buildTimeline } from "@/lib/director/timelineBuilder";
import { renderScene } from "@/lib/render/renderScene";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateVideoRequest(body);

  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  try {
    const llm = getLLMProvider();

    const scriptResult = await llm.generateScript({
      topic: result.data.topic,
      durationSeconds: result.data.durationSeconds,
      style: result.data.style,
    });

    const scenePlan = await planScenes(
      scriptResult.title,
      scriptResult.script,
      result.data.durationSeconds
    );

    const jobId = `job-${Date.now()}`;

    const scenePlanWithAssets = await collectAssets(jobId, scenePlan);
    const scenePlanWithVoices = await generateVoices(jobId, scenePlanWithAssets);
    const timeline = buildTimeline(jobId, scenePlanWithVoices);

    const videoScene = timeline.scenes.find((s) => s.assetType === "video");
    const sceneToTest = videoScene || timeline.scenes[0];

    const testOutputPath = path.join(
      process.cwd(),
      "tmp",
      "assets",
      jobId,
      `scene-${sceneToTest.scene}-rendered-TEST.mp4`
    );
    renderScene(sceneToTest, testOutputPath);

    const probeOutput = execSync(
      `ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of json "${testOutputPath}"`
    ).toString();

    return NextResponse.json({
      status: "test_scene_rendered",
      jobId,
      testedSceneNumber: sceneToTest.scene,
      testedAssetType: sceneToTest.assetType,
      testRenderPath: testOutputPath,
      testRenderProbe: JSON.parse(probeOutput),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during generation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
