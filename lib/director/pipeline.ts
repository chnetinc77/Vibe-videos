import { getLLMProvider } from "@/lib/providers/llm";
import { planScenes } from "@/lib/director/scenePlanner";
import { collectAssets } from "@/lib/director/assetCollector";
import { generateAiImages } from "@/lib/director/imageGenerator";
import { generateVoices } from "@/lib/director/voiceGenerator";
import { buildTimeline } from "@/lib/director/timelineBuilder";
import { renderFinalVideo } from "@/lib/render/renderFinalVideo";
import { updateJob } from "@/lib/jobs/jobStore";

export async function runScriptPhase(
  jobId: string,
  topic: string,
  durationSeconds: number,
  style: "cinematic" | "educational" | "motivational",
  customScript: string | undefined,
  autoApprove: boolean
): Promise<void> {
  try {
    let title: string;
    let script: string;

    if (customScript) {
      title = topic;
      script = customScript;
    } else {
      updateJob(jobId, { status: "WRITING_SCRIPT" });
      const llm = getLLMProvider();
      const scriptResult = await llm.generateScript({ topic, durationSeconds, style });
      title = scriptResult.title;
      script = scriptResult.script;
    }

    if (autoApprove) {
      updateJob(jobId, { title, script, durationSeconds });
      await runRenderPhase(jobId, title, script, durationSeconds);
    } else {
      updateJob(jobId, { status: "SCRIPT_READY", title, script, durationSeconds });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during script generation.";
    updateJob(jobId, { status: "FAILED", error: message });
  }
}

export async function runRenderPhase(
  jobId: string,
  title: string,
  script: string,
  durationSeconds: number
): Promise<void> {
  try {
    updateJob(jobId, { status: "PLANNING_SCENES", title, script });
    const scenePlan = await planScenes(title, script, durationSeconds);

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
    const message = err instanceof Error ? err.message : "Unknown error during rendering.";
    updateJob(jobId, { status: "FAILED", error: message });
  }
}
