import * as ts from 'typescript';
import { Fix, IndividualChange } from '../failure';
/**
 * A Fixer turns Nodes (that are supposed to have been matched before) into a
 * Fix. This is meant to be implemented by Rule implementers (or
 * ban-preset-pattern users). See also `buildReplacementFixer` for a simpler way
 * of implementing a Fixer.
 */
export interface Fixer {
    getFixForFlaggedNode(node: ts.Node): Fix | undefined;
}
/**
 * A simple Fixer builder based on a function that looks at a node, and
 * output either nothing, or a replacement. If this is too limiting, implement
 * Fixer instead.
 */
export declare function buildReplacementFixer(potentialReplacementGenerator: (node: ts.Node) => ({
    replaceWith: string;
} | undefined)): Fixer;
/**
 * Builds an IndividualChange that imports the required symbol from the given
 * file under the given name. This might reimport the same thing twice in some
 * cases, but it will always make it available under the right name (though
 * its name might collide with other imports, as we don't currently check for
 * that).
 */
export declare function maybeAddNamedImport(source: ts.SourceFile, importWhat: string, fromFile: string, importAs?: string, tazeComment?: string): IndividualChange | undefined;
/**
 * Builds an IndividualChange that imports the required namespace from the given
 * file under the given name. This might reimport the same thing twice in some
 * cases, but it will always make it available under the right name (though
 * its name might collide with other imports, as we don't currently check for
 * that).
 */
export declare function maybeAddNamespaceImport(source: ts.SourceFile, fromFile: string, importAs: string, tazeComment?: string): IndividualChange | undefined;
