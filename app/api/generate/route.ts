import { NextRequest, NextResponse } from "next/server";
import { validateVideoRequest } from "@/types/video-request";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateVideoRequest(body);

  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  // NOTE: no AI calls yet — Stage 3 adds real script generation.
  return NextResponse.json({
    status: "accepted",
    message: "Job would start here (Stage 3 will implement real script generation).",
    request: result.data,
  });
}
