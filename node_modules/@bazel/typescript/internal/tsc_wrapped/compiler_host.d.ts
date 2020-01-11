import * as tsickle from 'tsickle';
import * as ts from 'typescript';
import { FileLoader } from './cache';
import { BazelOptions } from './tsconfig';
export declare type ModuleResolver = (moduleName: string, containingFile: string, compilerOptions: ts.CompilerOptions, host: ts.ModuleResolutionHost) => ts.ResolvedModuleWithFailedLookupLocations;
/**
 * Narrows down the type of some properties from non-optional to required, so
 * that we do not need to check presence before each access.
 */
export interface BazelTsOptions extends ts.CompilerOptions {
    rootDirs: string[];
    rootDir: string;
    outDir: string;
    typeRoots: string[];
}
export declare function narrowTsOptions(options: ts.CompilerOptions): BazelTsOptions;
/**
 * CompilerHost that knows how to cache parsed files to improve compile times.
 */
export declare class CompilerHost implements ts.CompilerHost, tsickle.TsickleHost {
    inputFiles: string[];
    readonly bazelOpts: BazelOptions;
    private delegate;
    private fileLoader;
    private moduleResolver;
    /**
     * Lookup table to answer file stat's without looking on disk.
     */
    private knownFiles;
    /**
     * rootDirs relative to the rootDir, eg "bazel-out/local-fastbuild/bin"
     */
    private relativeRoots;
    getCancelationToken?: () => ts.CancellationToken;
    directoryExists?: (dir: string) => boolean;
    googmodule: boolean;
    es5Mode: boolean;
    prelude: string;
    untyped: boolean;
    typeBlackListPaths: Set<string>;
    transformDecorators: boolean;
    transformTypesToClosure: boolean;
    addDtsClutzAliases: boolean;
    isJsTranspilation: boolean;
    provideExternalModuleDtsNamespace: boolean;
    options: BazelTsOptions;
    moduleResolutionHost: ts.ModuleResolutionHost;
    host: ts.ModuleResolutionHost;
    private allowActionInputReads;
    constructor(inputFiles: string[], options: ts.CompilerOptions, bazelOpts: BazelOptions, delegate: ts.CompilerHost, fileLoader: FileLoader, moduleResolver?: ModuleResolver);
    /**
     * For the given potentially absolute input file path (typically .ts), returns
     * the relative output path. For example, for
     * /path/to/root/blaze-out/k8-fastbuild/genfiles/my/file.ts, will return
     * my/file.js or my/file.mjs (depending on ES5 mode).
     */
    relativeOutputPath(fileName: string): string;
    /**
     * Workaround https://github.com/Microsoft/TypeScript/issues/8245
     * We use the `rootDirs` property both for module resolution,
     * and *also* to flatten the structure of the output directory
     * (as `rootDir` would do for a single root).
     * To do this, look for the pattern outDir/relativeRoots[i]/path/to/file
     * or relativeRoots[i]/path/to/file
     * and replace that with path/to/file
     */
    flattenOutDir(fileName: string): string;
    /** Avoid using tsickle on files that aren't in srcs[] */
    shouldSkipTsickleProcessing(fileName: string): boolean;
    /** Whether the file is expected to be imported using a named module */
    shouldNameModule(fileName: string): boolean;
    /** Allows suppressing warnings for specific known libraries */
    shouldIgnoreWarningsForPath(filePath: string): boolean;
    /**
     * fileNameToModuleId gives the module ID for an input source file name.
     * @param fileName an input source file name, e.g.
     *     /root/dir/bazel-out/host/bin/my/file.ts.
     * @return the canonical path of a file within blaze, without /genfiles/ or
     *     /bin/ path parts, excluding a file extension. For example, "my/file".
     */
    fileNameToModuleId(fileName: string): string;
    /**
     * TypeScript SourceFile's have a path with the rootDirs[i] still present, eg.
     * /build/work/bazel-out/local-fastbuild/bin/path/to/file
     * @return the path without any rootDirs, eg. path/to/file
     */
    private rootDirsRelative;
    /**
     * Massages file names into valid goog.module names:
     * - resolves relative paths to the given context
     * - resolves non-relative paths which takes module_root into account
     * - replaces '/' with '.' in the '<workspace>' namespace
     * - replace first char if non-alpha
     * - replace subsequent non-alpha numeric chars
     */
    pathToModuleName(context: string, importPath: string): string;
    /**
     * Converts file path into a valid AMD module name.
     *
     * An AMD module can have an arbitrary name, so that it is require'd by name
     * rather than by path. See http://requirejs.org/docs/whyamd.html#namedmodules
     *
     * "However, tools that combine multiple modules together for performance need
     *  a way to give names to each module in the optimized file. For that, AMD
     *  allows a string as the first argument to define()"
     */
    amdModuleName(sf: ts.SourceFile): string | undefined;
    /**
     * Resolves the typings file from a package at the specified path. Helper
     * function to `resolveTypeReferenceDirectives`.
     */
    private resolveTypingFromDirectory;
    /**
     * Override the default typescript resolveTypeReferenceDirectives function.
     * Resolves /// <reference types="x" /> directives under bazel. The default
     * typescript secondary search behavior needs to be overridden to support
     * looking under `bazelOpts.nodeModulesPrefix`
     */
    resolveTypeReferenceDirectives(names: string[], containingFile: string): ts.ResolvedTypeReferenceDirective[];
    /** Loads a source file from disk (or the cache). */
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile;
    writeFile(fileName: string, content: string, writeByteOrderMark: boolean, onError: ((message: string) => void) | undefined, sourceFiles: ReadonlyArray<ts.SourceFile> | undefined): void;
    writeFileImpl(fileName: string, content: string, writeByteOrderMark: boolean, onError: ((message: string) => void) | undefined, sourceFiles: ReadonlyArray<ts.SourceFile> | undefined): void;
    /**
     * Performance optimization: don't try to stat files we weren't explicitly
     * given as inputs.
     * This also allows us to disable Bazel sandboxing, without accidentally
     * reading .ts inputs when .d.ts inputs are intended.
     * Note that in worker mode, the file cache will also guard against arbitrary
     * file reads.
     */
    fileExists(filePath: string): boolean;
    getDefaultLibLocation(): string;
    getDefaultLibFileName(options: ts.CompilerOptions): string;
    realpath(s: string): string;
    getCanonicalFileName(path: string): string;
    getCurrentDirectory(): string;
    useCaseSensitiveFileNames(): boolean;
    getNewLine(): string;
    getDirectories(path: string): string[];
    readFile(fileName: string): string | undefined;
    trace(s: string): void;
}
