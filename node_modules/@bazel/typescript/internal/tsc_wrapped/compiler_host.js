(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "path", "typescript", "./perf_trace", "./worker"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs = require("fs");
    const path = require("path");
    const ts = require("typescript");
    const perfTrace = require("./perf_trace");
    const worker_1 = require("./worker");
    function narrowTsOptions(options) {
        if (!options.rootDirs) {
            throw new Error(`compilerOptions.rootDirs should be set by tsconfig.bzl`);
        }
        if (!options.rootDir) {
            throw new Error(`compilerOptions.rootDir should be set by tsconfig.bzl`);
        }
        if (!options.outDir) {
            throw new Error(`compilerOptions.outDir should be set by tsconfig.bzl`);
        }
        return options;
    }
    exports.narrowTsOptions = narrowTsOptions;
    function validateBazelOptions(bazelOpts) {
        if (!bazelOpts.isJsTranspilation)
            return;
        if (bazelOpts.compilationTargetSrc &&
            bazelOpts.compilationTargetSrc.length > 1) {
            throw new Error('In JS transpilation mode, only one file can appear in ' +
                'bazelOptions.compilationTargetSrc.');
        }
        if (!bazelOpts.transpiledJsOutputFileName &&
            !bazelOpts.transpiledJsOutputDirectory) {
            throw new Error('In JS transpilation mode, either transpiledJsOutputFileName or ' +
                'transpiledJsOutputDirectory must be specified in tsconfig.');
        }
        if (bazelOpts.transpiledJsOutputFileName &&
            bazelOpts.transpiledJsOutputDirectory) {
            throw new Error('In JS transpilation mode, cannot set both ' +
                'transpiledJsOutputFileName and transpiledJsOutputDirectory.');
        }
    }
    const SOURCE_EXT = /((\.d)?\.tsx?|\.js)$/;
    /**
     * CompilerHost that knows how to cache parsed files to improve compile times.
     */
    class CompilerHost {
        constructor(inputFiles, options, bazelOpts, delegate, fileLoader, moduleResolver = ts.resolveModuleName) {
            this.inputFiles = inputFiles;
            this.bazelOpts = bazelOpts;
            this.delegate = delegate;
            this.fileLoader = fileLoader;
            this.moduleResolver = moduleResolver;
            /**
             * Lookup table to answer file stat's without looking on disk.
             */
            this.knownFiles = new Set();
            this.moduleResolutionHost = this;
            // TODO(evanm): delete this once tsickle is updated.
            this.host = this;
            this.allowActionInputReads = true;
            this.options = narrowTsOptions(options);
            this.relativeRoots =
                this.options.rootDirs.map(r => path.relative(this.options.rootDir, r));
            inputFiles.forEach((f) => {
                this.knownFiles.add(f);
            });
            // getCancelationToken is an optional method on the delegate. If we
            // unconditionally implement the method, we will be forced to return null,
            // in the absense of the delegate method. That won't match the return type.
            // Instead, we optionally set a function to a field with the same name.
            if (delegate && delegate.getCancellationToken) {
                this.getCancelationToken = delegate.getCancellationToken.bind(delegate);
            }
            // Override directoryExists so that TypeScript can automatically
            // include global typings from node_modules/@types
            // see getAutomaticTypeDirectiveNames in
            // TypeScript:src/compiler/moduleNameResolver
            if (this.allowActionInputReads && delegate && delegate.directoryExists) {
                this.directoryExists = delegate.directoryExists.bind(delegate);
            }
            validateBazelOptions(bazelOpts);
            this.googmodule = bazelOpts.googmodule;
            this.es5Mode = bazelOpts.es5Mode;
            this.prelude = bazelOpts.prelude;
            this.untyped = bazelOpts.untyped;
            this.typeBlackListPaths = new Set(bazelOpts.typeBlackListPaths);
            this.transformDecorators = bazelOpts.tsickle;
            this.transformTypesToClosure = bazelOpts.tsickle;
            this.addDtsClutzAliases = bazelOpts.addDtsClutzAliases;
            this.isJsTranspilation = Boolean(bazelOpts.isJsTranspilation);
            this.provideExternalModuleDtsNamespace = !bazelOpts.hasImplementation;
        }
        /**
         * For the given potentially absolute input file path (typically .ts), returns
         * the relative output path. For example, for
         * /path/to/root/blaze-out/k8-fastbuild/genfiles/my/file.ts, will return
         * my/file.js or my/file.mjs (depending on ES5 mode).
         */
        relativeOutputPath(fileName) {
            let result = this.rootDirsRelative(fileName);
            result = result.replace(/(\.d)?\.[jt]sx?$/, '');
            if (!this.bazelOpts.es5Mode)
                result += '.closure';
            return result + '.js';
        }
        /**
         * Workaround https://github.com/Microsoft/TypeScript/issues/8245
         * We use the `rootDirs` property both for module resolution,
         * and *also* to flatten the structure of the output directory
         * (as `rootDir` would do for a single root).
         * To do this, look for the pattern outDir/relativeRoots[i]/path/to/file
         * or relativeRoots[i]/path/to/file
         * and replace that with path/to/file
         */
        flattenOutDir(fileName) {
            let result = fileName;
            // outDir/relativeRoots[i]/path/to/file -> relativeRoots[i]/path/to/file
            if (fileName.startsWith(this.options.rootDir)) {
                result = path.relative(this.options.outDir, fileName);
            }
            for (const dir of this.relativeRoots) {
                // relativeRoots[i]/path/to/file -> path/to/file
                const rel = path.relative(dir, result);
                if (!rel.startsWith('..')) {
                    result = rel;
                    // relativeRoots is sorted longest first so we can short-circuit
                    // after the first match
                    break;
                }
            }
            return result;
        }
        /** Avoid using tsickle on files that aren't in srcs[] */
        shouldSkipTsickleProcessing(fileName) {
            return this.bazelOpts.isJsTranspilation ||
                this.bazelOpts.compilationTargetSrc.indexOf(fileName) === -1;
        }
        /** Whether the file is expected to be imported using a named module */
        shouldNameModule(fileName) {
            return this.bazelOpts.compilationTargetSrc.indexOf(fileName) !== -1;
        }
        /** Allows suppressing warnings for specific known libraries */
        shouldIgnoreWarningsForPath(filePath) {
            return this.bazelOpts.ignoreWarningPaths.some(p => !!filePath.match(new RegExp(p)));
        }
        /**
         * fileNameToModuleId gives the module ID for an input source file name.
         * @param fileName an input source file name, e.g.
         *     /root/dir/bazel-out/host/bin/my/file.ts.
         * @return the canonical path of a file within blaze, without /genfiles/ or
         *     /bin/ path parts, excluding a file extension. For example, "my/file".
         */
        fileNameToModuleId(fileName) {
            return this.relativeOutputPath(fileName.substring(0, fileName.lastIndexOf('.')));
        }
        /**
         * TypeScript SourceFile's have a path with the rootDirs[i] still present, eg.
         * /build/work/bazel-out/local-fastbuild/bin/path/to/file
         * @return the path without any rootDirs, eg. path/to/file
         */
        rootDirsRelative(fileName) {
            for (const root of this.options.rootDirs) {
                if (fileName.startsWith(root)) {
                    // rootDirs are sorted longest-first, so short-circuit the iteration
                    // see tsconfig.ts.
                    return path.posix.relative(root, fileName);
                }
            }
            return fileName;
        }
        /**
         * Massages file names into valid goog.module names:
         * - resolves relative paths to the given context
         * - resolves non-relative paths which takes module_root into account
         * - replaces '/' with '.' in the '<workspace>' namespace
         * - replace first char if non-alpha
         * - replace subsequent non-alpha numeric chars
         */
        pathToModuleName(context, importPath) {
            // tsickle hands us an output path, we need to map it back to a source
            // path in order to do module resolution with it.
            // outDir/relativeRoots[i]/path/to/file ->
            // rootDir/relativeRoots[i]/path/to/file
            if (context.startsWith(this.options.outDir)) {
                context = path.join(this.options.rootDir, path.relative(this.options.outDir, context));
            }
            // Try to get the resolved path name from TS compiler host which can
            // handle resolution for libraries with module_root like rxjs and @angular.
            let resolvedPath = null;
            const resolved = this.moduleResolver(importPath, context, this.options, this);
            if (resolved && resolved.resolvedModule &&
                resolved.resolvedModule.resolvedFileName) {
                resolvedPath = resolved.resolvedModule.resolvedFileName;
                // /build/work/bazel-out/local-fastbuild/bin/path/to/file ->
                // path/to/file
                resolvedPath = this.rootDirsRelative(resolvedPath);
            }
            else {
                // importPath can be an absolute file path in google3.
                // Try to trim it as a path relative to bin and genfiles, and if so,
                // handle its file extension in the block below and prepend the workspace
                // name.
                const trimmed = this.rootDirsRelative(importPath);
                if (trimmed !== importPath) {
                    resolvedPath = trimmed;
                }
            }
            if (resolvedPath) {
                // Strip file extensions.
                importPath = resolvedPath.replace(SOURCE_EXT, '');
                // Make sure all module names include the workspace name.
                if (importPath.indexOf(this.bazelOpts.workspaceName) !== 0) {
                    importPath = path.posix.join(this.bazelOpts.workspaceName, importPath);
                }
            }
            // Remove the __{LOCALE} from the module name.
            if (this.bazelOpts.locale) {
                const suffix = '__' + this.bazelOpts.locale.toLowerCase();
                if (importPath.toLowerCase().endsWith(suffix)) {
                    importPath = importPath.substring(0, importPath.length - suffix.length);
                }
            }
            // Replace characters not supported by goog.module and '.' with
            // '$<Hex char code>' so that the original module name can be re-obtained
            // without any loss.
            // See goog.VALID_MODULE_RE_ in Closure's base.js for characters supported
            // by google.module.
            const escape = (c) => {
                return '$' + c.charCodeAt(0).toString(16);
            };
            const moduleName = importPath.replace(/^[0-9]|[^a-zA-Z_0-9_/]/g, escape)
                .replace(/\//g, '.');
            return moduleName;
        }
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
        amdModuleName(sf) {
            if (!this.shouldNameModule(sf.fileName))
                return undefined;
            // /build/work/bazel-out/local-fastbuild/bin/path/to/file.ts
            // -> path/to/file
            let fileName = this.rootDirsRelative(sf.fileName).replace(SOURCE_EXT, '');
            let workspace = this.bazelOpts.workspaceName;
            // Workaround https://github.com/bazelbuild/bazel/issues/1262
            //
            // When the file comes from an external bazel repository,
            // and TypeScript resolves runfiles symlinks, then the path will look like
            // output_base/execroot/local_repo/external/another_repo/foo/bar
            // We want to name such a module "another_repo/foo/bar" just as it would be
            // named by code in that repository.
            // As a workaround, check for the /external/ path segment, and fix up the
            // workspace name to be the name of the external repository.
            if (fileName.startsWith('external/')) {
                const parts = fileName.split('/');
                workspace = parts[1];
                fileName = parts.slice(2).join('/');
            }
            if (this.bazelOpts.moduleName) {
                const relativeFileName = path.posix.relative(this.bazelOpts.package, fileName);
                // check that the fileName was actually underneath the package directory
                if (!relativeFileName.startsWith('..')) {
                    if (this.bazelOpts.moduleRoot) {
                        const root = this.bazelOpts.moduleRoot.replace(SOURCE_EXT, '');
                        if (root === relativeFileName ||
                            path.posix.join(root, 'index') === relativeFileName) {
                            return this.bazelOpts.moduleName;
                        }
                    }
                    // Support the common case of commonjs convention that index is the
                    // default module in a directory.
                    // This makes our module naming scheme more conventional and lets users
                    // refer to modules with the natural name they're used to.
                    if (relativeFileName === 'index') {
                        return this.bazelOpts.moduleName;
                    }
                    return path.posix.join(this.bazelOpts.moduleName, relativeFileName);
                }
            }
            if (fileName.startsWith('node_modules/')) {
                return fileName.substring('node_modules/'.length);
            }
            // path/to/file ->
            // myWorkspace/path/to/file
            return path.posix.join(workspace, fileName);
        }
        /**
         * Resolves the typings file from a package at the specified path. Helper
         * function to `resolveTypeReferenceDirectives`.
         */
        resolveTypingFromDirectory(typePath, primary) {
            // Looks for the `typings` attribute in a package.json file
            // if it exists
            const pkgFile = path.posix.join(typePath, 'package.json');
            if (this.fileExists(pkgFile)) {
                const pkg = JSON.parse(fs.readFileSync(pkgFile, 'UTF-8'));
                let typings = pkg['typings'];
                if (typings) {
                    if (typings === '.' || typings === './') {
                        typings = 'index.d.ts';
                    }
                    const maybe = path.posix.join(typePath, typings);
                    if (this.fileExists(maybe)) {
                        return { primary, resolvedFileName: maybe };
                    }
                }
            }
            // Look for an index.d.ts file in the path
            const maybe = path.posix.join(typePath, 'index.d.ts');
            if (this.fileExists(maybe)) {
                return { primary, resolvedFileName: maybe };
            }
            return undefined;
        }
        /**
         * Override the default typescript resolveTypeReferenceDirectives function.
         * Resolves /// <reference types="x" /> directives under bazel. The default
         * typescript secondary search behavior needs to be overridden to support
         * looking under `bazelOpts.nodeModulesPrefix`
         */
        resolveTypeReferenceDirectives(names, containingFile) {
            if (!this.allowActionInputReads)
                return [];
            const result = [];
            names.forEach(name => {
                let resolved;
                // primary search
                this.options.typeRoots.forEach(typeRoot => {
                    if (!resolved) {
                        resolved = this.resolveTypingFromDirectory(path.posix.join(typeRoot, name), true);
                    }
                });
                // secondary search
                if (!resolved) {
                    resolved = this.resolveTypingFromDirectory(path.posix.join(this.bazelOpts.nodeModulesPrefix, name), false);
                }
                // Types not resolved should be silently ignored. Leave it to Typescript
                // to either error out with "TS2688: Cannot find type definition file for
                // 'foo'" or for the build to fail due to a missing type that is used.
                if (!resolved) {
                    if (worker_1.DEBUG) {
                        worker_1.debug(`Failed to resolve type reference directive '${name}'`);
                    }
                    return;
                }
                // In typescript 2.x the return type for this function
                // is `(ts.ResolvedTypeReferenceDirective | undefined)[]` thus we actually
                // do allow returning `undefined` in the array but the function is typed
                // `(ts.ResolvedTypeReferenceDirective)[]` to compile with both typescript
                // 2.x and 3.0/3.1 without error. Typescript 3.0/3.1 do handle the `undefined`
                // values in the array correctly despite the return signature.
                // It looks like the return type change was a mistake because
                // it was changed back to include `| undefined` recently:
                // https://github.com/Microsoft/TypeScript/pull/28059.
                result.push(resolved);
            });
            return result;
        }
        /** Loads a source file from disk (or the cache). */
        getSourceFile(fileName, languageVersion, onError) {
            return perfTrace.wrap(`getSourceFile ${fileName}`, () => {
                const sf = this.fileLoader.loadFile(fileName, fileName, languageVersion);
                if (!/\.d\.tsx?$/.test(fileName) &&
                    (this.options.module === ts.ModuleKind.AMD ||
                        this.options.module === ts.ModuleKind.UMD)) {
                    const moduleName = this.amdModuleName(sf);
                    if (sf.moduleName === moduleName || !moduleName)
                        return sf;
                    if (sf.moduleName) {
                        throw new Error(`ERROR: ${sf.fileName} ` +
                            `contains a module name declaration ${sf.moduleName} ` +
                            `which would be overwritten with ${moduleName} ` +
                            `by Bazel's TypeScript compiler.`);
                    }
                    // Setting the moduleName is equivalent to the original source having a
                    // ///<amd-module name="some/name"/> directive
                    sf.moduleName = moduleName;
                }
                return sf;
            });
        }
        writeFile(fileName, content, writeByteOrderMark, onError, sourceFiles) {
            perfTrace.wrap(`writeFile ${fileName}`, () => this.writeFileImpl(fileName, content, writeByteOrderMark, onError, sourceFiles));
        }
        writeFileImpl(fileName, content, writeByteOrderMark, onError, sourceFiles) {
            // Workaround https://github.com/Microsoft/TypeScript/issues/18648
            // This bug is fixed in TS 2.9
            const version = ts.versionMajorMinor;
            const [major, minor] = version.split('.').map(s => Number(s));
            const workaroundNeeded = major <= 2 && minor <= 8;
            if (workaroundNeeded &&
                (this.options.module === ts.ModuleKind.AMD ||
                    this.options.module === ts.ModuleKind.UMD) &&
                fileName.endsWith('.d.ts') && sourceFiles && sourceFiles.length > 0 &&
                sourceFiles[0].moduleName) {
                content =
                    `/// <amd-module name="${sourceFiles[0].moduleName}" />\n${content}`;
            }
            fileName = this.flattenOutDir(fileName);
            if (this.bazelOpts.isJsTranspilation) {
                if (this.bazelOpts.transpiledJsOutputFileName) {
                    fileName = this.bazelOpts.transpiledJsOutputFileName;
                }
                else {
                    // Strip the input directory path off of fileName to get the logical
                    // path within the input directory.
                    fileName =
                        path.relative(this.bazelOpts.transpiledJsInputDirectory, fileName);
                    // Then prepend the output directory name.
                    fileName =
                        path.join(this.bazelOpts.transpiledJsOutputDirectory, fileName);
                }
            }
            else if (!this.bazelOpts.es5Mode) {
                // Write ES6 transpiled files to *.mjs.
                if (this.bazelOpts.locale) {
                    // i18n paths are required to end with __locale.js so we put
                    // the .closure segment before the __locale
                    fileName = fileName.replace(/(__[^\.]+)?\.js$/, '.closure$1.js');
                }
                else {
                    fileName = fileName.replace(/\.js$/, '.mjs');
                }
            }
            // Prepend the output directory.
            fileName = path.join(this.options.outDir, fileName);
            // Our file cache is based on mtime - so avoid writing files if they
            // did not change.
            if (!fs.existsSync(fileName) ||
                fs.readFileSync(fileName, 'utf-8') !== content) {
                this.delegate.writeFile(fileName, content, writeByteOrderMark, onError, sourceFiles);
            }
        }
        /**
         * Performance optimization: don't try to stat files we weren't explicitly
         * given as inputs.
         * This also allows us to disable Bazel sandboxing, without accidentally
         * reading .ts inputs when .d.ts inputs are intended.
         * Note that in worker mode, the file cache will also guard against arbitrary
         * file reads.
         */
        fileExists(filePath) {
            // Under Bazel, users do not declare deps[] on their node_modules.
            // This means that we do not list all the needed .d.ts files in the files[]
            // section of tsconfig.json, and that is what populates the knownFiles set.
            // In addition, the node module resolver may need to read package.json files
            // and these are not permitted in the files[] section.
            // So we permit reading node_modules/* from action inputs, even though this
            // can include data[] dependencies and is broader than we would like.
            // This should only be enabled under Bazel, not Blaze.
            if (this.allowActionInputReads && filePath.indexOf('/node_modules/') >= 0) {
                const result = this.fileLoader.fileExists(filePath);
                if (worker_1.DEBUG && !result && this.delegate.fileExists(filePath)) {
                    worker_1.debug("Path exists, but is not registered in the cache", filePath);
                    Object.keys(this.fileLoader.cache.lastDigests).forEach(k => {
                        if (k.endsWith(path.basename(filePath))) {
                            worker_1.debug("  Maybe you meant to load from", k);
                        }
                    });
                }
                return result;
            }
            return this.knownFiles.has(filePath);
        }
        getDefaultLibLocation() {
            // Since we override getDefaultLibFileName below, we must also provide the
            // directory containing the file.
            // Otherwise TypeScript looks in C:\lib.xxx.d.ts for the default lib.
            return path.dirname(this.getDefaultLibFileName({ target: ts.ScriptTarget.ES5 }));
        }
        getDefaultLibFileName(options) {
            if (this.bazelOpts.nodeModulesPrefix) {
                return path.join(this.bazelOpts.nodeModulesPrefix, 'typescript/lib', ts.getDefaultLibFileName({ target: ts.ScriptTarget.ES5 }));
            }
            return this.delegate.getDefaultLibFileName(options);
        }
        realpath(s) {
            // tsc-wrapped relies on string matching of file paths for things like the
            // file cache and for strict deps checking.
            // TypeScript will try to resolve symlinks during module resolution which
            // makes our checks fail: the path we resolved as an input isn't the same
            // one the module resolver will look for.
            // See https://github.com/Microsoft/TypeScript/pull/12020
            // So we simply turn off symlink resolution.
            return s;
        }
        // Delegate everything else to the original compiler host.
        getCanonicalFileName(path) {
            return this.delegate.getCanonicalFileName(path);
        }
        getCurrentDirectory() {
            return this.delegate.getCurrentDirectory();
        }
        useCaseSensitiveFileNames() {
            return this.delegate.useCaseSensitiveFileNames();
        }
        getNewLine() {
            return this.delegate.getNewLine();
        }
        getDirectories(path) {
            return this.delegate.getDirectories ? this.delegate.getDirectories(path) :
                [];
        }
        readFile(fileName) {
            return this.delegate.readFile(fileName);
        }
        trace(s) {
            console.error(s);
        }
    }
    exports.CompilerHost = CompilerHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNjX3dyYXBwZWQvY29tcGlsZXJfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLHlCQUF5QjtJQUN6Qiw2QkFBNkI7SUFFN0IsaUNBQWlDO0lBR2pDLDBDQUEwQztJQUUxQyxxQ0FBc0M7SUFrQnRDLFNBQWdCLGVBQWUsQ0FBQyxPQUEyQjtRQUN6RCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7U0FDM0U7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7U0FDMUU7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7U0FDekU7UUFDRCxPQUFPLE9BQXlCLENBQUM7SUFDbkMsQ0FBQztJQVhELDBDQVdDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxTQUF1QjtRQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQjtZQUFFLE9BQU87UUFFekMsSUFBSSxTQUFTLENBQUMsb0JBQW9CO1lBQzlCLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzdDLE1BQU0sSUFBSSxLQUFLLENBQ1gsd0RBQXdEO2dCQUN4RCxvQ0FBb0MsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQywwQkFBMEI7WUFDckMsQ0FBQyxTQUFTLENBQUMsMkJBQTJCLEVBQUU7WUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FDWCxpRUFBaUU7Z0JB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QUFDLENBQUMsQ0FBQztRQUNuQixDQUFDO0tBQ0Y7SUF2aUJELG9DQXVpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHNpY2tsZSBmcm9tICd0c2lja2xlJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0ZpbGVMb2FkZXJ9IGZyb20gJy4vY2FjaGUnO1xuaW1wb3J0ICogYXMgcGVyZlRyYWNlIGZyb20gJy4vcGVyZl90cmFjZSc7XG5pbXBvcnQge0JhemVsT3B0aW9uc30gZnJvbSAnLi90c2NvbmZpZyc7XG5pbXBvcnQge0RFQlVHLCBkZWJ1Z30gZnJvbSAnLi93b3JrZXInO1xuXG5leHBvcnQgdHlwZSBNb2R1bGVSZXNvbHZlciA9XG4gICAgKG1vZHVsZU5hbWU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU6IHN0cmluZyxcbiAgICAgY29tcGlsZXJPcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMsIGhvc3Q6IHRzLk1vZHVsZVJlc29sdXRpb25Ib3N0KSA9PlxuICAgICAgICB0cy5SZXNvbHZlZE1vZHVsZVdpdGhGYWlsZWRMb29rdXBMb2NhdGlvbnM7XG5cbi8qKlxuICogTmFycm93cyBkb3duIHRoZSB0eXBlIG9mIHNvbWUgcHJvcGVydGllcyBmcm9tIG5vbi1vcHRpb25hbCB0byByZXF1aXJlZCwgc29cbiAqIHRoYXQgd2UgZG8gbm90IG5lZWQgdG8gY2hlY2sgcHJlc2VuY2UgYmVmb3JlIGVhY2ggYWNjZXNzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJhemVsVHNPcHRpb25zIGV4dGVuZHMgdHMuQ29tcGlsZXJPcHRpb25zIHtcbiAgcm9vdERpcnM6IHN0cmluZ1tdO1xuICByb290RGlyOiBzdHJpbmc7XG4gIG91dERpcjogc3RyaW5nO1xuICB0eXBlUm9vdHM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFycm93VHNPcHRpb25zKG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyk6IEJhemVsVHNPcHRpb25zIHtcbiAgaWYgKCFvcHRpb25zLnJvb3REaXJzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBjb21waWxlck9wdGlvbnMucm9vdERpcnMgc2hvdWxkIGJlIHNldCBieSB0c2NvbmZpZy5iemxgKTtcbiAgfVxuICBpZiAoIW9wdGlvbnMucm9vdERpcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgY29tcGlsZXJPcHRpb25zLnJvb3REaXIgc2hvdWxkIGJlIHNldCBieSB0c2NvbmZpZy5iemxgKTtcbiAgfVxuICBpZiAoIW9wdGlvbnMub3V0RGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBjb21waWxlck9wdGlvbnMub3V0RGlyIHNob3VsZCBiZSBzZXQgYnkgdHNjb25maWcuYnpsYCk7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnMgYXMgQmF6ZWxUc09wdGlvbnM7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQmF6ZWxPcHRpb25zKGJhemVsT3B0czogQmF6ZWxPcHRpb25zKSB7XG4gIGlmICghYmF6ZWxPcHRzLmlzSnNUcmFuc3BpbGF0aW9uKSByZXR1cm47XG5cbiAgaWYgKGJhemVsT3B0cy5jb21waWxhdGlvblRhcmdldFNyYyAmJlxuICAgICAgYmF6ZWxPcHRzLmNvbXBpbGF0aW9uVGFyZ2V0U3JjLmxlbmd0aCA+IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdJbiBKUyB0cmFuc3BpbGF0aW9uIG1vZGUsIG9ubHkgb25lIGZpbGUgY2FuIGFwcGVhciBpbiAnICtcbiAgICAgICAgJ2JhemVsT3B0aW9ucy5jb21waWxhdGlvblRhcmdldFNyYy4nKTtcbiAgfVxuXG4gIGlmICghYmF6ZWxPcHRzLnRyYW5zcGlsZWRKc091dHB1dEZpbGVOYW1lICYmXG4gICAgICAhYmF6ZWxPcHRzLnRyYW5zcGlsZWRKc091dHB1dERpcmVjdG9yeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0luIEpTIHRyYW5zcGlsYXRpb24gbW9kZSwgZWl0aGVyIHRyYW5zcGlsZWRKc091dHB1dEZpbGVOYW1lIG9yICcgK1xuICAgICAgICAndHJhbnNwaWxlZEpzT3V0cHV0RGlyZWN0b3J5IG11c3QgYmUgc3BlY2lmaWVkIGluIHRzY29uZmlnLicpO1xuICB9XG5cbiAgaWYgKGJhemVsT3B0cy50cmFuc3BpbGVkSnNPdXRwdXRGaWxlTmFtZSAmJlxuICAgICAgYmF6ZWxPcHRzLnRyYW5zcGlsZWRKc091dHB1dERpcmVjdG9yeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0luIEpTIHRyYW5zcGlsYXRpb24gbW9kZSwgY2Fubm90IHNldCBib3RoICcgK1xuICAgICAgICAndHJhbnNwaWxlZEpzT3V0cHV0RmlsZU5hbWUgYW5kIHRyYW5zcGlsZWRKc091dHB1dERpcmVjdG9yeS4nKTtcbiAgfVxufVxuXG5jb25zdCBTT1VSQ0VfRVhUID0gLygoXFwuZCk/XFwudHN4P3xcXC5qcykkLztcblxuLyoqXG4gKiBDb21waWxlckhvc3QgdGhhdCBrbm93cyBob3cgdG8gY2FjaGUgcGFyc2VkIGZpbGVzIHRvIGltcHJvdmUgY29tcGlsZSB0aW1lcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBpbGVySG9zdCBpbXBsZW1lbnRzIHRzLkNvbXBpbGVySG9zdCwgdHNpY2tsZS5Uc2lja2xlSG9zdCB7XG4gIC8qKlxuICAgKiBMb29rdXAgdGFibGUgdG8gYW5zd2VyIGZpbGUgc3RhdCdzIHdpdGhvdXQgbG9va2luZyBvbiBkaXNrLlxuICAgKi9cbiAgcHJpdmF0ZSBrbm93bkZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgLyoqXG4gICAqIHJvb3REaXJzIHJlbGF0aXZlIHRvIHRoZSByb290RGlyLCBlZyBcImJhemVsLW91dC9sb2NhbC1mYXN0YnVpbGQvYmluXCJcbiAgICovXG4gIHByaXZhdGUgcmVsYXRpdmVSb290czogc3RyaW5nW107XG5cbiAgZ2V0Q2FuY2VsYXRpb25Ub2tlbj86ICgpID0+IHRzLkNhbmNlbGxhdGlvblRva2VuO1xuICBkaXJlY3RvcnlFeGlzdHM/OiAoZGlyOiBzdHJpbmcpID0+IGJvb2xlYW47XG5cbiAgZ29vZ21vZHVsZTogYm9vbGVhbjtcbiAgZXM1TW9kZTogYm9vbGVhbjtcbiAgcHJlbHVkZTogc3RyaW5nO1xuICB1bnR5cGVkOiBib29sZWFuO1xuICB0eXBlQmxhY2tMaXN0UGF0aHM6IFNldDxzdHJpbmc+O1xuICB0cmFuc2Zvcm1EZWNvcmF0b3JzOiBib29sZWFuO1xuICB0cmFuc2Zvcm1UeXBlc1RvQ2xvc3VyZTogYm9vbGVhbjtcbiAgYWRkRHRzQ2x1dHpBbGlhc2VzOiBib29sZWFuO1xuICBpc0pzVHJhbnNwaWxhdGlvbjogYm9vbGVhbjtcbiAgcHJvdmlkZUV4dGVybmFsTW9kdWxlRHRzTmFtZXNwYWNlOiBib29sZWFuO1xuICBvcHRpb25zOiBCYXplbFRzT3B0aW9ucztcbiAgbW9kdWxlUmVzb2x1dGlvbkhvc3Q6IHRzLk1vZHVsZVJlc29sdXRpb25Ib3N0ID0gdGhpcztcbiAgLy8gVE9ETyhldmFubSk6IGRlbGV0ZSB0aGlzIG9uY2UgdHNpY2tsZSBpcyB1cGRhdGVkLlxuICBob3N0OiB0cy5Nb2R1bGVSZXNvbHV0aW9uSG9zdCA9IHRoaXM7XG4gIHByaXZhdGUgYWxsb3dBY3Rpb25JbnB1dFJlYWRzID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpbnB1dEZpbGVzOiBzdHJpbmdbXSwgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLFxuICAgICAgcmVhZG9ubHkgYmF6ZWxPcHRzOiBCYXplbE9wdGlvbnMsIHByaXZhdGUgZGVsZWdhdGU6IHRzLkNvbXBpbGVySG9zdCxcbiAgICAgIHByaXZhdGUgZmlsZUxvYWRlcjogRmlsZUxvYWRlcixcbiAgICAgIHByaXZhdGUgbW9kdWxlUmVzb2x2ZXI6IE1vZHVsZVJlc29sdmVyID0gdHMucmVzb2x2ZU1vZHVsZU5hbWUpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBuYXJyb3dUc09wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5yZWxhdGl2ZVJvb3RzID1cbiAgICAgICAgdGhpcy5vcHRpb25zLnJvb3REaXJzLm1hcChyID0+IHBhdGgucmVsYXRpdmUodGhpcy5vcHRpb25zLnJvb3REaXIsIHIpKTtcbiAgICBpbnB1dEZpbGVzLmZvckVhY2goKGYpID0+IHtcbiAgICAgIHRoaXMua25vd25GaWxlcy5hZGQoZik7XG4gICAgfSk7XG5cbiAgICAvLyBnZXRDYW5jZWxhdGlvblRva2VuIGlzIGFuIG9wdGlvbmFsIG1ldGhvZCBvbiB0aGUgZGVsZWdhdGUuIElmIHdlXG4gICAgLy8gdW5jb25kaXRpb25hbGx5IGltcGxlbWVudCB0aGUgbWV0aG9kLCB3ZSB3aWxsIGJlIGZvcmNlZCB0byByZXR1cm4gbnVsbCxcbiAgICAvLyBpbiB0aGUgYWJzZW5zZSBvZiB0aGUgZGVsZWdhdGUgbWV0aG9kLiBUaGF0IHdvbid0IG1hdGNoIHRoZSByZXR1cm4gdHlwZS5cbiAgICAvLyBJbnN0ZWFkLCB3ZSBvcHRpb25hbGx5IHNldCBhIGZ1bmN0aW9uIHRvIGEgZmllbGQgd2l0aCB0aGUgc2FtZSBuYW1lLlxuICAgIGlmIChkZWxlZ2F0ZSAmJiBkZWxlZ2F0ZS5nZXRDYW5jZWxsYXRpb25Ub2tlbikge1xuICAgICAgdGhpcy5nZXRDYW5jZWxhdGlvblRva2VuID0gZGVsZWdhdGUuZ2V0Q2FuY2VsbGF0aW9uVG9rZW4uYmluZChkZWxlZ2F0ZSk7XG4gICAgfVxuXG4gICAgLy8gT3ZlcnJpZGUgZGlyZWN0b3J5RXhpc3RzIHNvIHRoYXQgVHlwZVNjcmlwdCBjYW4gYXV0b21hdGljYWxseVxuICAgIC8vIGluY2x1ZGUgZ2xvYmFsIHR5cGluZ3MgZnJvbSBub2RlX21vZHVsZXMvQHR5cGVzXG4gICAgLy8gc2VlIGdldEF1dG9tYXRpY1R5cGVEaXJlY3RpdmVOYW1lcyBpblxuICAgIC8vIFR5cGVTY3JpcHQ6c3JjL2NvbXBpbGVyL21vZHVsZU5hbWVSZXNvbHZlclxuICAgIGlmICh0aGlzLmFsbG93QWN0aW9uSW5wdXRSZWFkcyAmJiBkZWxlZ2F0ZSAmJiBkZWxlZ2F0ZS5kaXJlY3RvcnlFeGlzdHMpIHtcbiAgICAgIHRoaXMuZGlyZWN0b3J5RXhpc3RzID0gZGVsZWdhdGUuZGlyZWN0b3J5RXhpc3RzLmJpbmQoZGVsZWdhdGUpO1xuICAgIH1cblxuICAgIHZhbGlkYXRlQmF6ZWxPcHRpb25zKGJhemVsT3B0cyk7XG4gICAgdGhpcy5nb29nbW9kdWxlID0gYmF6ZWxPcHRzLmdvb2dtb2R1bGU7XG4gICAgdGhpcy5lczVNb2RlID0gYmF6ZWxPcHRzLmVzNU1vZGU7XG4gICAgdGhpcy5wcmVsdWRlID0gYmF6ZWxPcHRzLnByZWx1ZGU7XG4gICAgdGhpcy51bnR5cGVkID0gYmF6ZWxPcHRzLnVudHlwZWQ7XG4gICAgdGhpcy50eXBlQmxhY2tMaXN0UGF0aHMgPSBuZXcgU2V0KGJhemVsT3B0cy50eXBlQmxhY2tMaXN0UGF0aHMpO1xuICAgIHRoaXMudHJhbnNmb3JtRGVjb3JhdG9ycyA9IGJhemVsT3B0cy50c2lja2xlO1xuICAgIHRoaXMudHJhbnNmb3JtVHlwZXNUb0Nsb3N1cmUgPSBiYXplbE9wdHMudHNpY2tsZTtcbiAgICB0aGlzLmFkZER0c0NsdXR6QWxpYXNlcyA9IGJhemVsT3B0cy5hZGREdHNDbHV0ekFsaWFzZXM7XG4gICAgdGhpcy5pc0pzVHJhbnNwaWxhdGlvbiA9IEJvb2xlYW4oYmF6ZWxPcHRzLmlzSnNUcmFuc3BpbGF0aW9uKTtcbiAgICB0aGlzLnByb3ZpZGVFeHRlcm5hbE1vZHVsZUR0c05hbWVzcGFjZSA9ICFiYXplbE9wdHMuaGFzSW1wbGVtZW50YXRpb247XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBwb3RlbnRpYWxseSBhYnNvbHV0ZSBpbnB1dCBmaWxlIHBhdGggKHR5cGljYWxseSAudHMpLCByZXR1cm5zXG4gICAqIHRoZSByZWxhdGl2ZSBvdXRwdXQgcGF0aC4gRm9yIGV4YW1wbGUsIGZvclxuICAgKiAvcGF0aC90by9yb290L2JsYXplLW91dC9rOC1mYXN0YnVpbGQvZ2VuZmlsZXMvbXkvZmlsZS50cywgd2lsbCByZXR1cm5cbiAgICogbXkvZmlsZS5qcyBvciBteS9maWxlLm1qcyAoZGVwZW5kaW5nIG9uIEVTNSBtb2RlKS5cbiAgICovXG4gIHJlbGF0aXZlT3V0cHV0UGF0aChmaWxlTmFtZTogc3RyaW5nKSB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucm9vdERpcnNSZWxhdGl2ZShmaWxlTmFtZSk7XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoLyhcXC5kKT9cXC5banRdc3g/JC8sICcnKTtcbiAgICBpZiAoIXRoaXMuYmF6ZWxPcHRzLmVzNU1vZGUpIHJlc3VsdCArPSAnLmNsb3N1cmUnO1xuICAgIHJldHVybiByZXN1bHQgKyAnLmpzJztcbiAgfVxuXG4gIC8qKlxuICAgKiBXb3JrYXJvdW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvODI0NVxuICAgKiBXZSB1c2UgdGhlIGByb290RGlyc2AgcHJvcGVydHkgYm90aCBmb3IgbW9kdWxlIHJlc29sdXRpb24sXG4gICAqIGFuZCAqYWxzbyogdG8gZmxhdHRlbiB0aGUgc3RydWN0dXJlIG9mIHRoZSBvdXRwdXQgZGlyZWN0b3J5XG4gICAqIChhcyBgcm9vdERpcmAgd291bGQgZG8gZm9yIGEgc2luZ2xlIHJvb3QpLlxuICAgKiBUbyBkbyB0aGlzLCBsb29rIGZvciB0aGUgcGF0dGVybiBvdXREaXIvcmVsYXRpdmVSb290c1tpXS9wYXRoL3RvL2ZpbGVcbiAgICogb3IgcmVsYXRpdmVSb290c1tpXS9wYXRoL3RvL2ZpbGVcbiAgICogYW5kIHJlcGxhY2UgdGhhdCB3aXRoIHBhdGgvdG8vZmlsZVxuICAgKi9cbiAgZmxhdHRlbk91dERpcihmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gZmlsZU5hbWU7XG5cbiAgICAvLyBvdXREaXIvcmVsYXRpdmVSb290c1tpXS9wYXRoL3RvL2ZpbGUgLT4gcmVsYXRpdmVSb290c1tpXS9wYXRoL3RvL2ZpbGVcbiAgICBpZiAoZmlsZU5hbWUuc3RhcnRzV2l0aCh0aGlzLm9wdGlvbnMucm9vdERpcikpIHtcbiAgICAgIHJlc3VsdCA9IHBhdGgucmVsYXRpdmUodGhpcy5vcHRpb25zLm91dERpciwgZmlsZU5hbWUpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMucmVsYXRpdmVSb290cykge1xuICAgICAgLy8gcmVsYXRpdmVSb290c1tpXS9wYXRoL3RvL2ZpbGUgLT4gcGF0aC90by9maWxlXG4gICAgICBjb25zdCByZWwgPSBwYXRoLnJlbGF0aXZlKGRpciwgcmVzdWx0KTtcbiAgICAgIGlmICghcmVsLnN0YXJ0c1dpdGgoJy4uJykpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVsO1xuICAgICAgICAvLyByZWxhdGl2ZVJvb3RzIGlzIHNvcnRlZCBsb25nZXN0IGZpcnN0IHNvIHdlIGNhbiBzaG9ydC1jaXJjdWl0XG4gICAgICAgIC8vIGFmdGVyIHRoZSBmaXJzdCBtYXRjaFxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBBdm9pZCB1c2luZyB0c2lja2xlIG9uIGZpbGVzIHRoYXQgYXJlbid0IGluIHNyY3NbXSAqL1xuICBzaG91bGRTa2lwVHNpY2tsZVByb2Nlc3NpbmcoZmlsZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmJhemVsT3B0cy5pc0pzVHJhbnNwaWxhdGlvbiB8fFxuICAgICAgICAgICB0aGlzLmJhemVsT3B0cy5jb21waWxhdGlvblRhcmdldFNyYy5pbmRleE9mKGZpbGVOYW1lKSA9PT0gLTE7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZmlsZSBpcyBleHBlY3RlZCB0byBiZSBpbXBvcnRlZCB1c2luZyBhIG5hbWVkIG1vZHVsZSAqL1xuICBzaG91bGROYW1lTW9kdWxlKGZpbGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5iYXplbE9wdHMuY29tcGlsYXRpb25UYXJnZXRTcmMuaW5kZXhPZihmaWxlTmFtZSkgIT09IC0xO1xuICB9XG5cbiAgLyoqIEFsbG93cyBzdXBwcmVzc2luZyB3YXJuaW5ncyBmb3Igc3BlY2lmaWMga25vd24gbGlicmFyaWVzICovXG4gIHNob3VsZElnbm9yZVdhcm5pbmdzRm9yUGF0aChmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYmF6ZWxPcHRzLmlnbm9yZVdhcm5pbmdQYXRocy5zb21lKFxuICAgICAgICBwID0+ICEhZmlsZVBhdGgubWF0Y2gobmV3IFJlZ0V4cChwKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIGZpbGVOYW1lVG9Nb2R1bGVJZCBnaXZlcyB0aGUgbW9kdWxlIElEIGZvciBhbiBpbnB1dCBzb3VyY2UgZmlsZSBuYW1lLlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgYW4gaW5wdXQgc291cmNlIGZpbGUgbmFtZSwgZS5nLlxuICAgKiAgICAgL3Jvb3QvZGlyL2JhemVsLW91dC9ob3N0L2Jpbi9teS9maWxlLnRzLlxuICAgKiBAcmV0dXJuIHRoZSBjYW5vbmljYWwgcGF0aCBvZiBhIGZpbGUgd2l0aGluIGJsYXplLCB3aXRob3V0IC9nZW5maWxlcy8gb3JcbiAgICogICAgIC9iaW4vIHBhdGggcGFydHMsIGV4Y2x1ZGluZyBhIGZpbGUgZXh0ZW5zaW9uLiBGb3IgZXhhbXBsZSwgXCJteS9maWxlXCIuXG4gICAqL1xuICBmaWxlTmFtZVRvTW9kdWxlSWQoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucmVsYXRpdmVPdXRwdXRQYXRoKFxuICAgICAgICBmaWxlTmFtZS5zdWJzdHJpbmcoMCwgZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFR5cGVTY3JpcHQgU291cmNlRmlsZSdzIGhhdmUgYSBwYXRoIHdpdGggdGhlIHJvb3REaXJzW2ldIHN0aWxsIHByZXNlbnQsIGVnLlxuICAgKiAvYnVpbGQvd29yay9iYXplbC1vdXQvbG9jYWwtZmFzdGJ1aWxkL2Jpbi9wYXRoL3RvL2ZpbGVcbiAgICogQHJldHVybiB0aGUgcGF0aCB3aXRob3V0IGFueSByb290RGlycywgZWcuIHBhdGgvdG8vZmlsZVxuICAgKi9cbiAgcHJpdmF0ZSByb290RGlyc1JlbGF0aXZlKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGZvciAoY29uc3Qgcm9vdCBvZiB0aGlzLm9wdGlvbnMucm9vdERpcnMpIHtcbiAgICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKHJvb3QpKSB7XG4gICAgICAgIC8vIHJvb3REaXJzIGFyZSBzb3J0ZWQgbG9uZ2VzdC1maXJzdCwgc28gc2hvcnQtY2lyY3VpdCB0aGUgaXRlcmF0aW9uXG4gICAgICAgIC8vIHNlZSB0c2NvbmZpZy50cy5cbiAgICAgICAgcmV0dXJuIHBhdGgucG9zaXgucmVsYXRpdmUocm9vdCwgZmlsZU5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsZU5hbWU7XG4gIH1cblxuICAvKipcbiAgICogTWFzc2FnZXMgZmlsZSBuYW1lcyBpbnRvIHZhbGlkIGdvb2cubW9kdWxlIG5hbWVzOlxuICAgKiAtIHJlc29sdmVzIHJlbGF0aXZlIHBhdGhzIHRvIHRoZSBnaXZlbiBjb250ZXh0XG4gICAqIC0gcmVzb2x2ZXMgbm9uLXJlbGF0aXZlIHBhdGhzIHdoaWNoIHRha2VzIG1vZHVsZV9yb290IGludG8gYWNjb3VudFxuICAgKiAtIHJlcGxhY2VzICcvJyB3aXRoICcuJyBpbiB0aGUgJzx3b3Jrc3BhY2U+JyBuYW1lc3BhY2VcbiAgICogLSByZXBsYWNlIGZpcnN0IGNoYXIgaWYgbm9uLWFscGhhXG4gICAqIC0gcmVwbGFjZSBzdWJzZXF1ZW50IG5vbi1hbHBoYSBudW1lcmljIGNoYXJzXG4gICAqL1xuICBwYXRoVG9Nb2R1bGVOYW1lKGNvbnRleHQ6IHN0cmluZywgaW1wb3J0UGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyB0c2lja2xlIGhhbmRzIHVzIGFuIG91dHB1dCBwYXRoLCB3ZSBuZWVkIHRvIG1hcCBpdCBiYWNrIHRvIGEgc291cmNlXG4gICAgLy8gcGF0aCBpbiBvcmRlciB0byBkbyBtb2R1bGUgcmVzb2x1dGlvbiB3aXRoIGl0LlxuICAgIC8vIG91dERpci9yZWxhdGl2ZVJvb3RzW2ldL3BhdGgvdG8vZmlsZSAtPlxuICAgIC8vIHJvb3REaXIvcmVsYXRpdmVSb290c1tpXS9wYXRoL3RvL2ZpbGVcbiAgICBpZiAoY29udGV4dC5zdGFydHNXaXRoKHRoaXMub3B0aW9ucy5vdXREaXIpKSB7XG4gICAgICBjb250ZXh0ID0gcGF0aC5qb2luKFxuICAgICAgICAgIHRoaXMub3B0aW9ucy5yb290RGlyLCBwYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5vdXREaXIsIGNvbnRleHQpKTtcbiAgICB9XG5cbiAgICAvLyBUcnkgdG8gZ2V0IHRoZSByZXNvbHZlZCBwYXRoIG5hbWUgZnJvbSBUUyBjb21waWxlciBob3N0IHdoaWNoIGNhblxuICAgIC8vIGhhbmRsZSByZXNvbHV0aW9uIGZvciBsaWJyYXJpZXMgd2l0aCBtb2R1bGVfcm9vdCBsaWtlIHJ4anMgYW5kIEBhbmd1bGFyLlxuICAgIGxldCByZXNvbHZlZFBhdGg6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgICBjb25zdCByZXNvbHZlZCA9XG4gICAgICAgIHRoaXMubW9kdWxlUmVzb2x2ZXIoaW1wb3J0UGF0aCwgY29udGV4dCwgdGhpcy5vcHRpb25zLCB0aGlzKTtcbiAgICBpZiAocmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzb2x2ZWRNb2R1bGUgJiZcbiAgICAgICAgcmVzb2x2ZWQucmVzb2x2ZWRNb2R1bGUucmVzb2x2ZWRGaWxlTmFtZSkge1xuICAgICAgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZWQucmVzb2x2ZWRNb2R1bGUucmVzb2x2ZWRGaWxlTmFtZTtcbiAgICAgIC8vIC9idWlsZC93b3JrL2JhemVsLW91dC9sb2NhbC1mYXN0YnVpbGQvYmluL3BhdGgvdG8vZmlsZSAtPlxuICAgICAgLy8gcGF0aC90by9maWxlXG4gICAgICByZXNvbHZlZFBhdGggPSB0aGlzLnJvb3REaXJzUmVsYXRpdmUocmVzb2x2ZWRQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaW1wb3J0UGF0aCBjYW4gYmUgYW4gYWJzb2x1dGUgZmlsZSBwYXRoIGluIGdvb2dsZTMuXG4gICAgICAvLyBUcnkgdG8gdHJpbSBpdCBhcyBhIHBhdGggcmVsYXRpdmUgdG8gYmluIGFuZCBnZW5maWxlcywgYW5kIGlmIHNvLFxuICAgICAgLy8gaGFuZGxlIGl0cyBmaWxlIGV4dGVuc2lvbiBpbiB0aGUgYmxvY2sgYmVsb3cgYW5kIHByZXBlbmQgdGhlIHdvcmtzcGFjZVxuICAgICAgLy8gbmFtZS5cbiAgICAgIGNvbnN0IHRyaW1tZWQgPSB0aGlzLnJvb3REaXJzUmVsYXRpdmUoaW1wb3J0UGF0aCk7XG4gICAgICBpZiAodHJpbW1lZCAhPT0gaW1wb3J0UGF0aCkge1xuICAgICAgICByZXNvbHZlZFBhdGggPSB0cmltbWVkO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVzb2x2ZWRQYXRoKSB7XG4gICAgICAvLyBTdHJpcCBmaWxlIGV4dGVuc2lvbnMuXG4gICAgICBpbXBvcnRQYXRoID0gcmVzb2x2ZWRQYXRoLnJlcGxhY2UoU09VUkNFX0VYVCwgJycpO1xuICAgICAgLy8gTWFrZSBzdXJlIGFsbCBtb2R1bGUgbmFtZXMgaW5jbHVkZSB0aGUgd29ya3NwYWNlIG5hbWUuXG4gICAgICBpZiAoaW1wb3J0UGF0aC5pbmRleE9mKHRoaXMuYmF6ZWxPcHRzLndvcmtzcGFjZU5hbWUpICE9PSAwKSB7XG4gICAgICAgIGltcG9ydFBhdGggPSBwYXRoLnBvc2l4LmpvaW4odGhpcy5iYXplbE9wdHMud29ya3NwYWNlTmFtZSwgaW1wb3J0UGF0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBfX3tMT0NBTEV9IGZyb20gdGhlIG1vZHVsZSBuYW1lLlxuICAgIGlmICh0aGlzLmJhemVsT3B0cy5sb2NhbGUpIHtcbiAgICAgIGNvbnN0IHN1ZmZpeCA9ICdfXycgKyB0aGlzLmJhemVsT3B0cy5sb2NhbGUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChpbXBvcnRQYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoc3VmZml4KSkge1xuICAgICAgICBpbXBvcnRQYXRoID0gaW1wb3J0UGF0aC5zdWJzdHJpbmcoMCwgaW1wb3J0UGF0aC5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXBsYWNlIGNoYXJhY3RlcnMgbm90IHN1cHBvcnRlZCBieSBnb29nLm1vZHVsZSBhbmQgJy4nIHdpdGhcbiAgICAvLyAnJDxIZXggY2hhciBjb2RlPicgc28gdGhhdCB0aGUgb3JpZ2luYWwgbW9kdWxlIG5hbWUgY2FuIGJlIHJlLW9idGFpbmVkXG4gICAgLy8gd2l0aG91dCBhbnkgbG9zcy5cbiAgICAvLyBTZWUgZ29vZy5WQUxJRF9NT0RVTEVfUkVfIGluIENsb3N1cmUncyBiYXNlLmpzIGZvciBjaGFyYWN0ZXJzIHN1cHBvcnRlZFxuICAgIC8vIGJ5IGdvb2dsZS5tb2R1bGUuXG5cbiAgICBjb25zdCBlc2NhcGUgPSAoYzogc3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4gJyQnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KTtcbiAgICB9O1xuICAgIGNvbnN0IG1vZHVsZU5hbWUgPSBpbXBvcnRQYXRoLnJlcGxhY2UoL15bMC05XXxbXmEtekEtWl8wLTlfL10vZywgZXNjYXBlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnLicpO1xuICAgIHJldHVybiBtb2R1bGVOYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGZpbGUgcGF0aCBpbnRvIGEgdmFsaWQgQU1EIG1vZHVsZSBuYW1lLlxuICAgKlxuICAgKiBBbiBBTUQgbW9kdWxlIGNhbiBoYXZlIGFuIGFyYml0cmFyeSBuYW1lLCBzbyB0aGF0IGl0IGlzIHJlcXVpcmUnZCBieSBuYW1lXG4gICAqIHJhdGhlciB0aGFuIGJ5IHBhdGguIFNlZSBodHRwOi8vcmVxdWlyZWpzLm9yZy9kb2NzL3doeWFtZC5odG1sI25hbWVkbW9kdWxlc1xuICAgKlxuICAgKiBcIkhvd2V2ZXIsIHRvb2xzIHRoYXQgY29tYmluZSBtdWx0aXBsZSBtb2R1bGVzIHRvZ2V0aGVyIGZvciBwZXJmb3JtYW5jZSBuZWVkXG4gICAqICBhIHdheSB0byBnaXZlIG5hbWVzIHRvIGVhY2ggbW9kdWxlIGluIHRoZSBvcHRpbWl6ZWQgZmlsZS4gRm9yIHRoYXQsIEFNRFxuICAgKiAgYWxsb3dzIGEgc3RyaW5nIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byBkZWZpbmUoKVwiXG4gICAqL1xuICBhbWRNb2R1bGVOYW1lKHNmOiB0cy5Tb3VyY2VGaWxlKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLnNob3VsZE5hbWVNb2R1bGUoc2YuZmlsZU5hbWUpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIC8vIC9idWlsZC93b3JrL2JhemVsLW91dC9sb2NhbC1mYXN0YnVpbGQvYmluL3BhdGgvdG8vZmlsZS50c1xuICAgIC8vIC0+IHBhdGgvdG8vZmlsZVxuICAgIGxldCBmaWxlTmFtZSA9IHRoaXMucm9vdERpcnNSZWxhdGl2ZShzZi5maWxlTmFtZSkucmVwbGFjZShTT1VSQ0VfRVhULCAnJyk7XG5cbiAgICBsZXQgd29ya3NwYWNlID0gdGhpcy5iYXplbE9wdHMud29ya3NwYWNlTmFtZTtcblxuICAgIC8vIFdvcmthcm91bmQgaHR0cHM6Ly9naXRodWIuY29tL2JhemVsYnVpbGQvYmF6ZWwvaXNzdWVzLzEyNjJcbiAgICAvL1xuICAgIC8vIFdoZW4gdGhlIGZpbGUgY29tZXMgZnJvbSBhbiBleHRlcm5hbCBiYXplbCByZXBvc2l0b3J5LFxuICAgIC8vIGFuZCBUeXBlU2NyaXB0IHJlc29sdmVzIHJ1bmZpbGVzIHN5bWxpbmtzLCB0aGVuIHRoZSBwYXRoIHdpbGwgbG9vayBsaWtlXG4gICAgLy8gb3V0cHV0X2Jhc2UvZXhlY3Jvb3QvbG9jYWxfcmVwby9leHRlcm5hbC9hbm90aGVyX3JlcG8vZm9vL2JhclxuICAgIC8vIFdlIHdhbnQgdG8gbmFtZSBzdWNoIGEgbW9kdWxlIFwiYW5vdGhlcl9yZXBvL2Zvby9iYXJcIiBqdXN0IGFzIGl0IHdvdWxkIGJlXG4gICAgLy8gbmFtZWQgYnkgY29kZSBpbiB0aGF0IHJlcG9zaXRvcnkuXG4gICAgLy8gQXMgYSB3b3JrYXJvdW5kLCBjaGVjayBmb3IgdGhlIC9leHRlcm5hbC8gcGF0aCBzZWdtZW50LCBhbmQgZml4IHVwIHRoZVxuICAgIC8vIHdvcmtzcGFjZSBuYW1lIHRvIGJlIHRoZSBuYW1lIG9mIHRoZSBleHRlcm5hbCByZXBvc2l0b3J5LlxuICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKCdleHRlcm5hbC8nKSkge1xuICAgICAgY29uc3QgcGFydHMgPSBmaWxlTmFtZS5zcGxpdCgnLycpO1xuICAgICAgd29ya3NwYWNlID0gcGFydHNbMV07XG4gICAgICBmaWxlTmFtZSA9IHBhcnRzLnNsaWNlKDIpLmpvaW4oJy8nKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5iYXplbE9wdHMubW9kdWxlTmFtZSkge1xuICAgICAgY29uc3QgcmVsYXRpdmVGaWxlTmFtZSA9IHBhdGgucG9zaXgucmVsYXRpdmUodGhpcy5iYXplbE9wdHMucGFja2FnZSwgZmlsZU5hbWUpO1xuICAgICAgLy8gY2hlY2sgdGhhdCB0aGUgZmlsZU5hbWUgd2FzIGFjdHVhbGx5IHVuZGVybmVhdGggdGhlIHBhY2thZ2UgZGlyZWN0b3J5XG4gICAgICBpZiAoIXJlbGF0aXZlRmlsZU5hbWUuc3RhcnRzV2l0aCgnLi4nKSkge1xuICAgICAgICBpZiAodGhpcy5iYXplbE9wdHMubW9kdWxlUm9vdCkge1xuICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmJhemVsT3B0cy5tb2R1bGVSb290LnJlcGxhY2UoU09VUkNFX0VYVCwgJycpO1xuICAgICAgICAgIGlmIChyb290ID09PSByZWxhdGl2ZUZpbGVOYW1lIHx8XG4gICAgICAgICAgICAgIHBhdGgucG9zaXguam9pbihyb290LCAnaW5kZXgnKSA9PT0gcmVsYXRpdmVGaWxlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmF6ZWxPcHRzLm1vZHVsZU5hbWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFN1cHBvcnQgdGhlIGNvbW1vbiBjYXNlIG9mIGNvbW1vbmpzIGNvbnZlbnRpb24gdGhhdCBpbmRleCBpcyB0aGVcbiAgICAgICAgLy8gZGVmYXVsdCBtb2R1bGUgaW4gYSBkaXJlY3RvcnkuXG4gICAgICAgIC8vIFRoaXMgbWFrZXMgb3VyIG1vZHVsZSBuYW1pbmcgc2NoZW1lIG1vcmUgY29udmVudGlvbmFsIGFuZCBsZXRzIHVzZXJzXG4gICAgICAgIC8vIHJlZmVyIHRvIG1vZHVsZXMgd2l0aCB0aGUgbmF0dXJhbCBuYW1lIHRoZXkncmUgdXNlZCB0by5cbiAgICAgICAgaWYgKHJlbGF0aXZlRmlsZU5hbWUgPT09ICdpbmRleCcpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5iYXplbE9wdHMubW9kdWxlTmFtZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGF0aC5wb3NpeC5qb2luKHRoaXMuYmF6ZWxPcHRzLm1vZHVsZU5hbWUsIHJlbGF0aXZlRmlsZU5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKCdub2RlX21vZHVsZXMvJykpIHtcbiAgICAgIHJldHVybiBmaWxlTmFtZS5zdWJzdHJpbmcoJ25vZGVfbW9kdWxlcy8nLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgLy8gcGF0aC90by9maWxlIC0+XG4gICAgLy8gbXlXb3Jrc3BhY2UvcGF0aC90by9maWxlXG4gICAgcmV0dXJuIHBhdGgucG9zaXguam9pbih3b3Jrc3BhY2UsIGZpbGVOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyB0aGUgdHlwaW5ncyBmaWxlIGZyb20gYSBwYWNrYWdlIGF0IHRoZSBzcGVjaWZpZWQgcGF0aC4gSGVscGVyXG4gICAqIGZ1bmN0aW9uIHRvIGByZXNvbHZlVHlwZVJlZmVyZW5jZURpcmVjdGl2ZXNgLlxuICAgKi9cbiAgcHJpdmF0ZSByZXNvbHZlVHlwaW5nRnJvbURpcmVjdG9yeSh0eXBlUGF0aDogc3RyaW5nLCBwcmltYXJ5OiBib29sZWFuKTogdHMuUmVzb2x2ZWRUeXBlUmVmZXJlbmNlRGlyZWN0aXZlIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBMb29rcyBmb3IgdGhlIGB0eXBpbmdzYCBhdHRyaWJ1dGUgaW4gYSBwYWNrYWdlLmpzb24gZmlsZVxuICAgIC8vIGlmIGl0IGV4aXN0c1xuICAgIGNvbnN0IHBrZ0ZpbGUgPSBwYXRoLnBvc2l4LmpvaW4odHlwZVBhdGgsICdwYWNrYWdlLmpzb24nKTtcbiAgICBpZiAodGhpcy5maWxlRXhpc3RzKHBrZ0ZpbGUpKSB7XG4gICAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwa2dGaWxlLCAnVVRGLTgnKSk7XG4gICAgICBsZXQgdHlwaW5ncyA9IHBrZ1sndHlwaW5ncyddO1xuICAgICAgaWYgKHR5cGluZ3MpIHtcbiAgICAgICAgaWYgKHR5cGluZ3MgPT09ICcuJyB8fCB0eXBpbmdzID09PSAnLi8nKSB7XG4gICAgICAgICAgdHlwaW5ncyA9ICdpbmRleC5kLnRzJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXliZSA9IHBhdGgucG9zaXguam9pbih0eXBlUGF0aCwgdHlwaW5ncyk7XG4gICAgICAgIGlmICh0aGlzLmZpbGVFeGlzdHMobWF5YmUpKSB7XG4gICAgICAgICAgcmV0dXJuIHsgcHJpbWFyeSwgcmVzb2x2ZWRGaWxlTmFtZTogbWF5YmUgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvb2sgZm9yIGFuIGluZGV4LmQudHMgZmlsZSBpbiB0aGUgcGF0aFxuICAgIGNvbnN0IG1heWJlID0gcGF0aC5wb3NpeC5qb2luKHR5cGVQYXRoLCAnaW5kZXguZC50cycpO1xuICAgIGlmICh0aGlzLmZpbGVFeGlzdHMobWF5YmUpKSB7XG4gICAgICByZXR1cm4geyBwcmltYXJ5LCByZXNvbHZlZEZpbGVOYW1lOiBtYXliZSB9O1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGUgdGhlIGRlZmF1bHQgdHlwZXNjcmlwdCByZXNvbHZlVHlwZVJlZmVyZW5jZURpcmVjdGl2ZXMgZnVuY3Rpb24uXG4gICAqIFJlc29sdmVzIC8vLyA8cmVmZXJlbmNlIHR5cGVzPVwieFwiIC8+IGRpcmVjdGl2ZXMgdW5kZXIgYmF6ZWwuIFRoZSBkZWZhdWx0XG4gICAqIHR5cGVzY3JpcHQgc2Vjb25kYXJ5IHNlYXJjaCBiZWhhdmlvciBuZWVkcyB0byBiZSBvdmVycmlkZGVuIHRvIHN1cHBvcnRcbiAgICogbG9va2luZyB1bmRlciBgYmF6ZWxPcHRzLm5vZGVNb2R1bGVzUHJlZml4YFxuICAgKi9cbiAgcmVzb2x2ZVR5cGVSZWZlcmVuY2VEaXJlY3RpdmVzKG5hbWVzOiBzdHJpbmdbXSwgY29udGFpbmluZ0ZpbGU6IHN0cmluZyk6IHRzLlJlc29sdmVkVHlwZVJlZmVyZW5jZURpcmVjdGl2ZVtdIHtcbiAgICBpZiAoIXRoaXMuYWxsb3dBY3Rpb25JbnB1dFJlYWRzKSByZXR1cm4gW107XG4gICAgY29uc3QgcmVzdWx0OiB0cy5SZXNvbHZlZFR5cGVSZWZlcmVuY2VEaXJlY3RpdmVbXSA9IFtdO1xuICAgIG5hbWVzLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICBsZXQgcmVzb2x2ZWQ6IHRzLlJlc29sdmVkVHlwZVJlZmVyZW5jZURpcmVjdGl2ZSB8IHVuZGVmaW5lZDtcblxuICAgICAgLy8gcHJpbWFyeSBzZWFyY2hcbiAgICAgIHRoaXMub3B0aW9ucy50eXBlUm9vdHMuZm9yRWFjaCh0eXBlUm9vdCA9PiB7XG4gICAgICAgIGlmICghcmVzb2x2ZWQpIHtcbiAgICAgICAgICByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZVR5cGluZ0Zyb21EaXJlY3RvcnkocGF0aC5wb3NpeC5qb2luKHR5cGVSb290LCBuYW1lKSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBzZWNvbmRhcnkgc2VhcmNoXG4gICAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICAgIHJlc29sdmVkID0gdGhpcy5yZXNvbHZlVHlwaW5nRnJvbURpcmVjdG9yeShwYXRoLnBvc2l4LmpvaW4odGhpcy5iYXplbE9wdHMubm9kZU1vZHVsZXNQcmVmaXgsIG5hbWUpLCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFR5cGVzIG5vdCByZXNvbHZlZCBzaG91bGQgYmUgc2lsZW50bHkgaWdub3JlZC4gTGVhdmUgaXQgdG8gVHlwZXNjcmlwdFxuICAgICAgLy8gdG8gZWl0aGVyIGVycm9yIG91dCB3aXRoIFwiVFMyNjg4OiBDYW5ub3QgZmluZCB0eXBlIGRlZmluaXRpb24gZmlsZSBmb3JcbiAgICAgIC8vICdmb28nXCIgb3IgZm9yIHRoZSBidWlsZCB0byBmYWlsIGR1ZSB0byBhIG1pc3NpbmcgdHlwZSB0aGF0IGlzIHVzZWQuXG4gICAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICAgIGlmIChERUJVRykge1xuICAgICAgICAgIGRlYnVnKGBGYWlsZWQgdG8gcmVzb2x2ZSB0eXBlIHJlZmVyZW5jZSBkaXJlY3RpdmUgJyR7bmFtZX0nYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gSW4gdHlwZXNjcmlwdCAyLnggdGhlIHJldHVybiB0eXBlIGZvciB0aGlzIGZ1bmN0aW9uXG4gICAgICAvLyBpcyBgKHRzLlJlc29sdmVkVHlwZVJlZmVyZW5jZURpcmVjdGl2ZSB8IHVuZGVmaW5lZClbXWAgdGh1cyB3ZSBhY3R1YWxseVxuICAgICAgLy8gZG8gYWxsb3cgcmV0dXJuaW5nIGB1bmRlZmluZWRgIGluIHRoZSBhcnJheSBidXQgdGhlIGZ1bmN0aW9uIGlzIHR5cGVkXG4gICAgICAvLyBgKHRzLlJlc29sdmVkVHlwZVJlZmVyZW5jZURpcmVjdGl2ZSlbXWAgdG8gY29tcGlsZSB3aXRoIGJvdGggdHlwZXNjcmlwdFxuICAgICAgLy8gMi54IGFuZCAzLjAvMy4xIHdpdGhvdXQgZXJyb3IuIFR5cGVzY3JpcHQgMy4wLzMuMSBkbyBoYW5kbGUgdGhlIGB1bmRlZmluZWRgXG4gICAgICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5IGNvcnJlY3RseSBkZXNwaXRlIHRoZSByZXR1cm4gc2lnbmF0dXJlLlxuICAgICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgcmV0dXJuIHR5cGUgY2hhbmdlIHdhcyBhIG1pc3Rha2UgYmVjYXVzZVxuICAgICAgLy8gaXQgd2FzIGNoYW5nZWQgYmFjayB0byBpbmNsdWRlIGB8IHVuZGVmaW5lZGAgcmVjZW50bHk6XG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvcHVsbC8yODA1OS5cbiAgICAgIHJlc3VsdC5wdXNoKHJlc29sdmVkIGFzIHRzLlJlc29sdmVkVHlwZVJlZmVyZW5jZURpcmVjdGl2ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBMb2FkcyBhIHNvdXJjZSBmaWxlIGZyb20gZGlzayAob3IgdGhlIGNhY2hlKS4gKi9cbiAgZ2V0U291cmNlRmlsZShcbiAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIGxhbmd1YWdlVmVyc2lvbjogdHMuU2NyaXB0VGFyZ2V0LFxuICAgICAgb25FcnJvcj86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gcGVyZlRyYWNlLndyYXAoYGdldFNvdXJjZUZpbGUgJHtmaWxlTmFtZX1gLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZiA9IHRoaXMuZmlsZUxvYWRlci5sb2FkRmlsZShmaWxlTmFtZSwgZmlsZU5hbWUsIGxhbmd1YWdlVmVyc2lvbik7XG4gICAgICBpZiAoIS9cXC5kXFwudHN4PyQvLnRlc3QoZmlsZU5hbWUpICYmXG4gICAgICAgICAgKHRoaXMub3B0aW9ucy5tb2R1bGUgPT09IHRzLk1vZHVsZUtpbmQuQU1EIHx8XG4gICAgICAgICAgIHRoaXMub3B0aW9ucy5tb2R1bGUgPT09IHRzLk1vZHVsZUtpbmQuVU1EKSkge1xuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gdGhpcy5hbWRNb2R1bGVOYW1lKHNmKTtcbiAgICAgICAgaWYgKHNmLm1vZHVsZU5hbWUgPT09IG1vZHVsZU5hbWUgfHwgIW1vZHVsZU5hbWUpIHJldHVybiBzZjtcbiAgICAgICAgaWYgKHNmLm1vZHVsZU5hbWUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBFUlJPUjogJHtzZi5maWxlTmFtZX0gYCArXG4gICAgICAgICAgICAgIGBjb250YWlucyBhIG1vZHVsZSBuYW1lIGRlY2xhcmF0aW9uICR7c2YubW9kdWxlTmFtZX0gYCArXG4gICAgICAgICAgICAgIGB3aGljaCB3b3VsZCBiZSBvdmVyd3JpdHRlbiB3aXRoICR7bW9kdWxlTmFtZX0gYCArXG4gICAgICAgICAgICAgIGBieSBCYXplbCdzIFR5cGVTY3JpcHQgY29tcGlsZXIuYCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0dGluZyB0aGUgbW9kdWxlTmFtZSBpcyBlcXVpdmFsZW50IHRvIHRoZSBvcmlnaW5hbCBzb3VyY2UgaGF2aW5nIGFcbiAgICAgICAgLy8gLy8vPGFtZC1tb2R1bGUgbmFtZT1cInNvbWUvbmFtZVwiLz4gZGlyZWN0aXZlXG4gICAgICAgIHNmLm1vZHVsZU5hbWUgPSBtb2R1bGVOYW1lO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNmO1xuICAgIH0pO1xuICB9XG5cbiAgd3JpdGVGaWxlKFxuICAgICAgZmlsZU5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nLCB3cml0ZUJ5dGVPcmRlck1hcms6IGJvb2xlYW4sXG4gICAgICBvbkVycm9yOiAoKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCl8dW5kZWZpbmVkLFxuICAgICAgc291cmNlRmlsZXM6IFJlYWRvbmx5QXJyYXk8dHMuU291cmNlRmlsZT58dW5kZWZpbmVkKTogdm9pZCB7XG4gICAgcGVyZlRyYWNlLndyYXAoXG4gICAgICAgIGB3cml0ZUZpbGUgJHtmaWxlTmFtZX1gLFxuICAgICAgICAoKSA9PiB0aGlzLndyaXRlRmlsZUltcGwoXG4gICAgICAgICAgICBmaWxlTmFtZSwgY29udGVudCwgd3JpdGVCeXRlT3JkZXJNYXJrLCBvbkVycm9yLCBzb3VyY2VGaWxlcykpO1xuICB9XG5cbiAgd3JpdGVGaWxlSW1wbChcbiAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZywgd3JpdGVCeXRlT3JkZXJNYXJrOiBib29sZWFuLFxuICAgICAgb25FcnJvcjogKChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWQpfHVuZGVmaW5lZCxcbiAgICAgIHNvdXJjZUZpbGVzOiBSZWFkb25seUFycmF5PHRzLlNvdXJjZUZpbGU+fHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIC8vIFdvcmthcm91bmQgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xODY0OFxuICAgIC8vIFRoaXMgYnVnIGlzIGZpeGVkIGluIFRTIDIuOVxuICAgIGNvbnN0IHZlcnNpb24gPSB0cy52ZXJzaW9uTWFqb3JNaW5vcjtcbiAgICBjb25zdCBbbWFqb3IsIG1pbm9yXSA9IHZlcnNpb24uc3BsaXQoJy4nKS5tYXAocyA9PiBOdW1iZXIocykpO1xuICAgIGNvbnN0IHdvcmthcm91bmROZWVkZWQgPSBtYWpvciA8PSAyICYmIG1pbm9yIDw9IDg7XG4gICAgaWYgKHdvcmthcm91bmROZWVkZWQgJiZcbiAgICAgICAgKHRoaXMub3B0aW9ucy5tb2R1bGUgPT09IHRzLk1vZHVsZUtpbmQuQU1EIHx8XG4gICAgICAgICB0aGlzLm9wdGlvbnMubW9kdWxlID09PSB0cy5Nb2R1bGVLaW5kLlVNRCkgJiZcbiAgICAgICAgZmlsZU5hbWUuZW5kc1dpdGgoJy5kLnRzJykgJiYgc291cmNlRmlsZXMgJiYgc291cmNlRmlsZXMubGVuZ3RoID4gMCAmJlxuICAgICAgICBzb3VyY2VGaWxlc1swXS5tb2R1bGVOYW1lKSB7XG4gICAgICBjb250ZW50ID1cbiAgICAgICAgICBgLy8vIDxhbWQtbW9kdWxlIG5hbWU9XCIke3NvdXJjZUZpbGVzWzBdLm1vZHVsZU5hbWV9XCIgLz5cXG4ke2NvbnRlbnR9YDtcbiAgICB9XG4gICAgZmlsZU5hbWUgPSB0aGlzLmZsYXR0ZW5PdXREaXIoZmlsZU5hbWUpO1xuXG4gICAgaWYgKHRoaXMuYmF6ZWxPcHRzLmlzSnNUcmFuc3BpbGF0aW9uKSB7XG4gICAgICBpZiAodGhpcy5iYXplbE9wdHMudHJhbnNwaWxlZEpzT3V0cHV0RmlsZU5hbWUpIHtcbiAgICAgICAgZmlsZU5hbWUgPSB0aGlzLmJhemVsT3B0cy50cmFuc3BpbGVkSnNPdXRwdXRGaWxlTmFtZSE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdHJpcCB0aGUgaW5wdXQgZGlyZWN0b3J5IHBhdGggb2ZmIG9mIGZpbGVOYW1lIHRvIGdldCB0aGUgbG9naWNhbFxuICAgICAgICAvLyBwYXRoIHdpdGhpbiB0aGUgaW5wdXQgZGlyZWN0b3J5LlxuICAgICAgICBmaWxlTmFtZSA9XG4gICAgICAgICAgICBwYXRoLnJlbGF0aXZlKHRoaXMuYmF6ZWxPcHRzLnRyYW5zcGlsZWRKc0lucHV0RGlyZWN0b3J5ISwgZmlsZU5hbWUpO1xuICAgICAgICAvLyBUaGVuIHByZXBlbmQgdGhlIG91dHB1dCBkaXJlY3RvcnkgbmFtZS5cbiAgICAgICAgZmlsZU5hbWUgPVxuICAgICAgICAgICAgcGF0aC5qb2luKHRoaXMuYmF6ZWxPcHRzLnRyYW5zcGlsZWRKc091dHB1dERpcmVjdG9yeSEsIGZpbGVOYW1lKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLmJhemVsT3B0cy5lczVNb2RlKSB7XG4gICAgICAvLyBXcml0ZSBFUzYgdHJhbnNwaWxlZCBmaWxlcyB0byAqLm1qcy5cbiAgICAgIGlmICh0aGlzLmJhemVsT3B0cy5sb2NhbGUpIHtcbiAgICAgICAgLy8gaTE4biBwYXRocyBhcmUgcmVxdWlyZWQgdG8gZW5kIHdpdGggX19sb2NhbGUuanMgc28gd2UgcHV0XG4gICAgICAgIC8vIHRoZSAuY2xvc3VyZSBzZWdtZW50IGJlZm9yZSB0aGUgX19sb2NhbGVcbiAgICAgICAgZmlsZU5hbWUgPSBmaWxlTmFtZS5yZXBsYWNlKC8oX19bXlxcLl0rKT9cXC5qcyQvLCAnLmNsb3N1cmUkMS5qcycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmlsZU5hbWUgPSBmaWxlTmFtZS5yZXBsYWNlKC9cXC5qcyQvLCAnLm1qcycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFByZXBlbmQgdGhlIG91dHB1dCBkaXJlY3RvcnkuXG4gICAgZmlsZU5hbWUgPSBwYXRoLmpvaW4odGhpcy5vcHRpb25zLm91dERpciwgZmlsZU5hbWUpO1xuXG4gICAgLy8gT3VyIGZpbGUgY2FjaGUgaXMgYmFzZWQgb24gbXRpbWUgLSBzbyBhdm9pZCB3cml0aW5nIGZpbGVzIGlmIHRoZXlcbiAgICAvLyBkaWQgbm90IGNoYW5nZS5cbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZU5hbWUpIHx8XG4gICAgICAgIGZzLnJlYWRGaWxlU3luYyhmaWxlTmFtZSwgJ3V0Zi04JykgIT09IGNvbnRlbnQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUud3JpdGVGaWxlKFxuICAgICAgICAgIGZpbGVOYW1lLCBjb250ZW50LCB3cml0ZUJ5dGVPcmRlck1hcmssIG9uRXJyb3IsIHNvdXJjZUZpbGVzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uOiBkb24ndCB0cnkgdG8gc3RhdCBmaWxlcyB3ZSB3ZXJlbid0IGV4cGxpY2l0bHlcbiAgICogZ2l2ZW4gYXMgaW5wdXRzLlxuICAgKiBUaGlzIGFsc28gYWxsb3dzIHVzIHRvIGRpc2FibGUgQmF6ZWwgc2FuZGJveGluZywgd2l0aG91dCBhY2NpZGVudGFsbHlcbiAgICogcmVhZGluZyAudHMgaW5wdXRzIHdoZW4gLmQudHMgaW5wdXRzIGFyZSBpbnRlbmRlZC5cbiAgICogTm90ZSB0aGF0IGluIHdvcmtlciBtb2RlLCB0aGUgZmlsZSBjYWNoZSB3aWxsIGFsc28gZ3VhcmQgYWdhaW5zdCBhcmJpdHJhcnlcbiAgICogZmlsZSByZWFkcy5cbiAgICovXG4gIGZpbGVFeGlzdHMoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIFVuZGVyIEJhemVsLCB1c2VycyBkbyBub3QgZGVjbGFyZSBkZXBzW10gb24gdGhlaXIgbm9kZV9tb2R1bGVzLlxuICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBkbyBub3QgbGlzdCBhbGwgdGhlIG5lZWRlZCAuZC50cyBmaWxlcyBpbiB0aGUgZmlsZXNbXVxuICAgIC8vIHNlY3Rpb24gb2YgdHNjb25maWcuanNvbiwgYW5kIHRoYXQgaXMgd2hhdCBwb3B1bGF0ZXMgdGhlIGtub3duRmlsZXMgc2V0LlxuICAgIC8vIEluIGFkZGl0aW9uLCB0aGUgbm9kZSBtb2R1bGUgcmVzb2x2ZXIgbWF5IG5lZWQgdG8gcmVhZCBwYWNrYWdlLmpzb24gZmlsZXNcbiAgICAvLyBhbmQgdGhlc2UgYXJlIG5vdCBwZXJtaXR0ZWQgaW4gdGhlIGZpbGVzW10gc2VjdGlvbi5cbiAgICAvLyBTbyB3ZSBwZXJtaXQgcmVhZGluZyBub2RlX21vZHVsZXMvKiBmcm9tIGFjdGlvbiBpbnB1dHMsIGV2ZW4gdGhvdWdoIHRoaXNcbiAgICAvLyBjYW4gaW5jbHVkZSBkYXRhW10gZGVwZW5kZW5jaWVzIGFuZCBpcyBicm9hZGVyIHRoYW4gd2Ugd291bGQgbGlrZS5cbiAgICAvLyBUaGlzIHNob3VsZCBvbmx5IGJlIGVuYWJsZWQgdW5kZXIgQmF6ZWwsIG5vdCBCbGF6ZS5cbiAgICBpZiAodGhpcy5hbGxvd0FjdGlvbklucHV0UmVhZHMgJiYgZmlsZVBhdGguaW5kZXhPZignL25vZGVfbW9kdWxlcy8nKSA+PSAwKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmZpbGVMb2FkZXIuZmlsZUV4aXN0cyhmaWxlUGF0aCk7XG4gICAgICBpZiAoREVCVUcgJiYgIXJlc3VsdCAmJiB0aGlzLmRlbGVnYXRlLmZpbGVFeGlzdHMoZmlsZVBhdGgpKSB7XG4gICAgICAgIGRlYnVnKFwiUGF0aCBleGlzdHMsIGJ1dCBpcyBub3QgcmVnaXN0ZXJlZCBpbiB0aGUgY2FjaGVcIiwgZmlsZVBhdGgpO1xuICAgICAgICBPYmplY3Qua2V5cygodGhpcy5maWxlTG9hZGVyIGFzIGFueSkuY2FjaGUubGFzdERpZ2VzdHMpLmZvckVhY2goayA9PiB7XG4gICAgICAgICAgaWYgKGsuZW5kc1dpdGgocGF0aC5iYXNlbmFtZShmaWxlUGF0aCkpKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIiAgTWF5YmUgeW91IG1lYW50IHRvIGxvYWQgZnJvbVwiLCBrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMua25vd25GaWxlcy5oYXMoZmlsZVBhdGgpO1xuICB9XG5cbiAgZ2V0RGVmYXVsdExpYkxvY2F0aW9uKCk6IHN0cmluZyB7XG4gICAgLy8gU2luY2Ugd2Ugb3ZlcnJpZGUgZ2V0RGVmYXVsdExpYkZpbGVOYW1lIGJlbG93LCB3ZSBtdXN0IGFsc28gcHJvdmlkZSB0aGVcbiAgICAvLyBkaXJlY3RvcnkgY29udGFpbmluZyB0aGUgZmlsZS5cbiAgICAvLyBPdGhlcndpc2UgVHlwZVNjcmlwdCBsb29rcyBpbiBDOlxcbGliLnh4eC5kLnRzIGZvciB0aGUgZGVmYXVsdCBsaWIuXG4gICAgcmV0dXJuIHBhdGguZGlybmFtZShcbiAgICAgICAgdGhpcy5nZXREZWZhdWx0TGliRmlsZU5hbWUoe3RhcmdldDogdHMuU2NyaXB0VGFyZ2V0LkVTNX0pKTtcbiAgfVxuXG4gIGdldERlZmF1bHRMaWJGaWxlTmFtZShvcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmJhemVsT3B0cy5ub2RlTW9kdWxlc1ByZWZpeCkge1xuICAgICAgcmV0dXJuIHBhdGguam9pbihcbiAgICAgICAgICB0aGlzLmJhemVsT3B0cy5ub2RlTW9kdWxlc1ByZWZpeCwgJ3R5cGVzY3JpcHQvbGliJyxcbiAgICAgICAgICB0cy5nZXREZWZhdWx0TGliRmlsZU5hbWUoe3RhcmdldDogdHMuU2NyaXB0VGFyZ2V0LkVTNX0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuZ2V0RGVmYXVsdExpYkZpbGVOYW1lKG9wdGlvbnMpO1xuICB9XG5cbiAgcmVhbHBhdGgoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyB0c2Mtd3JhcHBlZCByZWxpZXMgb24gc3RyaW5nIG1hdGNoaW5nIG9mIGZpbGUgcGF0aHMgZm9yIHRoaW5ncyBsaWtlIHRoZVxuICAgIC8vIGZpbGUgY2FjaGUgYW5kIGZvciBzdHJpY3QgZGVwcyBjaGVja2luZy5cbiAgICAvLyBUeXBlU2NyaXB0IHdpbGwgdHJ5IHRvIHJlc29sdmUgc3ltbGlua3MgZHVyaW5nIG1vZHVsZSByZXNvbHV0aW9uIHdoaWNoXG4gICAgLy8gbWFrZXMgb3VyIGNoZWNrcyBmYWlsOiB0aGUgcGF0aCB3ZSByZXNvbHZlZCBhcyBhbiBpbnB1dCBpc24ndCB0aGUgc2FtZVxuICAgIC8vIG9uZSB0aGUgbW9kdWxlIHJlc29sdmVyIHdpbGwgbG9vayBmb3IuXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9wdWxsLzEyMDIwXG4gICAgLy8gU28gd2Ugc2ltcGx5IHR1cm4gb2ZmIHN5bWxpbmsgcmVzb2x1dGlvbi5cbiAgICByZXR1cm4gcztcbiAgfVxuXG4gIC8vIERlbGVnYXRlIGV2ZXJ5dGhpbmcgZWxzZSB0byB0aGUgb3JpZ2luYWwgY29tcGlsZXIgaG9zdC5cblxuICBnZXRDYW5vbmljYWxGaWxlTmFtZShwYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXRDYW5vbmljYWxGaWxlTmFtZShwYXRoKTtcbiAgfVxuXG4gIGdldEN1cnJlbnREaXJlY3RvcnkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXRDdXJyZW50RGlyZWN0b3J5KCk7XG4gIH1cblxuICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXMoKTtcbiAgfVxuXG4gIGdldE5ld0xpbmUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXROZXdMaW5lKCk7XG4gIH1cblxuICBnZXREaXJlY3RvcmllcyhwYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXREaXJlY3RvcmllcyA/IHRoaXMuZGVsZWdhdGUuZ2V0RGlyZWN0b3JpZXMocGF0aCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW107XG4gIH1cblxuICByZWFkRmlsZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucmVhZEZpbGUoZmlsZU5hbWUpO1xuICB9XG5cbiAgdHJhY2Uoczogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc29sZS5lcnJvcihzKTtcbiAgfVxufVxuIl19