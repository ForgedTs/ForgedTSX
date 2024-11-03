import * as ts from "typescript/lib/tsserverlibrary";
import "./services/refactors";
declare function init(modules: {
    typescript: typeof import("typescript/lib/tsserverlibrary");
}): {
    create: (info: ts.server.PluginCreateInfo) => ts.LanguageService;
};
export = init;
