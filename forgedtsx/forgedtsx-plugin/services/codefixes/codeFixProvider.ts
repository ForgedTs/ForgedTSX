import type {
  CodeFixAction,
  CombinedCodeActions,
} from "typescript/lib/tsserverlibrary";

let errorCodeToFixesArray: readonly string[] | undefined;

// export interface CodeFixRegistration {
//   errorCodes: readonly number[];
//   getCodeActions(context: CodeFixContext): CodeFixAction[] | undefined;
//   fixIds?: readonly string[];
//   getAllCodeActions?(context: CodeFixAllContext): CombinedCodeActions;
// }
// export function registerCodeFix(reg: CodeFixRegistration): void {
//   for (const error of reg.errorCodes) {
//     errorCodeToFixesArray = undefined;
//     errorCodeToFixes.add(String(error), reg);
//   }
//   if (reg.fixIds) {
//     for (const fixId of reg.fixIds) {
//       Debug.assert(!fixIdToRegistration.has(fixId));
//       fixIdToRegistration.set(fixId, reg);
//     }
//   }
// }