"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
