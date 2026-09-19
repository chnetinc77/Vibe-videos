export type VideoStyle = "cinematic" | "educational" | "motivational";
export type VideoBudget = "economy" | "balanced" | "cinematic";

export interface VideoRequest {
  topic: string;
  durationSeconds: number;
  style: VideoStyle;
  budget: VideoBudget;
}

export interface VideoRequestValidationError {
  field: keyof VideoRequest;
  message: string;
}

export function validateVideoRequest(
  input: Partial<VideoRequest>
): { valid: true; data: VideoRequest } | { valid: false; errors: VideoRequestValidationError[] } {
  const errors: VideoRequestValidationError[] = [];

  if (!input.topic || input.topic.trim().length < 5) {
    errors.push({ field: "topic", message: "Topic must be at least 5 characters." });
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
    },
  };
}
