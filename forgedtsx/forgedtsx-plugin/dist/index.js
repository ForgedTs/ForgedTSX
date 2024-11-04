"use strict";
require("./services/refactors");
require("./services/codefixes");
const refactorsProvider_1 = require("./services/refactors/refactorsProvider");
const codeFixProvider_1 = require("./services/codefixes/codeFixProvider");
function init(modules) {
    function create(info) {
        // Diagnostic logging
        info.project.projectService.logger.info("New refactors are getting registered");
        // Set up decorator object
        const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            // @ts-expect-error - JS runtime trickery which is tricky to type tersely
            proxy[k] = (...args) => x.apply(info.languageService, args);
        }
        // Add refactoring support
        proxy.getApplicableRefactors = (fileName, positionOrRange, preferences, triggerReason, kind) => {
            const prior = info.languageService.getApplicableRefactors(fileName, positionOrRange, preferences, triggerReason, kind) || [];
            const context = {
                file: info.languageService.getProgram().getSourceFile(fileName),
                program: info.languageService.getProgram(),
                startPosition: typeof positionOrRange === "number"
                    ? positionOrRange
                    : positionOrRange.pos,
                preferences: preferences || {},
            };
            const refactorResults = [];
            for (const [_, refactor] of refactorsProvider_1.refactors) {
                refactorResults.push(...refactor.getAvailableActions(context));
            }
            return [...prior, ...refactorResults];
        };
        proxy.getEditsForRefactor = (fileName, formatOptions, positionOrRange, refactorName, actionName, preferences) => {
            const context = {
                file: info.languageService.getProgram().getSourceFile(fileName),
                program: info.languageService.getProgram(),
                startPosition: typeof positionOrRange === "number"
                    ? positionOrRange
                    : positionOrRange.pos,
                preferences: preferences || {},
            };
            const refactor = refactorsProvider_1.refactors.get(refactorName);
            if (refactor) {
                return refactor.getEditsForAction(context, actionName);
            }
            return info.languageService.getEditsForRefactor(fileName, formatOptions, positionOrRange, refactorName, actionName, preferences);
        };
        proxy.getCodeFixesAtPosition = (fileName, start, end, errorCodes, formatOptions, preferences) => {
            info.project.projectService.logger.info("Here comes the augementation of the codefixes");
            const prior = info.languageService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences);
            const context = {
                sourceFile: info.languageService.getProgram().getSourceFile(fileName),
                program: info.languageService.getProgram(),
                startPosition: start,
                endPosition: end,
                preferences: preferences || {},
                span: { start, length: end - start },
            };
            const codeFixResults = [];
            info.project.projectService.logger.info(`checking codefixes length ${codeFixProvider_1.codeFixes.length}`);
            for (const codeFix of codeFixProvider_1.codeFixes) {
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
module.exports = init;
