export type VideoStyle = "cinematic" | "educational" | "motivational";
export type VideoBudget = "economy" | "balanced" | "cinematic";

export interface VideoRequest {
  topic: string;
  durationSeconds: number;
  style: VideoStyle;
  budget: VideoBudget;
  script?: string;
}

export interface VideoRequestValidationError {
  field: keyof VideoRequest;
  message: string;
}

export function validateVideoRequest(
  input: Partial<VideoRequest>
): { valid: true; data: VideoRequest } | { valid: false; errors: VideoRequestValidationError[] } {
  const errors: VideoRequestValidationError[] = [];

  if (!input.topic || input.topic.trim().length < 3) {
    errors.push({ field: "topic", message: "Topic/title must be at least 3 characters." });
  }

  if (
    !input.durationSeconds ||
    input.durationSeconds < 30 ||
    input.durationSeconds > 900
  ) {
    errors.push({
      field: "durationSeconds",
      message: "Duration must be between 30 and 900 seconds.",
    });
  }

  const validStyles: VideoStyle[] = ["cinematic", "educational", "motivational"];
  if (!input.style || !validStyles.includes(input.style)) {
    errors.push({ field: "style", message: "Style must be one of: " + validStyles.join(", ") });
  }

  const validBudgets: VideoBudget[] = ["economy", "balanced", "cinematic"];
  if (!input.budget || !validBudgets.includes(input.budget)) {
    errors.push({ field: "budget", message: "Budget must be one of: " + validBudgets.join(", ") });
  }

  if (input.script !== undefined && input.script.trim().length < 20) {
    errors.push({ field: "script", message: "Custom script must be at least 20 characters if provided." });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      topic: input.topic!.trim(),
      durationSeconds: input.durationSeconds!,
      style: input.style!,
      budget: input.budget!,
      script: input.script?.trim(),
    },
  };
}
