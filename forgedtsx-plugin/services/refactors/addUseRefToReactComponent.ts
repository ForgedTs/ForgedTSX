import {
  ApplicableRefactorInfo,
  findAncestor,
  isBlock,
  isFunctionLike,
  isIdentifier,
  isJsxClosingElement,
  isJsxOpeningElement,
  isJsxSelfClosingElement,
  type FileTextChanges,
  type RefactorEditInfo,
  type SourceFile,
  type TypeChecker,
  Node,
  SyntaxKind,
} from "typescript";
import { registerRefactor } from "./refactorsProvider";
import type { RefactorContext } from "./types";

const emptyArray: readonly any[] = [];
const refactorName = "Add React useRef to Component";

const refactorDescription = "Add React useRef to Component";

const useRefAction = {
  name: refactorName,
  description: refactorDescription,
  kind: "refactor.react.addUseRef",
};

registerRefactor(refactorName, {
  kinds: [useRefAction.kind],
  getAvailableActions: getRefactorActionsToAddUseRef,
  getEditsForAction: getRefactorEditsToAddUseRef,
});

function getRefactorEditsToAddUseRef(
  context: RefactorContext
): RefactorEditInfo | undefined {
  const { file, startPosition } = context;
  const sourceFile = context.program.getSourceFile(file.fileName);
  if (!sourceFile) {
    return;
  }

  const node = getNodeAtPosition(
    sourceFile,
    startPosition,
    /*includeJSDoc*/ false
  );

  if (!node) {
    return;
  }

  // Find the JSX element whether we're on the identifier or element itself
  const jsxElement = isIdentifier(node)
    ? findAncestor(
        node,
        (n) =>
          isJsxOpeningElement(n) ||
          isJsxClosingElement(n) ||
          isJsxSelfClosingElement(n)
      )
    : node;

  if (
    !jsxElement ||
    (!isJsxOpeningElement(jsxElement) &&
      !isJsxClosingElement(jsxElement) &&
      !isJsxSelfClosingElement(jsxElement))
  ) {
    return;
  }

  const functionNode = findAncestor(jsxElement, isFunctionLike);
  if (!functionNode) {
    return;
  }

  const edits: FileTextChanges[] = [];

  // Add useRef hook at the beginning of the function body
  const elementType = getJsxElementType(
    jsxElement,
    context.program.getTypeChecker()
  );
  const useRefHook = `const ref = useRef<${elementType} | null>(null);`;

  if (!functionNode || !("body" in functionNode)) {
    return;
  }

  const functionBody = functionNode.body;
  if (functionBody && isBlock(functionBody)) {
    const functionBodyStart = functionBody.getStart() + 1; // +1 to insert inside the block

    edits.push({
      fileName: file.fileName,
      textChanges: [
        {
          span: { start: functionBodyStart, length: 0 },
          newText: `\n${useRefHook}\n`,
        },
      ],
    });
  }

  // Add ref attribute to the JSX element
  const jsxElementStart = jsxElement.getStart();
  const jsxElementEnd = jsxElement.getEnd();
  const jsxElementText = jsxElement.getText();
  const refAttribute = ` ref={ref}`;
  const modifiedJsxElementText = jsxElementText.replace(
    /<(\w+)/,
    `<$1${refAttribute}`
  );

  edits.push({
    fileName: file.fileName,
    textChanges: [
      {
        span: {
          start: jsxElementStart,
          length: jsxElementEnd - jsxElementStart,
        },
        newText: modifiedJsxElementText,
      },
    ],
  });

  return { edits };
}

function getJsxElementType(node: Node, checker: TypeChecker): string {
  if (isJsxOpeningElement(node) || isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText();
    const symbol = checker.getSymbolAtLocation(node.tagName);
    if (symbol) {
      const type = checker.getTypeOfSymbolAtLocation(symbol, node);
      const typeName = checker.typeToString(type);

      // Extract the underlying HTML element type
      const match = typeName.match(/HTMLAttributes<(\w+)>/);
      if (match) {
        return match[1];
      }

      return typeName;
    }
    return tagName.charAt(0).toUpperCase() + tagName.slice(1);
  }
  return "HTMLElement";
}

function getRefactorActionsToAddUseRef(
  context: RefactorContext
): readonly ApplicableRefactorInfo[] {
  const { file, startPosition } = context;
  if (isSourceFileJS(file)) {
    return emptyArray;
  }

  const node = getNodeAtPosition(file, startPosition, /*includeJSDoc*/ false);
  if (!node) {
    return emptyArray;
  }

  // Check if we're on a JSX element or identifier
  const jsxElement = isIdentifier(node)
    ? findAncestor(
        node,
        (n) =>
          isJsxOpeningElement(n) ||
          isJsxClosingElement(n) ||
          isJsxSelfClosingElement(n)
      )
    : node;

  if (
    !jsxElement ||
    (!isJsxOpeningElement(jsxElement) &&
      !isJsxClosingElement(jsxElement) &&
      !isJsxSelfClosingElement(jsxElement))
  ) {
    return emptyArray;
  }

  return [
    {
      name: refactorName,
      description: refactorDescription,
      actions: [
        {
          name: refactorName,
          description: refactorDescription,
          kind: "refactor.rewrite",
          notApplicableReason: undefined,
          isInteractive: true,
        },
      ],
    },
  ];
}

function isSourceFileJS(file: SourceFile) {
  return file.fileName.endsWith(".js") || file.fileName.endsWith(".jsx");
}
function getNodeAtPosition(
  sourceFile: SourceFile,
  startPosition: number,
  includeJSDoc: boolean
): Node | undefined {
  function find(node: Node): Node | undefined {
    if (node.getStart() <= startPosition && node.getEnd() >= startPosition) {
      return node.forEachChild(find) || node;
    }
    return undefined;
  }

  const node = find(sourceFile);
  if (!includeJSDoc && node && node.kind === SyntaxKind.JSDocComment) {
    return undefined;
  }
  return node;
}
