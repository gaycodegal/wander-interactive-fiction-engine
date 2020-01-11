/**
 * @license
 * Copyright 2017 The Bazel Authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as ts from 'typescript';
/**
 * The configuration block provided by the tsconfig "bazelOptions".
 * Note that all paths here are relative to the rootDir, not absolute nor
 * relative to the location containing the tsconfig file.
 */
export interface BazelOptions {
    /** Name of the bazel workspace where we are building. */
    workspaceName: string;
    /** The full bazel target that is being built, e.g. //my/pkg:library. */
    target: string;
    /** The bazel package, eg my/pkg */
    package: string;
    /** If true, convert require()s into goog.module(). */
    googmodule: boolean;
    /**
     * If true, emit devmode output into filename.js.
     * If false, emit prodmode output into filename.mjs.
     */
    es5Mode: boolean;
    /** If true, convert TypeScript code into a Closure-compatible variant. */
    tsickle: boolean;
    /** If true, generate externs from declarations in d.ts files. */
    tsickleGenerateExterns: boolean;
    /** Write generated externs to the given path. */
    tsickleExternsPath: string;
    /** Paths of declarations whose types must not appear in result .d.ts. */
    typeBlackListPaths: string[];
    /** If true, emit Closure types in TypeScript->JS output. */
    untyped: boolean;
    /** The list of sources we're interested in (emitting and type checking). */
    compilationTargetSrc: string[];
    /** Path to write the module dependency manifest to. */
    manifest: string;
    /**
     * Whether to disable strict deps check. If true the next parameter is
     * ignored.
     */
    disableStrictDeps?: boolean;
    /**
     * Paths of dependencies that are allowed by strict deps, i.e. that may be
     * imported by the source files in compilationTargetSrc.
     */
    allowedStrictDeps: string[];
    /** Write a performance trace to this path. Disabled when falsy. */
    perfTracePath?: string;
    /**
     * An additional prelude to insert after the `goog.module` call,
     * e.g. with additional imports or requires.
     */
    prelude: string;
    /**
     * Name of the current locale if processing a locale-specific file.
     */
    locale?: string;
    /**
     * A list of errors this compilation is expected to generate, in the form
     * "TS1234:regexp". If empty, compilation is expected to succeed.
     */
    expectedDiagnostics: string[];
    /**
     * To support node_module resolution, allow TypeScript to make arbitrary
     * file system access to paths under this prefix.
     */
    nodeModulesPrefix: string;
    /**
     * List of regexes on file paths for which we suppress tsickle's warnings.
     */
    ignoreWarningPaths: string[];
    /**
     * Whether to add aliases to the .d.ts files to add the exports to the
     * ಠ_ಠ.clutz namespace.
     */
    addDtsClutzAliases: true;
    /**
     * Whether to type check inputs that aren't srcs.  Differs from
     * --skipLibCheck, which skips all .d.ts files, even those which are
     * srcs.
     */
    typeCheckDependencies: boolean;
    /**
     * The maximum cache size for bazel outputs, in megabytes.
     */
    maxCacheSizeMb?: number;
    /**
     * Suppress warnings about tsconfig.json properties that are overridden.
     * Currently unused, remains here for backwards compat for users who set it.
     */
    suppressTsconfigOverrideWarnings: boolean;
    /**
     * An explicit name for this module, given by the module_name attribute on a
     * ts_library.
     */
    moduleName?: string;
    /**
     * An explicit entry point for this module, given by the module_root attribute
     * on a ts_library.
     */
    moduleRoot?: string;
    /**
     * If true, indicates that this job is transpiling JS sources. If true, only
     * one file can appear in compilationTargetSrc, and either
     * transpiledJsOutputFileName or the transpiledJs*Directory options must be
     * set.
     */
    isJsTranspilation?: boolean;
    /**
     * The path where the file containing the JS transpiled output should be
     * written. Ignored if isJsTranspilation is false. transpiledJsOutputFileName
     *
     */
    transpiledJsOutputFileName?: string;
    /**
     * The path where transpiled JS output should be written. Ignored if
     * isJsTranspilation is false. Must not be set together with
     * transpiledJsOutputFileName.
     */
    transpiledJsInputDirectory?: string;
    /**
     * The path where transpiled JS output should be written. Ignored if
     * isJsTranspilation is false. Must not be set together with
     * transpiledJsOutputFileName.
     */
    transpiledJsOutputDirectory?: string;
    /**
     * Whether the user provided an implementation shim for .d.ts files in the
     * compilation unit.
     */
    hasImplementation?: boolean;
    /**
     * Enable the Angular ngtsc plugin.
     */
    compileAngularTemplates?: boolean;
    /**
     * Override for ECMAScript target language level to use for devmode.
     *
     * This setting can be set in a user's tsconfig to override the default
     * devmode target.
     *
     * EXPERIMENTAL: This setting is experimental and may be removed in the
     * future.
     */
    devmodeTargetOverride?: string;
}
export interface ParsedTsConfig {
    options: ts.CompilerOptions;
    bazelOpts: BazelOptions;
    angularCompilerOptions?: {
        [k: string]: unknown;
    };
    files: string[];
    disabledTsetseRules: string[];
    config: {};
}
/**
 * The same as Node's path.resolve, however it returns a path with forward
 * slashes rather than joining the resolved path with the platform's path
 * separator.
 * Note that even path.posix.resolve('.') returns C:\Users\... with backslashes.
 */
export declare function resolveNormalizedPath(...segments: string[]): string;
/**
 * Load a tsconfig.json and convert all referenced paths (including
 * bazelOptions) to absolute paths.
 * Paths seen by TypeScript should be absolute, to match behavior
 * of the tsc ModuleResolution implementation.
 * @param tsconfigFile path to tsconfig, relative to process.cwd() or absolute
 * @return configuration parsed from the file, or error diagnostics
 */
export declare function parseTsconfig(tsconfigFile: string, host?: ts.ParseConfigHost): [ParsedTsConfig | null, ts.Diagnostic[] | null, {
    target: string;
}];
