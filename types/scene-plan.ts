export type VisualType = "stock" | "ai_image" | "ai_video" | "chart";

export interface Scene {
  scene: number;
  duration: number;
  narration: string;
  visual_type: VisualType;
  visual_prompt: string;
  search_query: string;
  text_overlay: string;
  transition: string;
  asset_path?: string;
}

export interface ScenePlan {
  title: string;
  duration: number;
  scenes: Scene[];
}

export interface ScenePlanValidationError {
  field: string;
  message: string;
}

export function validateScenePlan(
  input: unknown
): { valid: true; data: ScenePlan } | { valid: false; errors: ScenePlanValidationError[] } {
  const errors: ScenePlanValidationError[] = [];
  const validVisualTypes: VisualType[] = ["stock", "ai_image", "ai_video", "chart"];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: [{ field: "root", message: "Scene plan must be an object." }] };
  }

  const plan = input as Record<string, unknown>;

  if (!plan.title || typeof plan.title !== "string") {
    errors.push({ field: "title", message: "Title is required and must be a string." });
  }

  if (typeof plan.duration !== "number") {
    errors.push({ field: "duration", message: "Duration is required and must be a number." });
  }

  if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) {
    errors.push({ field: "scenes", message: "Scenes must be a non-empty array." });
  } else {
    (plan.scenes as unknown[]).forEach((sceneRaw, i) => {
      const scene = sceneRaw as Record<string, unknown>;
      const prefix = `scenes[${i}]`;

      if (typeof scene.scene !== "number") {
        errors.push({ field: `${prefix}.scene`, message: "scene number must be a number." });
      }
      if (typeof scene.duration !== "number" || scene.duration <= 0) {
        errors.push({ field: `${prefix}.duration`, message: "duration must be a positive number." });
      }
      if (!scene.narration || typeof scene.narration !== "string") {
        errors.push({ field: `${prefix}.narration`, message: "narration is required." });
      }
      if (!validVisualTypes.includes(scene.visual_type as VisualType)) {
        errors.push({
          field: `${prefix}.visual_type`,
          message: `visual_type must be one of: ${validVisualTypes.join(", ")}`,
        });
      }
      if (typeof scene.visual_prompt !== "string") {
        errors.push({ field: `${prefix}.visual_prompt`, message: "visual_prompt must be a string." });
      }
      if (typeof scene.search_query !== "string") {
        errors.push({ field: `${prefix}.search_query`, message: "search_query must be a string." });
      }
      if (typeof scene.text_overlay !== "string") {
        errors.push({ field: `${prefix}.text_overlay`, message: "text_overlay must be a string." });
      }
      if (typeof scene.transition !== "string") {
        errors.push({ field: `${prefix}.transition`, message: "transition must be a string." });
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      title: plan.title as string,
      duration: plan.duration as number,
      scenes: plan.scenes as Scene[],
    },
  };
}
