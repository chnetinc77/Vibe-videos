export interface ScriptGenerationInput {
  topic: string;
  durationSeconds: number;
  style: "cinematic" | "educational" | "motivational";
}

export interface ScriptGenerationResult {
  title: string;
  script: string;
  wordCount: number;
}

export interface LLMProvider {
  generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult>;
}
