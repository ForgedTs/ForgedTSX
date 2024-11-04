import {
  FileTextChanges,
  findAncestor,
  isJsxAttribute,
  isJsxOpeningLikeElement,
  SyntaxKind,
  type CodeFixAction,
  Node,
  type SourceFile,
  factory,
  isFunctionDeclaration,
  isIdentifier,
  isJsxExpression,
  isStringLiteral,
  isTypeAliasDeclaration,
  isTypeLiteralNode,
  isTypeReferenceNode,
  type FunctionDeclaration,
  type JsxAttribute,
  type JsxOpeningLikeElement,
  type Program,
  type TypeChecker,
  type TypeLiteralNode,
  type TypeNode,
  createPrinter,
  createTextSpanFromBounds,
  EmitHint,
} from "typescript/lib/tsserverlibrary";
import { registerCodeFix } from "./codeFixProvider";
import { createTextChange, getNodeAtPosition } from "../utils";
const fixId = "addMissingProperty";

const errorCodes = [
  2339, // Diagnostics.Property_0_does_not_exist_on_type_1.code,
  2322, // Diagnostics.Type_0_is_not_assignable_to_type_1.code,
];

registerCodeFix({
  fixIds: [fixId],
  errorCodes,
  getCodeActions(context: any): CodeFixAction[] | undefined {
    const { sourceFile, span, program } = context;

    // Find the token at error position
    const token = getNodeAtPosition(sourceFile, span.start, true);

    // Check if the token is within a JSX attribute
    const attribute = findAncestor(token, isJsxAttribute);
    if (!attribute) {
      return undefined;
    }

    // Check if the JSX attribute is within a JSX opening element
    const jsxElement = findAncestor(attribute, isJsxOpeningLikeElement);
    if (!jsxElement) {
      return undefined;
    }

    // If JSX element in one of IntrinsicElements like `div`, `span`, etc. then return
    const tagName = jsxElement.tagName.getText();
    if (tagName === tagName.toLowerCase()) {
      return undefined;
    }

    // Offer the code fix without filtering by tag name
    const propName = attribute.name.getText();
    const componentName = jsxElement.tagName.getText();

    const changes = addMissingPropertyToProps(
      sourceFile,
      program,
      jsxElement,
      propName
    );

    return [
      {
        fixId,
        fixName: `Add missing property '${propName}'`,
        description: `Add '${propName}' to ${componentName} props`,
        changes,
      },
    ];
  },
});

function inferPropertyType(attribute: JsxAttribute, checker: TypeChecker) {
  const initializer = attribute.initializer;

  // Handle boolean props with no initializer (e.g., <Component prop />)
  if (!initializer) {
    return factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword);
  }

  // Handle string literals (e.g., <Component prop="hello" />)
  if (isStringLiteral(initializer)) {
    return factory.createKeywordTypeNode(SyntaxKind.StringKeyword);
  }

  // Handle JSX expressions (e.g., <Component prop={value} />)
  if (isJsxExpression(initializer) && initializer.expression) {
    const type = checker.getTypeAtLocation(initializer.expression);
    // Widen literal types to their base types
    const widened = checker.getBaseTypeOfLiteralType(type);
    return (
      checker.typeToTypeNode(
        widened,
        /*enclosingDeclaration*/ undefined,
        /*flags*/ undefined
      ) || factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
    );
  }

  return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
}

function createPropertySignature(propName: string, typeNode: TypeNode) {
  return factory.createPropertySignature(
    /*modifiers*/ undefined,
    factory.createIdentifier(propName),
    /*questionToken*/ undefined,
    typeNode
  );
}

function getTextChangesForNode(
  sourceFile: SourceFile,
  node: Node,
  newNode: Node
): FileTextChanges {
  const printer = createPrinter({ removeComments: false });
  const newText = printer.printNode(EmitHint.Unspecified, newNode, sourceFile);

  return {
    fileName: sourceFile.fileName,
    textChanges: [
      createTextChange(
        createTextSpanFromBounds(node.getStart(), node.getEnd()),
        newText
      ),
    ],
  };
}

function insertNodeBefore(
  sourceFile: SourceFile,
  before: Node,
  newNode: Node,
  addNewLine = false
): FileTextChanges {
  const printer = createPrinter({ removeComments: false });
  const newText =
    printer.printNode(EmitHint.Unspecified, newNode, sourceFile) +
    (addNewLine ? "\n\n" : "");

  return {
    fileName: sourceFile.fileName,
    textChanges: [
      createTextChange(
        createTextSpanFromBounds(before.getStart(), before.getStart()),
        newText
      ),
    ],
  };
}

