# forgedtsx README

ForgedTSX is a Visual Studio Code extension designed to enhance the development experience for TypeScript and JSX files. It provides a suite of tools and features to improve productivity and code quality.

## Features

- **Syntax Highlighting**: Enhanced syntax highlighting for TypeScript and JSX.
- **Code Snippets**: Useful code snippets for common TypeScript and JSX patterns.
- **Linting and Formatting**: Integrated linting and formatting tools to keep your code clean and consistent.
- **IntelliSense**: Improved IntelliSense for TypeScript and JSX, providing better code completion and navigation.
- **Refactoring Tools**: Tools to easily refactor your TypeScript and JSX code.

\!\[Syntax Highlighting\]\(images/syntax-highlighting.png\)
\!\[Code Snippets\]\(images/code-snippets.png\)

> Tip: Utilize animations to demonstrate the features of your extension! Short, focused animations are easy to follow and effective.

## Requirements

- Visual Studio Code v1.50.0 or higher
- Node.js v12 or higher

## Extension Settings

This extension contributes the following settings:

- `forgedtsx.enable`: Enable/disable this extension.
- `forgedtsx.lintOnSave`: Enable/disable linting on save.
- `forgedtsx.formatOnSave`: Enable/disable formatting on save.

## Known Issues

- Linting may not work correctly with certain TypeScript configurations.
- Some code snippets may not trigger IntelliSense correctly.

## Release Notes

### 1.0.0

Initial release of ForgedTSX with basic features including syntax highlighting, code snippets, linting, and formatting.

### 1.1.0

Added IntelliSense improvements and refactoring tools.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

## Cool thing for future

- Add support for event handlers refactor
- React outline with just a component outline
  - Add support for context what context does the component have access to.
  - Add support for react-query like context so user get some sense of what query-keys are in place.
  - Basically bring the context to your component  
