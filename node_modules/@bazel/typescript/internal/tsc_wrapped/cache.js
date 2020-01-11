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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "typescript", "./perf_trace"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs = require("fs");
    const ts = require("typescript");
    const perfTrace = require("./perf_trace");
    /**
     * Cache exposes a trivial LRU cache.
     *
     * This code uses the fact that JavaScript hash maps are linked lists - after
     * reaching the cache size limit, it deletes the oldest (first) entries. Used
     * cache entries are moved to the end of the list by deleting and re-inserting.
     */
    class Cache {
        constructor(name, debug) {
            this.name = name;
            this.debug = debug;
            this.map = new Map();
            this.stats = { reads: 0, hits: 0, evictions: 0 };
        }
        set(key, value) {
            this.map.set(key, value);
        }
        get(key, updateCache = true) {
            this.stats.reads++;
            const entry = this.map.get(key);
            if (updateCache) {
                if (entry) {
                    this.debug(this.name, 'cache hit:', key);
                    this.stats.hits++;
                    // Move an entry to the end of the cache by deleting and re-inserting
                    // it.
                    this.map.delete(key);
                    this.map.set(key, entry);
                }
                else {
                    this.debug(this.name, 'cache miss:', key);
                }
                this.traceStats();
            }
            return entry;
        }
        delete(key) {
            this.map.delete(key);
        }
        evict(unevictableKeys) {
            // Drop half the cache, the least recently used entry == the first entry.
            this.debug('Evicting from the', this.name, 'cache...');
            const originalSize = this.map.size;
            let numberKeysToDrop = originalSize / 2;
            if (numberKeysToDrop === 0) {
                return 0;
            }
            // Map keys are iterated in insertion order, since we reinsert on access
            // this is indeed a LRU strategy.
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
            for (const key of this.map.keys()) {
                if (numberKeysToDrop === 0)
                    break;
                if (unevictableKeys && unevictableKeys.has(key))
                    continue;
                this.map.delete(key);
                numberKeysToDrop--;
            }
            const keysDropped = originalSize - this.map.size;
            this.stats.evictions += keysDropped;
            this.debug('Evicted', keysDropped, this.name, 'cache entries');
            this.traceStats();
            return keysDropped;
        }
        keys() {
            return this.map.keys();
        }
        resetStats() {
            this.stats = { hits: 0, reads: 0, evictions: 0 };
        }
        printStats() {
            let percentage;
            if (this.stats.reads === 0) {
                percentage = 100.00; // avoid "NaN %"
            }
            else {
                percentage = (this.stats.hits / this.stats.reads * 100).toFixed(2);
            }
            this.debug(`${this.name} cache stats: ${percentage}% hits`, this.stats);
        }
        traceStats() {
            // counters are rendered as stacked bar charts, so record cache
            // hits/misses rather than the 'reads' stat tracked in stats
            // so the chart makes sense.
            perfTrace.counter(`${this.name} cache hit rate`, {
                'hits': this.stats.hits,
                'misses': this.stats.reads - this.stats.hits,
            });
            perfTrace.counter(`${this.name} cache evictions`, {
                'evictions': this.stats.evictions,
            });
            perfTrace.counter(`${this.name} cache size`, {
                [`${this.name}s`]: this.map.size,
            });
        }
    }
    /**
     * Default memory size, beyond which we evict from the cache.
     */
    const DEFAULT_MAX_MEM_USAGE = 1024 * (1 << 20 /* 1 MB */);
    /**
     * FileCache is a trivial LRU cache for typescript-parsed bazel-output files.
     *
     * Cache entries include an opaque bazel-supplied digest to track staleness.
     * Expected digests must be set (using updateCache) before using the cache.
     */
    // TODO(martinprobst): Drop the <T> parameter, it's no longer used.
    class FileCache {
        constructor(debug) {
            this.debug = debug;
            this.fileCache = new Cache('file', this.debug);
            /**
             * FileCache does not know how to construct bazel's opaque digests. This
             * field caches the last (or current) compile run's digests, so that code
             * below knows what digest to assign to a newly loaded file.
             */
            this.lastDigests = new Map();
            /**
             * FileCache can enter a degenerate state, where all cache entries are pinned
             * by lastDigests, but the system is still out of memory. In that case, do not
             * attempt to free memory until lastDigests has changed.
             */
            this.cannotEvict = false;
            /**
             * Because we cannot measuse the cache memory footprint directly, we evict
             * when the process' total memory usage goes beyond this number.
             */
            this.maxMemoryUsage = DEFAULT_MAX_MEM_USAGE;
            /**
             * Returns whether the cache should free some memory.
             *
             * Defined as a property so it can be overridden in tests.
             */
            this.shouldFreeMemory = () => {
                return process.memoryUsage().heapUsed > this.maxMemoryUsage;
            };
        }
        setMaxCacheSize(maxCacheSize) {
            if (maxCacheSize < 0) {
                throw new Error(`FileCache max size is negative: ${maxCacheSize}`);
            }
            this.debug('Cache max size is', maxCacheSize >> 20, 'MB');
            this.maxMemoryUsage = maxCacheSize;
            this.maybeFreeMemory();
        }
        resetMaxCacheSize() {
            this.setMaxCacheSize(DEFAULT_MAX_MEM_USAGE);
        }
        /**
         * Updates the cache with the given digests.
         *
         * updateCache must be called before loading files - only files that were
         * updated (with a digest) previously can be loaded.
         */
        updateCache(digests) {
            this.debug('updating digests:', digests);
            this.lastDigests = digests;
            this.cannotEvict = false;
            for (const [filePath, newDigest] of digests.entries()) {
                const entry = this.fileCache.get(filePath, /*updateCache=*/ false);
                if (entry && entry.digest !== newDigest) {
                    this.debug('dropping file cache entry for', filePath, 'digests', entry.digest, newDigest);
                    this.fileCache.delete(filePath);
                }
            }
        }
        getLastDigest(filePath) {
            const digest = this.lastDigests.get(filePath);
            if (!digest) {
                const errorMsg = `missing input digest for ${filePath}. `;
                let entriesToPrint = Array.from(this.lastDigests.keys());
                if (entriesToPrint.length > 100) {
                    throw new Error(errorMsg +
                        `(only have ${entriesToPrint.slice(0, 100)} and ${entriesToPrint.length - 100} more)`);
                }
                throw new Error(errorMsg + `(only have ${entriesToPrint})`);
            }
            return digest;
        }
        getCache(filePath) {
            const entry = this.fileCache.get(filePath);
            if (entry)
                return entry.value;
            return undefined;
        }
        putCache(filePath, entry) {
            const dropped = this.maybeFreeMemory();
            this.fileCache.set(filePath, entry);
            this.debug('Loaded file:', filePath, 'dropped', dropped, 'files');
        }
        /**
         * Returns true if the given filePath was reported as an input up front and
         * has a known cache digest. FileCache can only cache known files.
         */
        isKnownInput(filePath) {
            return this.lastDigests.has(filePath);
        }
        inCache(filePath) {
            return !!this.getCache(filePath);
        }
        resetStats() {
            this.fileCache.resetStats();
        }
        printStats() {
            this.fileCache.printStats();
        }
        traceStats() {
            this.fileCache.traceStats();
        }
        /**
         * Frees memory if required. Returns the number of dropped entries.
         */
        maybeFreeMemory() {
            if (!this.shouldFreeMemory() || this.cannotEvict) {
                return 0;
            }
            const dropped = this.fileCache.evict(this.lastDigests);
            if (dropped === 0) {
                // Freeing memory did not drop any cache entries, because all are pinned.
                // Stop evicting until the pinned list changes again. This prevents
                // degenerating into an O(n^2) situation where each file load iterates
                // through the list of all files, trying to evict cache keys in vain
                // because all are pinned.
                this.cannotEvict = true;
            }
            return dropped;
        }
        getFileCacheKeysForTest() {
            return Array.from(this.fileCache.keys());
        }
    }
    exports.FileCache = FileCache;
    /**
     * ProgramAndFileCache is a trivial LRU cache for typescript-parsed programs and
     * bazel-output files.
     *
     * Programs are evicted before source files because they have less reuse across
     * compilations.
     */
    class ProgramAndFileCache extends FileCache {
        constructor() {
            super(...arguments);
            this.programCache = new Cache('program', this.debug);
        }
        getProgram(target) {
            return this.programCache.get(target);
        }
        putProgram(target, program) {
            const dropped = this.maybeFreeMemory();
            this.programCache.set(target, program);
            this.debug('Loaded program:', target, 'dropped', dropped, 'entries');
        }
        resetStats() {
            super.resetStats();
            this.programCache.resetStats();
        }
        printStats() {
            super.printStats();
            this.programCache.printStats();
        }
        traceStats() {
            super.traceStats();
            this.programCache.traceStats();
        }
        maybeFreeMemory() {
            if (!this.shouldFreeMemory())
                return 0;
            const dropped = this.programCache.evict();
            if (dropped > 0)
                return dropped;
            return super.maybeFreeMemory();
        }
        getProgramCacheKeysForTest() {
            return Array.from(this.programCache.keys());
        }
    }
    exports.ProgramAndFileCache = ProgramAndFileCache;
    /**
     * Load a source file from disk, or possibly return a cached version.
     */
    class CachedFileLoader {
        // TODO(alexeagle): remove unused param after usages updated:
        // angular:packages/bazel/src/ngc-wrapped/index.ts
        constructor(cache, unused) {
            this.cache = cache;
            /** Total amount of time spent loading files, for the perf trace. */
            this.totalReadTimeMs = 0;
        }
        fileExists(filePath) {
            return this.cache.isKnownInput(filePath);
        }
        loadFile(fileName, filePath, langVer) {
            let sourceFile = this.cache.getCache(filePath);
            if (!sourceFile) {
                const readStart = Date.now();
                const sourceText = fs.readFileSync(filePath, 'utf8');
                sourceFile = ts.createSourceFile(fileName, sourceText, langVer, true);
                const entry = {
                    digest: this.cache.getLastDigest(filePath),
                    value: sourceFile
                };
                const readEnd = Date.now();
                this.cache.putCache(filePath, entry);
                this.totalReadTimeMs += readEnd - readStart;
                perfTrace.counter('file load time', {
                    'read': this.totalReadTimeMs,
                });
                perfTrace.snapshotMemoryUsage();
            }
            return sourceFile;
        }
    }
    exports.CachedFileLoader = CachedFileLoader;
    /** Load a source file from disk. */
    class UncachedFileLoader {
        fileExists(filePath) {
            return ts.sys.fileExists(filePath);
        }
        loadFile(fileName, filePath, langVer) {
            const sourceText = fs.readFileSync(filePath, 'utf8');
            return ts.createSourceFile(fileName, sourceText, langVer, true);
        }
    }
    exports.UncachedFileLoader = UncachedFileLoader;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7Ozs7Ozs7Ozs7O0lBRUgseUJBQXlCO0lBQ3pCLGlDQUFpQztJQUNqQywwQ0FBMEM7SUFVMUM7Ozs7OztPQU1HO0lBQ0gsTUFBTSxLQUFLO1FBSVQsWUFBb0IsSUFBWSxFQUFVLEtBQVk7WUFBbEMsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFVLFVBQUssR0FBTCxLQUFLLENBQU87WUFIOUMsUUFBRyxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7WUFDM0IsVUFBSyxHQUFlLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUMsQ0FBQztRQUVMLENBQUM7UUFFMUQsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFRO1lBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsR0FBRyxDQUFDLEdBQVcsRUFBRSxXQUFXLEdBQUcsSUFBSTtZQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRW5CLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLElBQUksV0FBVyxFQUFFO2dCQUNmLElBQUksS0FBSyxFQUFFO29CQUNULElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2xCLHFF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QUM7Z0JBRXJDLElBQUksQ0FBQyxlQUFlLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQztnQkFDNUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDbEMsTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlO2lCQUM3QixDQUFDLENBQUM7Z0JBQ0gsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7YUFDakM7WUFFRCxPQUFPLFVBQVUsQ0FBQztRQUNwQixDQUFDO0tBQ0Y7SUFuQ0QsNENBbUNDO0lBRUQsb0NBQW9DO0lBQ3BDLE1BQWEsa0JBQWtCO1FBQzdCLFVBQVUsQ0FBQyxRQUFnQjtZQUN6QixPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxRQUFRLENBQUMsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLE9BQXdCO1lBRW5FLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELE9BQU8sRUFBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRjtJQVZELGdEQVVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgVGhlIEJhemVsIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0ICogYXMgcGVyZlRyYWNlIGZyb20gJy4vcGVyZl90cmFjZSc7XG5cbnR5cGUgRGVidWcgPSAoLi4ubXNnOiBBcnJheTx7fT4pID0+IHZvaWQ7XG5cbmludGVyZmFjZSBDYWNoZVN0YXRzIHtcbiAgcmVhZHM6IG51bWJlcjtcbiAgaGl0czogbnVtYmVyO1xuICBldmljdGlvbnM6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBDYWNoZSBleHBvc2VzIGEgdHJpdmlhbCBMUlUgY2FjaGUuXG4gKlxuICogVGhpcyBjb2RlIHVzZXMgdGhlIGZhY3QgdGhhdCBKYXZhU2NyaXB0IGhhc2ggbWFwcyBhcmUgbGlua2VkIGxpc3RzIC0gYWZ0ZXJcbiAqIHJlYWNoaW5nIHRoZSBjYWNoZSBzaXplIGxpbWl0LCBpdCBkZWxldGVzIHRoZSBvbGRlc3QgKGZpcnN0KSBlbnRyaWVzLiBVc2VkXG4gKiBjYWNoZSBlbnRyaWVzIGFyZSBtb3ZlZCB0byB0aGUgZW5kIG9mIHRoZSBsaXN0IGJ5IGRlbGV0aW5nIGFuZCByZS1pbnNlcnRpbmcuXG4gKi9cbmNsYXNzIENhY2hlPFQ+IHtcbiAgcHJpdmF0ZSBtYXAgPSBuZXcgTWFwPHN0cmluZywgVD4oKTtcbiAgcHJpdmF0ZSBzdGF0czogQ2FjaGVTdGF0cyA9IHtyZWFkczogMCwgaGl0czogMCwgZXZpY3Rpb25zOiAwfTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5hbWU6IHN0cmluZywgcHJpdmF0ZSBkZWJ1ZzogRGVidWcpIHt9XG5cbiAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogVCkge1xuICAgIHRoaXMubWFwLnNldChrZXksIHZhbHVlKTtcbiAgfVxuXG4gIGdldChrZXk6IHN0cmluZywgdXBkYXRlQ2FjaGUgPSB0cnVlKTogVHx1bmRlZmluZWQge1xuICAgIHRoaXMuc3RhdHMucmVhZHMrKztcblxuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgaWYgKHVwZGF0ZUNhY2hlKSB7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgdGhpcy5kZWJ1Zyh0aGlzLm5hbWUsICdjYWNoZSBoaXQ6Jywga2V5KTtcbiAgICAgICAgdGhpcy5zdGF0cy5oaXRzKys7XG4gICAgICAgIC8vIE1vdmUgYW4gZW50cnkgdG8gdGhlIGVuZCBvZiB0aGUgY2FjaGUgYnkgZGVsZXRpbmcgYW5kIHJlLWluc2VydGluZ1xuICAgICAgICAvLyBpdC5cbiAgICAgICAgdGhpcy5tYXAuZGVsZXRlKGtleSk7XG4gICAgICAgIHRoaXMubWFwLnNldChrZXksIGVudHJ5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVidWcodGhpcy5uYW1lLCAnY2FjaGUgbWlzczonLCBrZXkpO1xuICAgICAgfVxuICAgICAgdGhpcy50cmFjZVN0YXRzKCk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeTtcbiAgfVxuXG4gIGRlbGV0ZShrZXk6IHN0cmluZykge1xuICAgIHRoaXMubWFwLmRlbGV0ZShrZXkpO1xuICB9XG5cbiAgZXZpY3QodW5ldmljdGFibGVLZXlzPzoge2hhczogKGtleTogc3RyaW5nKSA9PiBib29sZWFufSk6IG51bWJlciB7XG4gICAgLy8gRHJvcCBoYWxmIHRoZSBjYWNoZSwgdGhlIGxlYXN0IHJlY2VudGx5IHVzZWQgZW50cnkgPT0gdGhlIGZpcnN0IGVudHJ5LlxuICAgIHRoaXMuZGVidWcoJ0V2aWN0aW5nIGZyb20gdGhlJywgdGhpcy5uYW1lLCAnY2FjaGUuLi4nKTtcbiAgICBjb25zdCBvcmlnaW5hbFNpemUgPSB0aGlzLm1hcC5zaXplO1xuICAgIGxldCBudW1iZXJLZXlzVG9Ecm9wID0gb3JpZ2luYWxTaXplIC8gMjtcbiAgICBpZiAobnVtYmVyS2V5c1RvRHJvcCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIC8vIE1hcCBrZXlzIGFyZSBpdGVyYXRlZCBpbiBpbnNlcnRpb24gb3JkZXIsIHNpbmNlIHdlIHJlaW5zZXJ0IG9uIGFjY2Vzc1xuICAgIC8vIHRoaXMgaXMgaW5kZWVkIGEgTFJVIHN0cmF0ZWd5LlxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL01hcC9rZXlzXG4gICAgZm9yIChjb25zdCBrZXkgb2YgdGhpcy5tYXAua2V5cygpKSB7XG4gICAgICBpZiAobnVtYmVyS2V5c1RvRHJvcCA9PT0gMCkgYnJlYWs7XG4gICAgICBpZiAodW5ldmljdGFibGVLZXlzICYmIHVuZXZpY3RhYmxlS2V5cy5oYXMoa2V5KSkgY29udGludWU7XG4gICAgICB0aGlzLm1hcC5kZWxldGUoa2V5KTtcbiAgICAgIG51bWJlcktleXNUb0Ryb3AtLTtcbiAgICB9XG4gICAgY29uc3Qga2V5c0Ryb3BwZWQgPSBvcmlnaW5hbFNpemUgLSB0aGlzLm1hcC5zaXplO1xuICAgIHRoaXMuc3RhdHMuZXZpY3Rpb25zICs9IGtleXNEcm9wcGVkO1xuICAgIHRoaXMuZGVidWcoJ0V2aWN0ZWQnLCBrZXlzRHJvcHBlZCwgdGhpcy5uYW1lLCAnY2FjaGUgZW50cmllcycpO1xuICAgIHRoaXMudHJhY2VTdGF0cygpO1xuICAgIHJldHVybiBrZXlzRHJvcHBlZDtcbiAgfVxuXG4gIGtleXMoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmtleXMoKTtcbiAgfVxuXG4gIHJlc2V0U3RhdHMoKSB7XG4gICAgdGhpcy5zdGF0cyA9IHtoaXRzOiAwLCByZWFkczogMCwgZXZpY3Rpb25zOiAwfTtcbiAgfVxuXG4gIHByaW50U3RhdHMoKSB7XG4gICAgbGV0IHBlcmNlbnRhZ2U7XG4gICAgaWYgKHRoaXMuc3RhdHMucmVhZHMgPT09IDApIHtcbiAgICAgIHBlcmNlbnRhZ2UgPSAxMDAuMDA7ICAvLyBhdm9pZCBcIk5hTiAlXCJcbiAgICB9IGVsc2Uge1xuICAgICAgcGVyY2VudGFnZSA9ICh0aGlzLnN0YXRzLmhpdHMgLyB0aGlzLnN0YXRzLnJlYWRzICogMTAwKS50b0ZpeGVkKDIpO1xuICAgIH1cbiAgICB0aGlzLmRlYnVnKGAke3RoaXMubmFtZX0gY2FjaGUgc3RhdHM6ICR7cGVyY2VudGFnZX0lIGhpdHNgLCB0aGlzLnN0YXRzKTtcbiAgfVxuXG4gIHRyYWNlU3RhdHMoKSB7XG4gICAgLy8gY291bnRlcnMgYXJlIHJlbmRlcmVkIGFzIHN0YWNrZWQgYmFyIGNoYXJ0cywgc28gcmVjb3JkIGNhY2hlXG4gICAgLy8gaGl0cy9taXNzZXMgcmF0aGVyIHRoYW4gdGhlICdyZWFkcycgc3RhdCB0cmFja2VkIGluIHN0YXRzXG4gICAgLy8gc28gdGhlIGNoYXJ0IG1ha2VzIHNlbnNlLlxuICAgIHBlcmZUcmFjZS5jb3VudGVyKGAke3RoaXMubmFtZX0gY2FjaGUgaGl0IHJhdGVgLCB7XG4gICAgICAnaGl0cyc6IHRoaXMuc3RhdHMuaGl0cyxcbiAgICAgICdtaXNzZXMnOiB0aGlzLnN0YXRzLnJlYWRzIC0gdGhpcy5zdGF0cy5oaXRzLFxuICAgIH0pO1xuICAgIHBlcmZUcmFjZS5jb3VudGVyKGAke3RoaXMubmFtZX0gY2FjaGUgZXZpY3Rpb25zYCwge1xuICAgICAgJ2V2aWN0aW9ucyc6IHRoaXMuc3RhdHMuZXZpY3Rpb25zLFxuICAgIH0pO1xuICAgIHBlcmZUcmFjZS5jb3VudGVyKGAke3RoaXMubmFtZX0gY2FjaGUgc2l6ZWAsIHtcbiAgICAgIFtgJHt0aGlzLm5hbWV9c2BdOiB0aGlzLm1hcC5zaXplLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlRmlsZUVudHJ5IHtcbiAgZGlnZXN0OiBzdHJpbmc7ICAvLyBibGF6ZSdzIG9wYXF1ZSBkaWdlc3Qgb2YgdGhlIGZpbGVcbiAgdmFsdWU6IHRzLlNvdXJjZUZpbGU7XG59XG5cbi8qKlxuICogRGVmYXVsdCBtZW1vcnkgc2l6ZSwgYmV5b25kIHdoaWNoIHdlIGV2aWN0IGZyb20gdGhlIGNhY2hlLlxuICovXG5jb25zdCBERUZBVUxUX01BWF9NRU1fVVNBR0UgPSAxMDI0ICogKDEgPDwgMjAgLyogMSBNQiAqLyk7XG5cbi8qKlxuICogRmlsZUNhY2hlIGlzIGEgdHJpdmlhbCBMUlUgY2FjaGUgZm9yIHR5cGVzY3JpcHQtcGFyc2VkIGJhemVsLW91dHB1dCBmaWxlcy5cbiAqXG4gKiBDYWNoZSBlbnRyaWVzIGluY2x1ZGUgYW4gb3BhcXVlIGJhemVsLXN1cHBsaWVkIGRpZ2VzdCB0byB0cmFjayBzdGFsZW5lc3MuXG4gKiBFeHBlY3RlZCBkaWdlc3RzIG11c3QgYmUgc2V0ICh1c2luZyB1cGRhdGVDYWNoZSkgYmVmb3JlIHVzaW5nIHRoZSBjYWNoZS5cbiAqL1xuLy8gVE9ETyhtYXJ0aW5wcm9ic3QpOiBEcm9wIHRoZSA8VD4gcGFyYW1ldGVyLCBpdCdzIG5vIGxvbmdlciB1c2VkLlxuZXhwb3J0IGNsYXNzIEZpbGVDYWNoZTxUID0ge30+IHtcbiAgcHJpdmF0ZSBmaWxlQ2FjaGUgPSBuZXcgQ2FjaGU8U291cmNlRmlsZUVudHJ5PignZmlsZScsIHRoaXMuZGVidWcpO1xuICAvKipcbiAgICogRmlsZUNhY2hlIGRvZXMgbm90IGtub3cgaG93IHRvIGNvbnN0cnVjdCBiYXplbCdzIG9wYXF1ZSBkaWdlc3RzLiBUaGlzXG4gICAqIGZpZWxkIGNhY2hlcyB0aGUgbGFzdCAob3IgY3VycmVudCkgY29tcGlsZSBydW4ncyBkaWdlc3RzLCBzbyB0aGF0IGNvZGVcbiAgICogYmVsb3cga25vd3Mgd2hhdCBkaWdlc3QgdG8gYXNzaWduIHRvIGEgbmV3bHkgbG9hZGVkIGZpbGUuXG4gICAqL1xuICBwcml2YXRlIGxhc3REaWdlc3RzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgLyoqXG4gICAqIEZpbGVDYWNoZSBjYW4gZW50ZXIgYSBkZWdlbmVyYXRlIHN0YXRlLCB3aGVyZSBhbGwgY2FjaGUgZW50cmllcyBhcmUgcGlubmVkXG4gICAqIGJ5IGxhc3REaWdlc3RzLCBidXQgdGhlIHN5c3RlbSBpcyBzdGlsbCBvdXQgb2YgbWVtb3J5LiBJbiB0aGF0IGNhc2UsIGRvIG5vdFxuICAgKiBhdHRlbXB0IHRvIGZyZWUgbWVtb3J5IHVudGlsIGxhc3REaWdlc3RzIGhhcyBjaGFuZ2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBjYW5ub3RFdmljdCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBCZWNhdXNlIHdlIGNhbm5vdCBtZWFzdXNlIHRoZSBjYWNoZSBtZW1vcnkgZm9vdHByaW50IGRpcmVjdGx5LCB3ZSBldmljdFxuICAgKiB3aGVuIHRoZSBwcm9jZXNzJyB0b3RhbCBtZW1vcnkgdXNhZ2UgZ29lcyBiZXlvbmQgdGhpcyBudW1iZXIuXG4gICAqL1xuICBwcml2YXRlIG1heE1lbW9yeVVzYWdlID0gREVGQVVMVF9NQVhfTUVNX1VTQUdFO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBkZWJ1ZzogKC4uLm1zZzogQXJyYXk8e30+KSA9PiB2b2lkKSB7fVxuXG4gIHNldE1heENhY2hlU2l6ZShtYXhDYWNoZVNpemU6IG51bWJlcikge1xuICAgIGlmIChtYXhDYWNoZVNpemUgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpbGVDYWNoZSBtYXggc2l6ZSBpcyBuZWdhdGl2ZTogJHttYXhDYWNoZVNpemV9YCk7XG4gICAgfVxuICAgIHRoaXMuZGVidWcoJ0NhY2hlIG1heCBzaXplIGlzJywgbWF4Q2FjaGVTaXplID4+IDIwLCAnTUInKTtcbiAgICB0aGlzLm1heE1lbW9yeVVzYWdlID0gbWF4Q2FjaGVTaXplO1xuICAgIHRoaXMubWF5YmVGcmVlTWVtb3J5KCk7XG4gIH1cblxuICByZXNldE1heENhY2hlU2l6ZSgpIHtcbiAgICB0aGlzLnNldE1heENhY2hlU2l6ZShERUZBVUxUX01BWF9NRU1fVVNBR0UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNhY2hlIHdpdGggdGhlIGdpdmVuIGRpZ2VzdHMuXG4gICAqXG4gICAqIHVwZGF0ZUNhY2hlIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBsb2FkaW5nIGZpbGVzIC0gb25seSBmaWxlcyB0aGF0IHdlcmVcbiAgICogdXBkYXRlZCAod2l0aCBhIGRpZ2VzdCkgcHJldmlvdXNseSBjYW4gYmUgbG9hZGVkLlxuICAgKi9cbiAgdXBkYXRlQ2FjaGUoZGlnZXN0czogTWFwPHN0cmluZywgc3RyaW5nPik6IHZvaWQge1xuICAgIHRoaXMuZGVidWcoJ3VwZGF0aW5nIGRpZ2VzdHM6JywgZGlnZXN0cyk7XG4gICAgdGhpcy5sYXN0RGlnZXN0cyA9IGRpZ2VzdHM7XG4gICAgdGhpcy5jYW5ub3RFdmljdCA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgW2ZpbGVQYXRoLCBuZXdEaWdlc3RdIG9mIGRpZ2VzdHMuZW50cmllcygpKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZmlsZUNhY2hlLmdldChmaWxlUGF0aCwgLyp1cGRhdGVDYWNoZT0qLyBmYWxzZSk7XG4gICAgICBpZiAoZW50cnkgJiYgZW50cnkuZGlnZXN0ICE9PSBuZXdEaWdlc3QpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZyhcbiAgICAgICAgICAgICdkcm9wcGluZyBmaWxlIGNhY2hlIGVudHJ5IGZvcicsIGZpbGVQYXRoLCAnZGlnZXN0cycsIGVudHJ5LmRpZ2VzdCxcbiAgICAgICAgICAgIG5ld0RpZ2VzdCk7XG4gICAgICAgIHRoaXMuZmlsZUNhY2hlLmRlbGV0ZShmaWxlUGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0TGFzdERpZ2VzdChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBkaWdlc3QgPSB0aGlzLmxhc3REaWdlc3RzLmdldChmaWxlUGF0aCk7XG4gICAgaWYgKCFkaWdlc3QpIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID0gYG1pc3NpbmcgaW5wdXQgZGlnZXN0IGZvciAke2ZpbGVQYXRofS4gYDtcbiAgICAgIGxldCBlbnRyaWVzVG9QcmludCA9IEFycmF5LmZyb20odGhpcy5sYXN0RGlnZXN0cy5rZXlzKCkpO1xuICAgICAgaWYgKGVudHJpZXNUb1ByaW50Lmxlbmd0aCA+IDEwMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBlcnJvck1zZyArXG4gICAgICAgICAgICBgKG9ubHkgaGF2ZSAke2VudHJpZXNUb1ByaW50LnNsaWNlKDAsIDEwMCl9IGFuZCAke1xuICAgICAgICAgICAgICAgIGVudHJpZXNUb1ByaW50Lmxlbmd0aCAtIDEwMH0gbW9yZSlgKTtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyArIGAob25seSBoYXZlICR7ZW50cmllc1RvUHJpbnR9KWApO1xuICAgIH1cbiAgICByZXR1cm4gZGlnZXN0O1xuICB9XG5cbiAgZ2V0Q2FjaGUoZmlsZVBhdGg6IHN0cmluZyk6IHRzLlNvdXJjZUZpbGV8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZmlsZUNhY2hlLmdldChmaWxlUGF0aCk7XG4gICAgaWYgKGVudHJ5KSByZXR1cm4gZW50cnkudmFsdWU7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHB1dENhY2hlKGZpbGVQYXRoOiBzdHJpbmcsIGVudHJ5OiBTb3VyY2VGaWxlRW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCBkcm9wcGVkID0gdGhpcy5tYXliZUZyZWVNZW1vcnkoKTtcbiAgICB0aGlzLmZpbGVDYWNoZS5zZXQoZmlsZVBhdGgsIGVudHJ5KTtcbiAgICB0aGlzLmRlYnVnKCdMb2FkZWQgZmlsZTonLCBmaWxlUGF0aCwgJ2Ryb3BwZWQnLCBkcm9wcGVkLCAnZmlsZXMnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIGZpbGVQYXRoIHdhcyByZXBvcnRlZCBhcyBhbiBpbnB1dCB1cCBmcm9udCBhbmRcbiAgICogaGFzIGEga25vd24gY2FjaGUgZGlnZXN0LiBGaWxlQ2FjaGUgY2FuIG9ubHkgY2FjaGUga25vd24gZmlsZXMuXG4gICAqL1xuICBpc0tub3duSW5wdXQoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxhc3REaWdlc3RzLmhhcyhmaWxlUGF0aCk7XG4gIH1cblxuICBpbkNhY2hlKGZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdldENhY2hlKGZpbGVQYXRoKTtcbiAgfVxuXG4gIHJlc2V0U3RhdHMoKSB7XG4gICAgdGhpcy5maWxlQ2FjaGUucmVzZXRTdGF0cygpO1xuICB9XG5cbiAgcHJpbnRTdGF0cygpIHtcbiAgICB0aGlzLmZpbGVDYWNoZS5wcmludFN0YXRzKCk7XG4gIH1cblxuICB0cmFjZVN0YXRzKCkge1xuICAgIHRoaXMuZmlsZUNhY2hlLnRyYWNlU3RhdHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGNhY2hlIHNob3VsZCBmcmVlIHNvbWUgbWVtb3J5LlxuICAgKlxuICAgKiBEZWZpbmVkIGFzIGEgcHJvcGVydHkgc28gaXQgY2FuIGJlIG92ZXJyaWRkZW4gaW4gdGVzdHMuXG4gICAqL1xuICBzaG91bGRGcmVlTWVtb3J5OiAoKSA9PiBib29sZWFuID0gKCkgPT4ge1xuICAgIHJldHVybiBwcm9jZXNzLm1lbW9yeVVzYWdlKCkuaGVhcFVzZWQgPiB0aGlzLm1heE1lbW9yeVVzYWdlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBGcmVlcyBtZW1vcnkgaWYgcmVxdWlyZWQuIFJldHVybnMgdGhlIG51bWJlciBvZiBkcm9wcGVkIGVudHJpZXMuXG4gICAqL1xuICBtYXliZUZyZWVNZW1vcnkoKSB7XG4gICAgaWYgKCF0aGlzLnNob3VsZEZyZWVNZW1vcnkoKSB8fCB0aGlzLmNhbm5vdEV2aWN0KSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3QgZHJvcHBlZCA9IHRoaXMuZmlsZUNhY2hlLmV2aWN0KHRoaXMubGFzdERpZ2VzdHMpO1xuICAgIGlmIChkcm9wcGVkID09PSAwKSB7XG4gICAgICAvLyBGcmVlaW5nIG1lbW9yeSBkaWQgbm90IGRyb3AgYW55IGNhY2hlIGVudHJpZXMsIGJlY2F1c2UgYWxsIGFyZSBwaW5uZWQuXG4gICAgICAvLyBTdG9wIGV2aWN0aW5nIHVudGlsIHRoZSBwaW5uZWQgbGlzdCBjaGFuZ2VzIGFnYWluLiBUaGlzIHByZXZlbnRzXG4gICAgICAvLyBkZWdlbmVyYXRpbmcgaW50byBhbiBPKG5eMikgc2l0dWF0aW9uIHdoZXJlIGVhY2ggZmlsZSBsb2FkIGl0ZXJhdGVzXG4gICAgICAvLyB0aHJvdWdoIHRoZSBsaXN0IG9mIGFsbCBmaWxlcywgdHJ5aW5nIHRvIGV2aWN0IGNhY2hlIGtleXMgaW4gdmFpblxuICAgICAgLy8gYmVjYXVzZSBhbGwgYXJlIHBpbm5lZC5cbiAgICAgIHRoaXMuY2Fubm90RXZpY3QgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZHJvcHBlZDtcbiAgfVxuXG4gIGdldEZpbGVDYWNoZUtleXNGb3JUZXN0KCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZmlsZUNhY2hlLmtleXMoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9ncmFtQW5kRmlsZUNhY2hlIGlzIGEgdHJpdmlhbCBMUlUgY2FjaGUgZm9yIHR5cGVzY3JpcHQtcGFyc2VkIHByb2dyYW1zIGFuZFxuICogYmF6ZWwtb3V0cHV0IGZpbGVzLlxuICpcbiAqIFByb2dyYW1zIGFyZSBldmljdGVkIGJlZm9yZSBzb3VyY2UgZmlsZXMgYmVjYXVzZSB0aGV5IGhhdmUgbGVzcyByZXVzZSBhY3Jvc3NcbiAqIGNvbXBpbGF0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb2dyYW1BbmRGaWxlQ2FjaGUgZXh0ZW5kcyBGaWxlQ2FjaGUge1xuICBwcml2YXRlIHByb2dyYW1DYWNoZSA9IG5ldyBDYWNoZTx0cy5Qcm9ncmFtPigncHJvZ3JhbScsIHRoaXMuZGVidWcpO1xuXG4gIGdldFByb2dyYW0odGFyZ2V0OiBzdHJpbmcpOiB0cy5Qcm9ncmFtfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucHJvZ3JhbUNhY2hlLmdldCh0YXJnZXQpO1xuICB9XG5cbiAgcHV0UHJvZ3JhbSh0YXJnZXQ6IHN0cmluZywgcHJvZ3JhbTogdHMuUHJvZ3JhbSk6IHZvaWQge1xuICAgIGNvbnN0IGRyb3BwZWQgPSB0aGlzLm1heWJlRnJlZU1lbW9yeSgpO1xuICAgIHRoaXMucHJvZ3JhbUNhY2hlLnNldCh0YXJnZXQsIHByb2dyYW0pO1xuICAgIHRoaXMuZGVidWcoJ0xvYWRlZCBwcm9ncmFtOicsIHRhcmdldCwgJ2Ryb3BwZWQnLCBkcm9wcGVkLCAnZW50cmllcycpO1xuICB9XG5cbiAgcmVzZXRTdGF0cygpIHtcbiAgICBzdXBlci5yZXNldFN0YXRzKCk7XG4gICAgdGhpcy5wcm9ncmFtQ2FjaGUucmVzZXRTdGF0cygpO1xuICB9XG5cbiAgcHJpbnRTdGF0cygpIHtcbiAgICBzdXBlci5wcmludFN0YXRzKCk7XG4gICAgdGhpcy5wcm9ncmFtQ2FjaGUucHJpbnRTdGF0cygpO1xuICB9XG5cbiAgdHJhY2VTdGF0cygpIHtcbiAgICBzdXBlci50cmFjZVN0YXRzKCk7XG4gICAgdGhpcy5wcm9ncmFtQ2FjaGUudHJhY2VTdGF0cygpO1xuICB9XG5cbiAgbWF5YmVGcmVlTWVtb3J5KCkge1xuICAgIGlmICghdGhpcy5zaG91bGRGcmVlTWVtb3J5KCkpIHJldHVybiAwO1xuXG4gICAgY29uc3QgZHJvcHBlZCA9IHRoaXMucHJvZ3JhbUNhY2hlLmV2aWN0KCk7XG4gICAgaWYgKGRyb3BwZWQgPiAwKSByZXR1cm4gZHJvcHBlZDtcblxuICAgIHJldHVybiBzdXBlci5tYXliZUZyZWVNZW1vcnkoKTtcbiAgfVxuXG4gIGdldFByb2dyYW1DYWNoZUtleXNGb3JUZXN0KCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMucHJvZ3JhbUNhY2hlLmtleXMoKSk7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBGaWxlTG9hZGVyIHtcbiAgbG9hZEZpbGUoZmlsZU5hbWU6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZywgbGFuZ1ZlcjogdHMuU2NyaXB0VGFyZ2V0KTpcbiAgICAgIHRzLlNvdXJjZUZpbGU7XG4gIGZpbGVFeGlzdHMoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW47XG59XG5cbi8qKlxuICogTG9hZCBhIHNvdXJjZSBmaWxlIGZyb20gZGlzaywgb3IgcG9zc2libHkgcmV0dXJuIGEgY2FjaGVkIHZlcnNpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWNoZWRGaWxlTG9hZGVyIGltcGxlbWVudHMgRmlsZUxvYWRlciB7XG4gIC8qKiBUb3RhbCBhbW91bnQgb2YgdGltZSBzcGVudCBsb2FkaW5nIGZpbGVzLCBmb3IgdGhlIHBlcmYgdHJhY2UuICovXG4gIHByaXZhdGUgdG90YWxSZWFkVGltZU1zID0gMDtcblxuICAvLyBUT0RPKGFsZXhlYWdsZSk6IHJlbW92ZSB1bnVzZWQgcGFyYW0gYWZ0ZXIgdXNhZ2VzIHVwZGF0ZWQ6XG4gIC8vIGFuZ3VsYXI6cGFja2FnZXMvYmF6ZWwvc3JjL25nYy13cmFwcGVkL2luZGV4LnRzXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2FjaGU6IEZpbGVDYWNoZSwgdW51c2VkPzogYm9vbGVhbikge31cblxuICBmaWxlRXhpc3RzKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5jYWNoZS5pc0tub3duSW5wdXQoZmlsZVBhdGgpO1xuICB9XG5cbiAgbG9hZEZpbGUoZmlsZU5hbWU6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZywgbGFuZ1ZlcjogdHMuU2NyaXB0VGFyZ2V0KTpcbiAgICAgIHRzLlNvdXJjZUZpbGUge1xuICAgIGxldCBzb3VyY2VGaWxlID0gdGhpcy5jYWNoZS5nZXRDYWNoZShmaWxlUGF0aCk7XG4gICAgaWYgKCFzb3VyY2VGaWxlKSB7XG4gICAgICBjb25zdCByZWFkU3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3Qgc291cmNlVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0ZjgnKTtcbiAgICAgIHNvdXJjZUZpbGUgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKGZpbGVOYW1lLCBzb3VyY2VUZXh0LCBsYW5nVmVyLCB0cnVlKTtcbiAgICAgIGNvbnN0IGVudHJ5ID0ge1xuICAgICAgICBkaWdlc3Q6IHRoaXMuY2FjaGUuZ2V0TGFzdERpZ2VzdChmaWxlUGF0aCksXG4gICAgICAgIHZhbHVlOiBzb3VyY2VGaWxlXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVhZEVuZCA9IERhdGUubm93KCk7XG4gICAgICB0aGlzLmNhY2hlLnB1dENhY2hlKGZpbGVQYXRoLCBlbnRyeSk7XG5cbiAgICAgIHRoaXMudG90YWxSZWFkVGltZU1zICs9IHJlYWRFbmQgLSByZWFkU3RhcnQ7XG4gICAgICBwZXJmVHJhY2UuY291bnRlcignZmlsZSBsb2FkIHRpbWUnLCB7XG4gICAgICAgICdyZWFkJzogdGhpcy50b3RhbFJlYWRUaW1lTXMsXG4gICAgICB9KTtcbiAgICAgIHBlcmZUcmFjZS5zbmFwc2hvdE1lbW9yeVVzYWdlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNvdXJjZUZpbGU7XG4gIH1cbn1cblxuLyoqIExvYWQgYSBzb3VyY2UgZmlsZSBmcm9tIGRpc2suICovXG5leHBvcnQgY2xhc3MgVW5jYWNoZWRGaWxlTG9hZGVyIGltcGxlbWVudHMgRmlsZUxvYWRlciB7XG4gIGZpbGVFeGlzdHMoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0cy5zeXMuZmlsZUV4aXN0cyhmaWxlUGF0aCk7XG4gIH1cblxuICBsb2FkRmlsZShmaWxlTmFtZTogc3RyaW5nLCBmaWxlUGF0aDogc3RyaW5nLCBsYW5nVmVyOiB0cy5TY3JpcHRUYXJnZXQpOlxuICAgICAgdHMuU291cmNlRmlsZSB7XG4gICAgY29uc3Qgc291cmNlVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0ZjgnKTtcbiAgICByZXR1cm4gdHMuY3JlYXRlU291cmNlRmlsZShmaWxlTmFtZSwgc291cmNlVGV4dCwgbGFuZ1ZlciwgdHJ1ZSk7XG4gIH1cbn1cbiJdfQ==