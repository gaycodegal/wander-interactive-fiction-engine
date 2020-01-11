/**
 * @fileoverview extensions to TypeScript functionality around error handling
 * (ts.Diagnostics).
 */
import * as ts from 'typescript';
import { BazelOptions } from './tsconfig';
/**
 * If the current compilation was a compilation test expecting certain
 * diagnostics, filter out the expected diagnostics, and add new diagnostics
 * (aka errors) for non-matched diagnostics.
 */
export declare function filterExpected(bazelOpts: BazelOptions, diagnostics: ts.Diagnostic[], formatFn?: typeof uglyFormat): ts.Diagnostic[];
/**
 * Formats the given diagnostics, without pretty printing.  Without colors, it's
 * better for matching against programmatically.
 * @param target The bazel target, e.g. //my/package:target
 */
export declare function uglyFormat(target: string, diagnostics: ReadonlyArray<ts.Diagnostic>): string;
/**
 * Pretty formats the given diagnostics (matching the --pretty tsc flag).
 * @param target The bazel target, e.g. //my/package:target
 */
export declare function format(target: string, diagnostics: ReadonlyArray<ts.Diagnostic>): string;
