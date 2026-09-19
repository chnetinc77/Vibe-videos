import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { validateVideoRequest } from "@/types/video-request";
import { getLLMProvider } from "@/lib/providers/llm";
import { planScenes } from "@/lib/director/scenePlanner";
import { collectAssets } from "@/lib/director/assetCollector";
import { generateAiImages } from "@/lib/director/imageGenerator";
import { generateVoices } from "@/lib/director/voiceGenerator";
import { buildTimeline } from "@/lib/director/timelineBuilder";
import { renderFinalVideo } from "@/lib/render/renderFinalVideo";

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

    const scenePlanWithStock = await collectAssets(jobId, scenePlan);
    const scenePlanWithImages = await generateAiImages(jobId, scenePlanWithStock);
    const scenePlanWithVoices = await generateVoices(jobId, scenePlanWithImages);
    const timeline = buildTimeline(jobId, scenePlanWithVoices);

    const finalVideoPath = renderFinalVideo(jobId, timeline);

    const probeOutput = execSync(
      `ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of json "${finalVideoPath}"`
    ).toString();

    return NextResponse.json({
      status: "video_complete",
      jobId,
      title: timeline.title,
      finalVideoPath,
      probe: JSON.parse(probeOutput),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during generation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
