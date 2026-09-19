import { getLLMProvider } from "@/lib/providers/llm";
import { validateScenePlan } from "@/types/scene-plan";
import type { ScenePlan } from "@/types/scene-plan";

export async function planScenes(
  title: string,
  script: string,
  durationSeconds: number
): Promise<ScenePlan> {
  const llm = getLLMProvider();

  const raw = await llm.planScenes({
    title,
    script,
    durationSeconds,
    budget: "balanced",
  });

  const result = validateScenePlan(raw);

  if (!result.valid) {
    throw new Error("Scene plan failed validation: " + JSON.stringify(result.errors));
  }

  return result.data;
}
