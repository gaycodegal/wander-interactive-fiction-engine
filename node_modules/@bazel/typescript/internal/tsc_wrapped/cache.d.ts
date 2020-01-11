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
export interface SourceFileEntry {
    digest: string;
    value: ts.SourceFile;
}
/**
 * FileCache is a trivial LRU cache for typescript-parsed bazel-output files.
 *
 * Cache entries include an opaque bazel-supplied digest to track staleness.
 * Expected digests must be set (using updateCache) before using the cache.
 */
export declare class FileCache<T = {}> {
    protected debug: (...msg: Array<{}>) => void;
    private fileCache;
    /**
     * FileCache does not know how to construct bazel's opaque digests. This
     * field caches the last (or current) compile run's digests, so that code
     * below knows what digest to assign to a newly loaded file.
     */
    private lastDigests;
    /**
     * FileCache can enter a degenerate state, where all cache entries are pinned
     * by lastDigests, but the system is still out of memory. In that case, do not
     * attempt to free memory until lastDigests has changed.
     */
    private cannotEvict;
    /**
     * Because we cannot measuse the cache memory footprint directly, we evict
     * when the process' total memory usage goes beyond this number.
     */
    private maxMemoryUsage;
    constructor(debug: (...msg: Array<{}>) => void);
    setMaxCacheSize(maxCacheSize: number): void;
    resetMaxCacheSize(): void;
    /**
     * Updates the cache with the given digests.
     *
     * updateCache must be called before loading files - only files that were
     * updated (with a digest) previously can be loaded.
     */
    updateCache(digests: Map<string, string>): void;
    getLastDigest(filePath: string): string;
    getCache(filePath: string): ts.SourceFile | undefined;
    putCache(filePath: string, entry: SourceFileEntry): void;
    /**
     * Returns true if the given filePath was reported as an input up front and
     * has a known cache digest. FileCache can only cache known files.
     */
    isKnownInput(filePath: string): boolean;
    inCache(filePath: string): boolean;
    resetStats(): void;
    printStats(): void;
    traceStats(): void;
    /**
     * Returns whether the cache should free some memory.
     *
     * Defined as a property so it can be overridden in tests.
     */
    shouldFreeMemory: () => boolean;
    /**
     * Frees memory if required. Returns the number of dropped entries.
     */
    maybeFreeMemory(): number;
    getFileCacheKeysForTest(): string[];
}
/**
 * ProgramAndFileCache is a trivial LRU cache for typescript-parsed programs and
 * bazel-output files.
 *
 * Programs are evicted before source files because they have less reuse across
 * compilations.
 */
export declare class ProgramAndFileCache extends FileCache {
    private programCache;
    getProgram(target: string): ts.Program | undefined;
    putProgram(target: string, program: ts.Program): void;
    resetStats(): void;
    printStats(): void;
    traceStats(): void;
    maybeFreeMemory(): number;
    getProgramCacheKeysForTest(): string[];
}
export interface FileLoader {
    loadFile(fileName: string, filePath: string, langVer: ts.ScriptTarget): ts.SourceFile;
    fileExists(filePath: string): boolean;
}
/**
 * Load a source file from disk, or possibly return a cached version.
 */
export declare class CachedFileLoader implements FileLoader {
    private readonly cache;
    /** Total amount of time spent loading files, for the perf trace. */
    private totalReadTimeMs;
    constructor(cache: FileCache, unused?: boolean);
    fileExists(filePath: string): boolean;
    loadFile(fileName: string, filePath: string, langVer: ts.ScriptTarget): ts.SourceFile;
}
/** Load a source file from disk. */
export declare class UncachedFileLoader implements FileLoader {
    fileExists(filePath: string): boolean;
    loadFile(fileName: string, filePath: string, langVer: ts.ScriptTarget): ts.SourceFile;
}
