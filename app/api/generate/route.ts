import { NextRequest, NextResponse } from "next/server";
import { validateVideoRequest } from "@/types/video-request";
import { getLLMProvider } from "@/lib/providers/llm";
import { planScenes } from "@/lib/director/scenePlanner";
import { collectAssets } from "@/lib/director/assetCollector";

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

    return NextResponse.json({
      status: "assets_collected",
      jobId,
      request: result.data,
      script: scriptResult,
      scenePlan: scenePlanWithAssets,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during generation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
