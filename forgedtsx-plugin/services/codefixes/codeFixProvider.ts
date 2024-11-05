import type { CodeFixAction } from "typescript";

export const codeFixes: CodeFixRegistration[] = [];

export interface CodeFixRegistration {
  errorCodes: readonly number[];
  getCodeActions(context: any): CodeFixAction[] | undefined;
  fixIds?: readonly string[];
}

export function registerCodeFix(reg: CodeFixRegistration): void {
  codeFixes.push(reg);
}
