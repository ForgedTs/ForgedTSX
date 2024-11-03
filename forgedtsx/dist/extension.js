"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// forgedtsx-plugin/dist/index.js
var require_dist = __commonJS({
  "forgedtsx-plugin/dist/index.js"(exports2, module2) {
    "use strict";
    function init(modules) {
      function create(info) {
        const whatToRemove = info.config.remove || ["caller"];
        info.project.projectService.logger.info("I'm getting set up now! Check the log for this message.");
        const proxy = /* @__PURE__ */ Object.create(null);
        for (let k of Object.keys(info.languageService)) {
          const x = info.languageService[k];
          proxy[k] = (...args) => x.apply(info.languageService, args);
        }
        proxy.getCompletionsAtPosition = (fileName, position, options) => {
          info.project.projectService.logger.info(`Info from plugin`);
          const prior = info.languageService.getCompletionsAtPosition(fileName, position, options);
          if (!prior) {
            return;
          }
          const oldLength = prior.entries.length;
          prior.entries = prior.entries.filter((e) => whatToRemove.indexOf(e.name) < 0);
          if (oldLength !== prior.entries.length) {
            const entriesRemoved = oldLength - prior.entries.length;
            info.project.projectService.logger.info(`Removed ${entriesRemoved} entries from the completion list`);
          }
          return prior;
        };
        return proxy;
      }
      return { create };
    }
    module2.exports = init;
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/addTSServerPlugin.ts
var vscode = __toESM(require("vscode"));

// src/constants.ts
var typeScriptExtensionId = "vscode.typescript-language-features";

// src/addTSServerPlugin.ts
async function addTsServerPlugin() {
  const extension = vscode.extensions.getExtension(typeScriptExtensionId);
  if (!extension) {
    return void 0;
  }
  await extension.activate();
  if (!extension.exports || !extension.exports.getAPI) {
    return;
  }
  const api = extension.exports.getAPI(0);
  if (!api) {
    return void 0;
  }
  try {
    vscode.window.showInformationMessage("We are activating the plugin!");
    const plugin = await Promise.resolve().then(() => __toESM(require_dist()));
    api.configurePlugin("forgedtsx-plugin", {});
  } catch (e) {
    console.error(e);
  }
}

// src/extension.ts
function activate(context) {
  addTsServerPlugin();
  const disposable = vscode2.commands.registerCommand(
    "forgedtsx.helloWorld",
    () => {
      vscode2.window.showInformationMessage("Hello World from ForgedTSX!");
    }
  );
  context.subscriptions.push(disposable);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
