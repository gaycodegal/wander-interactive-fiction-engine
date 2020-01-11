/**
 * @fileoverview Runner is the entry point of running Tsetse checks in compiler.
 */
import * as ts from 'typescript';
import * as pluginApi from '../tsc_wrapped/plugin_api';
import { Checker } from './checker';
/**
 * The Tsetse check plugin performs compile-time static analysis for TypeScript
 * code.
 */
export declare class Plugin implements pluginApi.DiagnosticPlugin {
    readonly name = "tsetse";
    private readonly checker;
    constructor(program: ts.Program, disabledTsetseRules?: string[]);
    getDiagnostics(sourceFile: ts.SourceFile): import("./failure").DiagnosticWithFix[];
}
export declare function registerRules(checker: Checker, disabledTsetseRules: string[]): void;
