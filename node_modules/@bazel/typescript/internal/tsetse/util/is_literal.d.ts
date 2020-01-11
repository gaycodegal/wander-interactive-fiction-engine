import * as ts from 'typescript';
/**
 * Determines if the given ts.Node is literal enough for security purposes. This
 * is true when the value is built from compile-time constants, with a certain
 * tolerance for indirection in order to make this more user-friendly.
 *
 * This considers a few different things. We accept
 * - What TS deems literal (literal strings, literal numbers, literal booleans,
 *   enum literals),
 * - Binary operations of two expressions that we accept (including
 *   concatenation),
 * - Template interpolations of what we accept,
 * - `x?y:z` constructions, if we accept `y` and `z`
 * - Variables that are const, and initialized with an expression we accept
 *
 * And to prevent bypasses, expressions that include casts are not accepted, and
 * this checker does not follow imports.
 */
export declare function isLiteral(typeChecker: ts.TypeChecker, node: ts.Node): boolean;
