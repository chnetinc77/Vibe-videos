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
import { createJob, updateJob } from "@/lib/jobs/jobStore";

async function runPipeline(
  jobId: string,
  topic: string,
  durationSeconds: number,
  style: "cinematic" | "educational" | "motivational"
) {
  try {
    updateJob(jobId, { status: "WRITING_SCRIPT" });

    const llm = getLLMProvider();
    const scriptResult = await llm.generateScript({ topic, durationSeconds, style });

    updateJob(jobId, { status: "PLANNING_SCENES", title: scriptResult.title });
    const scenePlan = await planScenes(scriptResult.title, scriptResult.script, durationSeconds);

    updateJob(jobId, { status: "COLLECTING_VISUALS" });
    const scenePlanWithStock = await collectAssets(jobId, scenePlan);
    const scenePlanWithImages = await generateAiImages(jobId, scenePlanWithStock);

    updateJob(jobId, { status: "GENERATING_VOICE" });
    const scenePlanWithVoices = await generateVoices(jobId, scenePlanWithImages);

    updateJob(jobId, { status: "RENDERING" });
    const timeline = buildTimeline(jobId, scenePlanWithVoices);
    renderFinalVideo(jobId, timeline);

    updateJob(jobId, { status: "COMPLETED", title: timeline.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during generation.";
    updateJob(jobId, { status: "FAILED", error: message });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateVideoRequest(body);

  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  const jobId = `job-${Date.now()}`;
  createJob(jobId);

  // Fire-and-forget: the pipeline runs in the background; this response returns immediately.
  runPipeline(jobId, result.data.topic, result.data.durationSeconds, result.data.style);

  return NextResponse.json({ status: "QUEUED", jobId }, { status: 202 });
}
