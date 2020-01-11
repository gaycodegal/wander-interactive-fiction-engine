import * as ts from 'typescript';
/**
 * A Tsetse check Failure is almost identical to a Diagnostic from TypeScript
 * except that:
 * (1) The error code is defined by each individual Tsetse rule.
 * (2) The optional `source` property is set to `Tsetse` so the host (VS Code
 * for instance) would use that to indicate where the error comes from.
 * (3) There's an optional suggestedFix field.
 */
export declare class Failure {
    private readonly sourceFile;
    private readonly start;
    private readonly end;
    private readonly failureText;
    private readonly code;
    private readonly suggestedFix?;
    constructor(sourceFile: ts.SourceFile, start: number, end: number, failureText: string, code: number, suggestedFix?: Fix | undefined);
    /**
     * This returns a structure compatible with ts.Diagnostic, but with added
     * fields, for convenience and to support suggested fixes.
     */
    toDiagnostic(): DiagnosticWithFix;
    /**
     * Same as toDiagnostic, but include the fix in the message, so that systems
     * that don't support displaying suggested fixes can still surface that
     * information. This assumes the diagnostic message is going to be presented
     * within the context of the problematic code
     */
    toDiagnosticWithStringifiedFix(): DiagnosticWithFix;
    toString(): string;
    /**
     * Stringifies a `Fix`, in a way that makes sense when presented alongside the
     * finding. This is a heuristic, obviously.
     */
    fixToReadableStringInContext(): string;
    readableRange(from: number, to: number): string;
}
/**
 * A `Fix` is a potential repair to the associated `Failure`.
 */
export interface Fix {
    /**
     * The individual text replacements composing that fix.
     */
    changes: IndividualChange[];
}
/**
 * An individual text replacement/insertion in a source file. Used as part of a
 * `Fix`.
 */
export interface IndividualChange {
    sourceFile: ts.SourceFile;
    start: number;
    end: number;
    replacement: string;
}
/**
 * A ts.Diagnostic that might include a `Fix`, and with an added `end` field for
 * convenience.
 */
export interface DiagnosticWithFix extends ts.Diagnostic {
    end: number;
    fix?: Fix;
}
/**
 * Stringifies a `Fix`, replacing the `ts.SourceFile` with the matching
 * filename.
 */
export declare function fixToString(f?: Fix): string;
