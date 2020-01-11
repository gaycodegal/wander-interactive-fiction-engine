/**
 * @fileoverview utilities to construct a static graph representation of the
 * import graph discovered in typescript inputs.
 */
import * as tsickle from 'tsickle';
/**
 * Create the contents of the .es5.MF file which propagates partial ordering of
 * the import graph to later actions.
 * Each line in the resulting text corresponds with a workspace-relative file
 * path, and the lines are ordered to match the expected load order in a
 * browser.
 */
export declare function constructManifest(modulesManifest: tsickle.ModulesManifest, host: {
    relativeOutputPath: (f: string) => string;
}): string;
