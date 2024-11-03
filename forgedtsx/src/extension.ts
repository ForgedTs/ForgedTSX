import * as vscode from "vscode";
import { addTsServerPlugin } from "./addTSServerPlugin";

export function activate(context: vscode.ExtensionContext) {
  addTsServerPlugin();
  const disposable = vscode.commands.registerCommand(
    "forgedtsx.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user

      vscode.window.showInformationMessage("Hello World from ForgedTSX!");
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
