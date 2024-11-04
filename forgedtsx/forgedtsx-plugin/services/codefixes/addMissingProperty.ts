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
} from "typescript/lib/tsserverlibrary";
import { registerCodeFix } from "./codeFixProvider";
const fixId = "addMissingProperty";
const errorCodes = [
  // Diagnostics.Property_0_does_not_exist_on_type_1.code,
  // Diagnostics.Property_0_does_not_exist_on_type_1_Did_you_mean_2.code,
  // Diagnostics.Type_0_is_not_assignable_to_type_1.code,
  2339, 2322,
];
registerCodeFix({
  fixIds: [fixId],
  errorCodes,
  getCodeActions(context: any): CodeFixAction[] | undefined {
    const { sourceFile, span } = context;

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

    const changes = ChangeTracker.with(context, (tracker) => {
      // Call the new helper function to add the missing property
      addMissingPropertyToProps(
        tracker,
        program,
        sourceFile,
        jsxElement,
        propName
      );
    });

    return [
      {
        fixId,
        fixName: `Add missing property '${propName}'`,
        description: `Add '${propName}' to ${componentName} props`,
        changes: [],
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

// Update the addMissingPropertyToProps function to include type inference
function addMissingPropertyToProps(
  tracker: textChanges.ChangeTracker,
  program: Program,
  sourceFile: SourceFile,
  jsxElement: JsxOpeningLikeElement,
  propName: string
) {
  const checker = program.getTypeChecker();
  const componentSymbol = checker.getSymbolAtLocation(jsxElement.tagName);
  if (!componentSymbol?.declarations?.length) {
    return;
  }

  const componentDecl = componentSymbol.declarations[0];
  if (!isFunctionDeclaration(componentDecl)) {
    return;
  }

  // Find the attribute to infer its type
  const attribute = jsxElement.attributes.properties.find(
    (p): p is JsxAttribute => isJsxAttribute(p) && p.name.getText() === propName
  );
  if (!attribute) {
    return;
  }

  const propertyType = inferPropertyType(attribute, checker);

  // Try to add to existing props type first with inferred type
  if (
    tryAddToExistingPropsType(
      tracker,
      sourceFile,
      checker,
      componentDecl,
      propName,
      propertyType
    )
  ) {
    return;
  }

  // If no existing props type, create new one with inferred type
  createNewPropsTypeAndUpdateComponent(
    tracker,
    sourceFile,
    componentDecl,
    componentSymbol.name,
    propName,
    propertyType
  );
}

function tryAddToExistingPropsType(
  tracker: textChanges.ChangeTracker,
  sourceFile: SourceFile,
  checker: TypeChecker,
  componentDecl: FunctionDeclaration,
  propName: string,
  typeNode: TypeNode
): boolean {
  const propsTypeDecl = getExistingPropsTypeDeclaration(checker, componentDecl);
  if (!propsTypeDecl) {
    return false;
  }

  const typeLiteral = propsTypeDecl.type as TypeLiteralNode;
  const members = typeLiteral.members;
  const insertPosition = getInsertPositionInType(typeLiteral);
  const hasExistingMembers = members.length > 0;

  const newProperty = createPropertySignature(propName, typeNode);

  tracker.insertNodeAt(sourceFile, insertPosition, newProperty, {
    prefix: hasExistingMembers ? "\n  " : "  ",
    suffix: ";",
  });

  return true;
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

function createNewPropsTypeAndUpdateComponent(
  tracker: textChanges.ChangeTracker,
  sourceFile: SourceFile,
  componentDecl: FunctionDeclaration,
  componentName: string,
  propName: string,
  typeNode: TypeNode
) {
  const propsTypeName = `${componentName}Props`;
  const propsType = createPropsTypeDeclaration(
    propsTypeName,
    propName,
    typeNode
  );
  const updatedComponent = createUpdatedComponent(
    componentDecl,
    propsTypeName,
    propName
  );

  // Insert type and update component
  tracker.insertNodeBefore(
    sourceFile,
    componentDecl,
    propsType,
    /*blankLineBetween*/ true
  );
  tracker.replaceNode(sourceFile, componentDecl, updatedComponent);
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

function getInsertPositionInType(typeLiteral: TypeLiteralNode) {
  const members = typeLiteral.members;
  return members.length
    ? members[members.length - 1].end
    : typeLiteral.members.pos;
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
