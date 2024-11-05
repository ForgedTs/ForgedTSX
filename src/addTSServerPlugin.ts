import * as vscode from "vscode";
import { typeScriptExtensionId } from "./constants";

declare class ApiV0 {
  configurePlugin(pluginId: string, configuration: unknown): void;
}
interface Api {
  getAPI(version: 0): ApiV0 | undefined;
}

export async function addTsServerPlugin() {
  const extension = vscode.extensions.getExtension<Api>(typeScriptExtensionId);

  if (!extension) {
    return undefined;
  }

  await extension.activate();

  if (!extension.exports || !extension.exports.getAPI) {
    return;
  }

  const api = extension.exports.getAPI(0);

  if (!api) {
    return undefined;
  }

  try {
    api.configurePlugin("forgedtsx-plugin", {});
  } catch (e) {
    console.error(e);
  }
}
