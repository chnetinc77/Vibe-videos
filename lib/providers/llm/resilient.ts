import { LLMProvider, ScriptGenerationInput, ScriptGenerationResult, ScenePlanningInput } from "./types";

export class ResilientLLMProvider implements LLMProvider {
  constructor(private primary: LLMProvider, private fallback: LLMProvider | null) {}

  async generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
    try {
      return await this.primary.generateScript(input);
    } catch (err) {
      if (!this.fallback) throw err;
      console.warn("Primary LLM failed, falling back:", err instanceof Error ? err.message : err);
      return await this.fallback.generateScript(input);
    }
  }

  async planScenes(input: ScenePlanningInput): Promise<unknown> {
    try {
      return await this.primary.planScenes(input);
    } catch (err) {
      if (!this.fallback) throw err;
      console.warn("Primary LLM failed, falling back:", err instanceof Error ? err.message : err);
      return await this.fallback.planScenes(input);
    }
  }
}
