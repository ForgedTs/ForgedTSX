import type {
  SourceFile,
  Program,
  CancellationToken,
  UserPreferences,
  RefactorTriggerReason,
} from "typescript";

export interface RefactorContext {
  file: SourceFile;
  startPosition: number;
  endPosition?: number;
  program: Program;
  cancellationToken?: CancellationToken;
  preferences: UserPreferences;
  triggerReason?: RefactorTriggerReason;
  kind?: string;
}
