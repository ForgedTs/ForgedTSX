import {
  type SourceFile,
  type Node,
  SyntaxKind,
  type TextChange,
  type TextSpan,
} from "typescript/lib/tsserverlibrary";

export function getNodeAtPosition(
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

export function createTextChange(span: TextSpan, newText: string): TextChange {
    return { span, newText };
}