function addPropertyToType(
  sourceFile: SourceFile,
  typeLiteral: TypeLiteralNode,
  propName: string,
  typeNode: TypeNode
): FileTextChanges {
  const members = typeLiteral.members;
  const insertPos = members.length
    ? members[members.length - 1].end
    : typeLiteral.members.pos;

  // Check if the last character is already a semicolon
  const lastChar = sourceFile.text[insertPos - 1];
  const needsSemicolon = lastChar !== ";";

  const prefix = members.length ? "\n  " : "  ";
  const printer = createPrinter({ removeComments: false });
  const propertySignature = createPropertySignature(propName, typeNode);
  const newText =
    prefix +
    printer.printNode(EmitHint.Unspecified, propertySignature, sourceFile) +
    (needsSemicolon ? ";" : "");

  return {
    fileName: sourceFile.fileName,
    textChanges: [
      createTextChange(createTextSpanFromBounds(insertPos, insertPos), newText),
    ],
  };
}

function addMissingPropertyToProps(
  sourceFile: SourceFile,
  program: Program,
  jsxElement: JsxOpeningLikeElement,
  propName: string
): FileTextChanges[] {
  const changes: FileTextChanges[] = [];
  const checker = program.getTypeChecker();
  const componentSymbol = checker.getSymbolAtLocation(jsxElement.tagName);
  if (!componentSymbol?.declarations?.length) {
    return changes;
  }

  const componentDecl = componentSymbol.declarations[0];
  if (!isFunctionDeclaration(componentDecl)) {
    return changes;
  }

  const attribute = jsxElement.attributes.properties.find(
    (p): p is JsxAttribute => isJsxAttribute(p) && p.name.getText() === propName
  );
  if (!attribute) {
    return changes;
  }

  const propertyType = inferPropertyType(attribute, checker);

  const propsTypeDecl = getExistingPropsTypeDeclaration(checker, componentDecl);
  if (propsTypeDecl) {
    changes.push(
      addPropertyToType(
        sourceFile,
        propsTypeDecl.type as TypeLiteralNode,
        propName,
        propertyType
      )
    );
    return changes;
  }

  // If no existing props type, create new one with inferred type
  const propsTypeName = `${componentSymbol.name}Props`;
  const propsType = createPropsTypeDeclaration(
    propsTypeName,
    propName,
    propertyType
  );
  const updatedComponent = createUpdatedComponent(
    componentDecl,
    propsTypeName,
    propName
  );

  // Insert type and update component
  changes.push(
    insertNodeBefore(sourceFile, componentDecl, propsType, /*addNewLine*/ true),
    getTextChangesForNode(sourceFile, componentDecl, updatedComponent)
  );

  return changes;
}

function getExistingPropsTypeDeclaration(
  checker: TypeChecker,
  componentDecl: FunctionDeclaration
) {
  const propsParam = componentDecl.parameters[0];
  if (
    !propsParam?.type ||
    !isTypeReferenceNode(propsParam.type) ||
    !isIdentifier(propsParam.type.typeName)
  ) {
    return undefined;
  }

  const propsTypeSymbol = checker.getSymbolAtLocation(propsParam.type.typeName);
  const propsTypeDecl = propsTypeSymbol?.declarations?.[0];

  return propsTypeDecl &&
    isTypeAliasDeclaration(propsTypeDecl) &&
    isTypeLiteralNode(propsTypeDecl.type)
    ? propsTypeDecl
    : undefined;
}

function createPropsTypeDeclaration(
  typeName: string,
  propName: string,
  typeNode: TypeNode
) {
  return factory.createTypeAliasDeclaration(
    /*modifiers*/ undefined,
    factory.createIdentifier(typeName),
    /*typeParameters*/ undefined,
    factory.createTypeLiteralNode([createPropertySignature(propName, typeNode)])
  );
}

function createUpdatedComponent(
  componentDecl: FunctionDeclaration,
  propsTypeName: string,
  propName: string
) {
  return factory.updateFunctionDeclaration(
    componentDecl,
    componentDecl.modifiers,
    componentDecl.asteriskToken,
    componentDecl.name,
    componentDecl.typeParameters,
    [createPropsParameter(propsTypeName, propName)],
    componentDecl.type,
    componentDecl.body
  );
}

function createPropsParameter(propsTypeName: string, propName: string) {
  return factory.createParameterDeclaration(
    /*modifiers*/ undefined,
    /*dotDotDotToken*/ undefined,
    factory.createObjectBindingPattern([
      factory.createBindingElement(
        /*dotDotDotToken*/ undefined,
        /*propertyName*/ undefined,
        factory.createIdentifier(propName),
        /*initializer*/ undefined
      ),
    ]),
    /*questionToken*/ undefined,
    factory.createTypeReferenceNode(propsTypeName, /*typeArguments*/ undefined),
    /*initializer*/ undefined
  );
}
