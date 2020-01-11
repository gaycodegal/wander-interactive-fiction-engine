/**
 * @fileoverview This is a collection of smaller utility functions to operate on
 * a TypeScript AST, used by JSConformance rules and elsewhere.
 */
import * as ts from 'typescript';
/**
 * Turns on or off logging for ConformancePatternRules.
 */
export declare function setDebug(state: boolean): void;
/**
 * Debug helper.
 */
export declare function debugLog(msg: string): void;
/**
 * Returns `n`'s parents in order.
 */
export declare function parents(n: ts.Node): ts.Node[];
/**
 * Searches for something satisfying the given test in `n` or its children.
 */
export declare function findInChildren(n: ts.Node, test: (n: ts.Node) => boolean): boolean;
/**
 * Returns true if the pattern-based Rule should look at that node and consider
 * warning there. The goal is to make it easy to exclude on source files,
 * blocks, module declarations, JSDoc, lib.d.ts nodes, that kind of things.
 */
export declare function shouldExamineNode(n: ts.Node): boolean;
/**
 * Return whether the given declaration is ambient.
 */
export declare function isAmbientDeclaration(d: ts.Declaration): boolean;
/**
 * Return whether the given Node is (or is in) a library included as default.
 * We currently look for a node_modules/typescript/ prefix, but this could
 * be expanded if needed.
 */
export declare function isInStockLibraries(n: ts.Node | ts.SourceFile): boolean;
/**
 * Turns the given Symbol into its non-aliased version (which could be itself).
 * Returns undefined if given an undefined Symbol (so you can call
 * `dealias(typeChecker.getSymbolAtLocation(node))`).
 */
export declare function dealias(symbol: ts.Symbol | undefined, tc: ts.TypeChecker): ts.Symbol | undefined;
/**
 * Returns whether `n`'s parents are something indicating a type.
 */
export declare function isPartOfTypeDeclaration(n: ts.Node): boolean;
/**
 * Returns whether `n` is under an import statement.
 */
export declare function isPartOfImportStatement(n: ts.Node): boolean;
/**
 * Returns whether `n` is a declaration.
 */
export declare function isDeclaration(n: ts.Node): n is ts.VariableDeclaration | ts.ClassDeclaration | ts.FunctionDeclaration | ts.MethodDeclaration | ts.PropertyDeclaration | ts.VariableDeclarationList | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration | ts.ModuleDeclaration | ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration | ts.MissingDeclaration;
/** Type guard for expressions that looks like property writes. */
export declare function isPropertyWriteExpression(node: ts.Node): node is (ts.BinaryExpression & {
    left: ts.PropertyAccessExpression;
});
/**
 * If verbose, logs the given error that happened while walking n, with a
 * stacktrace.
 */
export declare function logASTWalkError(verbose: boolean, n: ts.Node, e: Error): void;
