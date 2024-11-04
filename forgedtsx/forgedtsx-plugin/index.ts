import * as ts from "typescript/lib/tsserverlibrary";
import "./services/refactors";
import "./services/codefixes";
import { refactors } from "./services/refactors/refactorsProvider";
import { codeFixes } from "./services/codefixes/codeFixProvider";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  function create(info: ts.server.PluginCreateInfo) {
    // Diagnostic logging
    info.project.projectService.logger.info(
      "New refactors are getting registered"
    );

    // Set up decorator object
    const proxy: ts.LanguageService = Object.create(null);
    for (let k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    // Add refactoring support
    proxy.getApplicableRefactors = (
      fileName,
      positionOrRange,
      preferences,
      triggerReason,
      kind
    ) => {
      const prior =
        info.languageService.getApplicableRefactors(
          fileName,
          positionOrRange,
          preferences,
          triggerReason,
          kind
        ) || [];

      const context = {
        file: info.languageService.getProgram()!.getSourceFile(fileName)!,
        program: info.languageService.getProgram()!,
        startPosition:
          typeof positionOrRange === "number"
            ? positionOrRange
            : positionOrRange.pos,
        preferences: preferences || {},
      };

      const refactorResults: ts.ApplicableRefactorInfo[] = [];
      for (const [_, refactor] of refactors) {
        refactorResults.push(...refactor.getAvailableActions(context));
      }

      return [...prior, ...refactorResults];
    };

    proxy.getEditsForRefactor = (
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences
    ) => {
      const context = {
        file: info.languageService.getProgram()!.getSourceFile(fileName)!,
        program: info.languageService.getProgram()!,
        startPosition:
          typeof positionOrRange === "number"
            ? positionOrRange
            : positionOrRange.pos,
        preferences: preferences || {},
      };

      const refactor = refactors.get(refactorName);
      if (refactor) {
        return refactor.getEditsForAction(context, actionName);
      }

      return info.languageService.getEditsForRefactor(
        fileName,
        formatOptions,
        positionOrRange,
        refactorName,
        actionName,
        preferences
      );
    };

    proxy.getCodeFixesAtPosition = (
      fileName,
      start,
      end,
      errorCodes,
      formatOptions,
      preferences
    ) => {
      info.project.projectService.logger.info(
        "Here comes the augementation of the codefixes"
      );
      const prior = info.languageService.getCodeFixesAtPosition(
        fileName,
        start,
        end,
        errorCodes,
        formatOptions,
        preferences
      );

      const context = {
        sourceFile: info.languageService.getProgram()!.getSourceFile(fileName)!,
        program: info.languageService.getProgram()!,
        startPosition: start,
        endPosition: end,
        preferences: preferences || {},
        span: { start, length: end - start },
      };

      const codeFixResults: ts.CodeFixAction[] = [];
      info.project.projectService.logger.info(
        `checking codefixes length ${codeFixes.length}`
      );

      for (const codeFix of codeFixes) {
        if (codeFix.errorCodes.some((code) => errorCodes.includes(code))) {
          const actions = codeFix.getCodeActions(context);
          if (actions) {
            info.project.projectService.logger.info("pushing codefix actions");
            codeFixResults.push(...actions);
          }
        }
      }

      return [...prior, ...codeFixResults];
    };

    return proxy;
  }

  return { create };
}

export = init;
