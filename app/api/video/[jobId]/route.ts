import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Basic sanity check to prevent path traversal via the jobId param.
  if (!/^job-\d+$/.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID." }, { status: 400 });
  }

  const videoPath = path.join(process.cwd(), "tmp", "assets", jobId, "final-video.mp4");

  if (!fs.existsSync(videoPath)) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(videoPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
