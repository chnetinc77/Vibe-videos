import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/jobStore";
import { runRenderPhase } from "@/lib/director/pipeline";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (job.status !== "SCRIPT_READY") {
    return NextResponse.json(
      { error: `Job is not awaiting script approval (current status: ${job.status}).` },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const finalScript = typeof body.script === "string" && body.script.trim().length >= 20
    ? body.script.trim()
    : job.script!;
  const finalTitle = typeof body.title === "string" && body.title.trim().length > 0
    ? body.title.trim()
    : job.title!;

  runRenderPhase(jobId, finalTitle, finalScript, job.durationSeconds!);

  return NextResponse.json({ status: "PLANNING_SCENES", jobId }, { status: 202 });
}
