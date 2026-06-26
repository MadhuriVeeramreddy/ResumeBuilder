export type GenerationStage =
  | "planning"
  | "timeline"
  | "summary_skills"
  | "role_1"
  | "role_2"
  | "role_3"
  | "role_4"
  | "role_5"
  | "assembling"
  | "ready";

export class StageError extends Error {
  readonly stage: GenerationStage;
  readonly cause?: unknown;

  constructor(stage: GenerationStage, message?: string, cause?: unknown) {
    super(message ?? `Generation failed at stage: ${stage}`);
    this.name = "StageError";
    this.stage = stage;
    this.cause = cause;
  }
}

export function isStageError(error: unknown): error is StageError {
  return error instanceof StageError;
}
