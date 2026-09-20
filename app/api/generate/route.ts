import { NextRequest, NextResponse } from "next/server";
import { validateVideoRequest } from "@/types/video-request";
import { createJob } from "@/lib/jobs/jobStore";
import { runScriptPhase } from "@/lib/director/pipeline";

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

  const autoApprove = body.autoApprove === true;

  runScriptPhase(
    jobId,
    result.data.topic,
    result.data.durationSeconds,
    result.data.style,
    result.data.script,
    autoApprove
  );

  return NextResponse.json({ status: "QUEUED", jobId }, { status: 202 });
}
