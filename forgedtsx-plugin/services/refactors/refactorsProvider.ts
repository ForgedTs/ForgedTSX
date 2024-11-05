// A map with the refactor code as key, the refactor itself as value
// e.g.  nonSuggestableRefactors[refactorCode] -> the refactor you want
import type {
  ApplicableRefactorInfo,
  InteractiveRefactorArguments,
  RefactorEditInfo,
} from "typescript";
import type { RefactorContext } from "./types";

export interface Refactor {
  /** List of action kinds a refactor can provide.
   * Used to skip unnecessary calculation when specific refactors are requested. */
  kinds?: string[];

  /** Compute the associated code actions */
  getEditsForAction(
    context: RefactorContext,
    actionName: string,
    interactiveRefactorArguments?: InteractiveRefactorArguments
  ): RefactorEditInfo | undefined;

  /** Compute (quickly) which actions are available here */
  getAvailableActions(
    context: RefactorContext,
    includeInteractive?: boolean,
    interactiveRefactorArguments?: InteractiveRefactorArguments
  ): readonly ApplicableRefactorInfo[];
}

export const refactors = new Map<string, Refactor>();

export function registerRefactor(name: string, refactor: Refactor): void {
  refactors.set(name, refactor);
}
