import { NextRequest, NextResponse } from "next/server";
import { validateVideoRequest } from "@/types/video-request";
import { getLLMProvider } from "@/lib/providers/llm";

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

    return NextResponse.json({
      status: "script_generated",
      request: result.data,
      script: scriptResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during script generation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
