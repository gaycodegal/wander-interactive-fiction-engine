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
import * as pluginApi from './plugin_api';
export interface StrictDepsPluginConfig {
    compilationTargetSrc: string[];
    allowedStrictDeps: string[];
    rootDir: string;
}
/** The TypeScript diagnostic code for "Cannot find module ...". */
export declare const TS_ERR_CANNOT_FIND_MODULE = 2307;
/**
 * The strict_deps plugin checks the imports of the compiled modules.
 *
 * It implements strict deps, i.e. enforces that each file in
 * `config.compilationTargetSrc` only imports from files in
 * `config.allowedStrictDeps`.
 *
 * This is used to implement strict dependency checking -
 * source files in a build target may only import sources of their immediate
 * dependencies, but not sources of their transitive dependencies.
 *
 * strict_deps also makes sure that no imports ends in '.ts'. TypeScript
 * allows imports including the file extension, but our runtime loading support
 * fails with it.
 *
 * strict_deps currently does not check ambient/global definitions.
 */
export declare class Plugin implements pluginApi.DiagnosticPlugin {
    private readonly program;
    private readonly config;
    constructor(program: ts.Program, config: StrictDepsPluginConfig);
    readonly name = "strictDeps";
    getDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[];
}
export declare function checkModuleDeps(sf: ts.SourceFile, tc: ts.TypeChecker, allowedDeps: string[], rootDir: string): ts.Diagnostic[];
