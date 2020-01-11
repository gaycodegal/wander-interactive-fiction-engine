(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "path", "typescript", "../tsetse/runner", "./cache", "./compiler_host", "./diagnostics", "./manifest", "./perf_trace", "./strict_deps", "./tsconfig", "./worker"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs = require("fs");
    const path = require("path");
    const ts = require("typescript");
    const runner_1 = require("../tsetse/runner");
    const cache_1 = require("./cache");
    const compiler_host_1 = require("./compiler_host");
    const bazelDiagnostics = require("./diagnostics");
    const manifest_1 = require("./manifest");
    const perfTrace = require("./perf_trace");
    const strict_deps_1 = require("./strict_deps");
    const tsconfig_1 = require("./tsconfig");
    const worker_1 = require("./worker");
    // Equivalent of running node with --expose-gc
    // but easier to write tooling since we don't need to inject that arg to
    // nodejs_binary
    if (typeof global.gc !== 'function') {
        require('v8').setFlagsFromString('--expose_gc');
        global.gc = require('vm').runInNewContext('gc');
    }
    /**
     * Top-level entry point for tsc_wrapped.
     */
    function main(args) {
        if (worker_1.runAsWorker(args)) {
            worker_1.log('Starting TypeScript compiler persistent worker...');
            worker_1.runWorkerLoop(runOneBuild);
            // Note: intentionally don't process.exit() here, because runWorkerLoop
            // is waiting for async callbacks from node.
        }
        else {
            worker_1.debug('Running a single build...');
            if (args.length === 0)
                throw new Error('Not enough arguments');
            if (!runOneBuild(args)) {
                return 1;
            }
        }
        return 0;
    }
    exports.main = main;
    /** The one ProgramAndFileCache instance used in this process. */
    const cache = new cache_1.ProgramAndFileCache(worker_1.debug);
    function isCompilationTarget(bazelOpts, sf) {
        if (bazelOpts.isJsTranspilation && bazelOpts.transpiledJsInputDirectory) {
            // transpiledJsInputDirectory is a relative logical path, so we cannot
            // compare it to the resolved, absolute path of sf here.
            // compilationTargetSrc is resolved, so use that for the comparison.
            return sf.fileName.startsWith(bazelOpts.compilationTargetSrc[0]);
        }
        return (bazelOpts.compilationTargetSrc.indexOf(sf.fileName) !== -1);
    }
    /**
     * Gather diagnostics from TypeScript's type-checker as well as other plugins we
     * install such as strict dependency checking.
     */
    function gatherDiagnostics(options, bazelOpts, program, disabledTsetseRules, angularPlugin, plugins = []) {
        // Install extra diagnostic plugins
        plugins.push(...getCommonPlugins(options, bazelOpts, program, disabledTsetseRules));
        if (angularPlugin) {
            program = angularPlugin.wrap(program);
        }
        const diagnostics = [];
        perfTrace.wrap('type checking', () => {
            // These checks mirror ts.getPreEmitDiagnostics, with the important
            // exception of avoiding b/30708240, which is that if you call
            // program.getDeclarationDiagnostics() it somehow corrupts the emit.
            perfTrace.wrap(`global diagnostics`, () => {
                diagnostics.push(...program.getOptionsDiagnostics());
                diagnostics.push(...program.getGlobalDiagnostics());
            });
            let sourceFilesToCheck;
            if (bazelOpts.typeCheckDependencies) {
                sourceFilesToCheck = program.getSourceFiles();
            }
            else {
                sourceFilesToCheck = program.getSourceFiles().filter(f => isCompilationTarget(bazelOpts, f));
            }
            for (const sf of sourceFilesToCheck) {
                perfTrace.wrap(`check ${sf.fileName}`, () => {
                    diagnostics.push(...program.getSyntacticDiagnostics(sf));
                    diagnostics.push(...program.getSemanticDiagnostics(sf));
                });
                perfTrace.snapshotMemoryUsage();
            }
            for (const plugin of plugins) {
                perfTrace.wrap(`${plugin.name} diagnostics`, () => {
                    for (const sf of sourceFilesToCheck) {
                        perfTrace.wrap(`${plugin.name} checking ${sf.fileName}`, () => {
                            const pluginDiagnostics = plugin.getDiagnostics(sf).map((d) => {
                                return tagDiagnosticWithPlugin(plugin.name, d);
                            });
                            diagnostics.push(...pluginDiagnostics);
                        });
                        perfTrace.snapshotMemoryUsage();
                    }
                });
            }
        });
        return diagnostics;
    }
    exports.gatherDiagnostics = gatherDiagnostics;
    /**
     * Construct diagnostic plugins that we always want included.
     *
     * TODO: Call sites of getDiagnostics should initialize plugins themselves,
     *   including these, and the arguments to getDiagnostics should be simplified.
     */
    function getCommonPlugins(options, bazelOpts, program, disabledTsetseRules) {
        const plugins = [];
        if (!bazelOpts.disableStrictDeps) {
            if (options.rootDir == null) {
                throw new Error(`StrictDepsPlugin requires that rootDir be specified`);
            }
            plugins.push(new strict_deps_1.Plugin(program, Object.assign({}, bazelOpts, { rootDir: options.rootDir })));
        }
        if (!bazelOpts.isJsTranspilation) {
            let tsetsePluginConstructor = runner_1.Plugin;
            plugins.push(new tsetsePluginConstructor(program, disabledTsetseRules));
        }
        return plugins;
    }
    exports.getCommonPlugins = getCommonPlugins;
    /**
     * Returns a copy of diagnostic with one whose text has been prepended with
     * an indication of what plugin contributed that diagnostic.
     *
     * This is slightly complicated because a diagnostic's message text can be
     * split up into a chain of diagnostics, e.g. when there's supplementary info
     * about a diagnostic.
     */
    function tagDiagnosticWithPlugin(pluginName, diagnostic) {
        const tagMessageWithPluginName = (text) => `[${pluginName}] ${text}`;
        let messageText;
        if (typeof diagnostic.messageText === 'string') {
            // The simple case, where a diagnostic's message is just a string.
            messageText = tagMessageWithPluginName(diagnostic.messageText);
        }
        else {
            // In the case of a chain of messages we only want to tag the head of the
            //   chain, as that's the first line of message on the CLI.
            const chain = diagnostic.messageText;
            messageText = Object.assign({}, chain, { messageText: tagMessageWithPluginName(chain.messageText) });
        }
        return Object.assign({}, diagnostic, { messageText });
    }
    /**
     * expandSourcesFromDirectories finds any directories under filePath and expands
     * them to their .js or .ts contents.
     */
    function expandSourcesFromDirectories(fileList, filePath) {
        if (!fs.statSync(filePath).isDirectory()) {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') ||
                filePath.endsWith('.js')) {
                fileList.push(filePath);
            }
            return;
        }
        const entries = fs.readdirSync(filePath);
        for (const entry of entries) {
            expandSourcesFromDirectories(fileList, path.join(filePath, entry));
        }
    }
    /**
     * Runs a single build, returning false on failure.  This is potentially called
     * multiple times (once per bazel request) when running as a bazel worker.
     * Any encountered errors are written to stderr.
     */
    function runOneBuild(args, inputs) {
        if (args.length !== 1) {
            console.error('Expected one argument: path to tsconfig.json');
            return false;
        }
        perfTrace.snapshotMemoryUsage();
        // Strip leading at-signs, used in build_defs.bzl to indicate a params file
        const tsconfigFile = args[0].replace(/^@+/, '');
        const [parsed, errors, { target }] = tsconfig_1.parseTsconfig(tsconfigFile);
        if (errors) {
            console.error(bazelDiagnostics.format(target, errors));
            return false;
        }
        if (!parsed) {
            throw new Error('Impossible state: if parseTsconfig returns no errors, then parsed should be non-null');
        }
        const { options, bazelOpts, files, disabledTsetseRules, angularCompilerOptions } = parsed;
        const sourceFiles = [];
        for (let i = 0; i < files.length; i++) {
            const filePath = files[i];
            expandSourcesFromDirectories(sourceFiles, filePath);
        }
        if (bazelOpts.maxCacheSizeMb !== undefined) {
            const maxCacheSizeBytes = bazelOpts.maxCacheSizeMb * (1 << 20);
            cache.setMaxCacheSize(maxCacheSizeBytes);
        }
        else {
            cache.resetMaxCacheSize();
        }
        let fileLoader;
        if (inputs) {
            fileLoader = new cache_1.CachedFileLoader(cache);
            // Resolve the inputs to absolute paths to match TypeScript internals
            const resolvedInputs = new Map();
            for (const key of Object.keys(inputs)) {
                resolvedInputs.set(tsconfig_1.resolveNormalizedPath(key), inputs[key]);
            }
            cache.updateCache(resolvedInputs);
        }
        else {
            fileLoader = new cache_1.UncachedFileLoader();
        }
        const perfTracePath = bazelOpts.perfTracePath;
        if (!perfTracePath) {
            const { diagnostics } = createProgramAndEmit(fileLoader, options, bazelOpts, sourceFiles, disabledTsetseRules, angularCompilerOptions);
            if (diagnostics.length > 0) {
                console.error(bazelDiagnostics.format(bazelOpts.target, diagnostics));
                return false;
            }
            return true;
        }
        worker_1.log('Writing trace to', perfTracePath);
        const success = perfTrace.wrap('runOneBuild', () => {
            const { diagnostics } = createProgramAndEmit(fileLoader, options, bazelOpts, sourceFiles, disabledTsetseRules, angularCompilerOptions);
            if (diagnostics.length > 0) {
                console.error(bazelDiagnostics.format(bazelOpts.target, diagnostics));
                return false;
            }
            return true;
        });
        if (!success)
            return false;
        // Force a garbage collection pass.  This keeps our memory usage
        // consistent across multiple compilations, and allows the file
        // cache to use the current memory usage as a guideline for expiring
        // data.  Note: this is intentionally not within runFromOptions(), as
        // we want to gc only after all its locals have gone out of scope.
        global.gc();
        perfTrace.snapshotMemoryUsage();
        perfTrace.write(perfTracePath);
        return true;
    }
    // We only allow our own code to use the expected_diagnostics attribute
    const expectDiagnosticsWhitelist = [];
    /** errorDiag produces an error diagnostic not bound to a file or location. */
    function errorDiag(messageText) {
        return {
            category: ts.DiagnosticCategory.Error,
            code: 0,
            file: undefined,
            start: undefined,
            length: undefined,
            messageText,
        };
    }
    /**
     * createProgramAndEmit creates a ts.Program from the given options and emits it
     * according to them (e.g. including running various plugins and tsickle). It
     * returns the program and any diagnostics generated.
     *
     * Callers should check and emit diagnostics.
     */
    function createProgramAndEmit(fileLoader, options, bazelOpts, files, disabledTsetseRules, angularCompilerOptions) {
        // Beware! createProgramAndEmit must not print to console, nor exit etc.
        // Handle errors by reporting and returning diagnostics.
        perfTrace.snapshotMemoryUsage();
        cache.resetStats();
        cache.traceStats();
        const compilerHostDelegate = ts.createCompilerHost({ target: ts.ScriptTarget.ES5 });
        const moduleResolver = bazelOpts.isJsTranspilation ?
            makeJsModuleResolver(bazelOpts.workspaceName) :
            ts.resolveModuleName;
        const tsickleCompilerHost = new compiler_host_1.CompilerHost(files, options, bazelOpts, compilerHostDelegate, fileLoader, moduleResolver);
        let compilerHost = tsickleCompilerHost;
        const diagnosticPlugins = [];
        let angularPlugin;
        if (bazelOpts.compileAngularTemplates) {
            try {
                const ngOptions = angularCompilerOptions || {};
                // Add the rootDir setting to the options passed to NgTscPlugin.
                // Required so that synthetic files added to the rootFiles in the program
                // can be given absolute paths, just as we do in tsconfig.ts, matching
                // the behavior in TypeScript's tsconfig parsing logic.
                ngOptions['rootDir'] = options.rootDir;
                // Dynamically load the Angular compiler installed as a peerDep
                const ngtsc = require('@angular/compiler-cli');
                angularPlugin = new ngtsc.NgTscPlugin(ngOptions);
            }
            catch (e) {
                return {
                    diagnostics: [errorDiag('when using `ts_library(compile_angular_templates=True)`, ' +
                            `you must install @angular/compiler-cli (was: ${e})`)]
                };
            }
            // Wrap host only needed until after Ivy cleanup
            // TODO(alexeagle): remove after ngsummary and ngfactory files eliminated
            compilerHost = angularPlugin.wrapHost(files, compilerHost);
        }
        const oldProgram = cache.getProgram(bazelOpts.target);
        const program = perfTrace.wrap('createProgram', () => ts.createProgram(compilerHost.inputFiles, options, compilerHost, oldProgram));
        cache.putProgram(bazelOpts.target, program);
        if (!bazelOpts.isJsTranspilation) {
            // If there are any TypeScript type errors abort now, so the error
            // messages refer to the original source.  After any subsequent passes
            // (decorator downleveling or tsickle) we do not type check.
            let diagnostics = gatherDiagnostics(options, bazelOpts, program, disabledTsetseRules, angularPlugin, diagnosticPlugins);
            if (!expectDiagnosticsWhitelist.length ||
                expectDiagnosticsWhitelist.some(p => bazelOpts.target.startsWith(p))) {
                diagnostics = bazelDiagnostics.filterExpected(bazelOpts, diagnostics, bazelDiagnostics.uglyFormat);
            }
            else if (bazelOpts.expectedDiagnostics.length > 0) {
                diagnostics.push(errorDiag(`Only targets under ${expectDiagnosticsWhitelist.join(', ')} can use ` +
                    'expected_diagnostics, but got ' + bazelOpts.target));
            }
            if (diagnostics.length > 0) {
                worker_1.debug('compilation failed at', new Error().stack);
                return { program, diagnostics };
            }
        }
        const compilationTargets = program.getSourceFiles().filter(fileName => isCompilationTarget(bazelOpts, fileName));
        let diagnostics = [];
        let useTsickleEmit = bazelOpts.tsickle;
        let transforms = {
            before: [],
            after: [],
            afterDeclarations: [],
        };
        if (angularPlugin) {
            transforms = angularPlugin.createTransformers(compilerHost);
        }
        if (useTsickleEmit) {
            diagnostics = emitWithTsickle(program, tsickleCompilerHost, compilationTargets, options, bazelOpts, transforms);
        }
        else {
            diagnostics = emitWithTypescript(program, compilationTargets, transforms);
        }
        if (diagnostics.length > 0) {
            worker_1.debug('compilation failed at', new Error().stack);
        }
        cache.printStats();
        return { program, diagnostics };
    }
    exports.createProgramAndEmit = createProgramAndEmit;
    function emitWithTypescript(program, compilationTargets, transforms) {
        const diagnostics = [];
        for (const sf of compilationTargets) {
            const result = program.emit(sf, /*writeFile*/ undefined, 
            /*cancellationToken*/ undefined, /*emitOnlyDtsFiles*/ undefined, transforms);
            diagnostics.push(...result.diagnostics);
        }
        return diagnostics;
    }
    /**
     * Runs the emit pipeline with Tsickle transformations - goog.module rewriting
     * and Closure types emitted included.
     * Exported to be used by the internal global refactoring tools.
     * TODO(radokirov): investigate using runWithOptions and making this private
     * again, if we can make compilerHosts match.
     */
    function emitWithTsickle(program, compilerHost, compilationTargets, options, bazelOpts, transforms) {
        const emitResults = [];
        const diagnostics = [];
        // The 'tsickle' import above is only used in type positions, so it won't
        // result in a runtime dependency on tsickle.
        // If the user requests the tsickle emit, then we dynamically require it
        // here for use at runtime.
        let optTsickle;
        try {
            // tslint:disable-next-line:no-require-imports
            optTsickle = require('tsickle');
        }
        catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') {
                throw e;
            }
            throw new Error('When setting bazelOpts { tsickle: true }, ' +
                'you must also add a devDependency on the tsickle npm package');
        }
        perfTrace.wrap('emit', () => {
            for (const sf of compilationTargets) {
                perfTrace.wrap(`emit ${sf.fileName}`, () => {
                    emitResults.push(optTsickle.emitWithTsickle(program, compilerHost, compilerHost, options, sf, 
                    /*writeFile*/ undefined, 
                    /*cancellationToken*/ undefined, /*emitOnlyDtsFiles*/ undefined, {
                        beforeTs: transforms.before,
                        afterTs: transforms.after,
                        afterDeclarations: transforms.afterDeclarations,
                    }));
                });
            }
        });
        const emitResult = optTsickle.mergeEmitResults(emitResults);
        diagnostics.push(...emitResult.diagnostics);
        // If tsickle reported diagnostics, don't produce externs or manifest outputs.
        if (diagnostics.length > 0) {
            return diagnostics;
        }
        let externs = '/** @externs */\n' +
            '// generating externs was disabled using generate_externs=False\n';
        if (bazelOpts.tsickleGenerateExterns) {
            externs =
                optTsickle.getGeneratedExterns(emitResult.externs, options.rootDir);
        }
        if (!options.noEmit && bazelOpts.tsickleExternsPath) {
            // Note: when tsickleExternsPath is provided, we always write a file as a
            // marker that compilation succeeded, even if it's empty (just containing an
            // @externs).
            fs.writeFileSync(bazelOpts.tsickleExternsPath, externs);
            // When generating externs, generate an externs file for each of the input
            // .d.ts files.
            if (bazelOpts.tsickleGenerateExterns &&
                compilerHost.provideExternalModuleDtsNamespace) {
                for (const extern of compilationTargets) {
                    if (!extern.isDeclarationFile)
                        continue;
                    const outputBaseDir = options.outDir;
                    const relativeOutputPath = compilerHost.relativeOutputPath(extern.fileName);
                    mkdirp(outputBaseDir, path.dirname(relativeOutputPath));
                    const outputPath = path.join(outputBaseDir, relativeOutputPath);
                    const moduleName = compilerHost.pathToModuleName('', extern.fileName);
                    fs.writeFileSync(outputPath, `goog.module('${moduleName}');\n` +
                        `// Export an empty object of unknown type to allow imports.\n` +
                        `// TODO: use typeof once available\n` +
                        `exports = /** @type {?} */ ({});\n`);
                }
            }
        }
        if (!options.noEmit && bazelOpts.manifest) {
            perfTrace.wrap('manifest', () => {
                const manifest = manifest_1.constructManifest(emitResult.modulesManifest, compilerHost);
                fs.writeFileSync(bazelOpts.manifest, manifest);
            });
        }
        return diagnostics;
    }
    exports.emitWithTsickle = emitWithTsickle;
    /**
     * Creates directories subdir (a slash separated relative path) starting from
     * base.
     */
    function mkdirp(base, subdir) {
        const steps = subdir.split(path.sep);
        let current = base;
        for (let i = 0; i < steps.length; i++) {
            current = path.join(current, steps[i]);
            if (!fs.existsSync(current))
                fs.mkdirSync(current);
        }
    }
    /**
     * Resolve module filenames for JS modules.
     *
     * JS module resolution needs to be different because when transpiling JS we
     * do not pass in any dependencies, so the TS module resolver will not resolve
     * any files.
     *
     * Fortunately, JS module resolution is very simple. The imported module name
     * must either a relative path, or the workspace root (i.e. 'google3'),
     * so we can perform module resolution entirely based on file names, without
     * looking at the filesystem.
     */
    function makeJsModuleResolver(workspaceName) {
        // The literal '/' here is cross-platform safe because it's matching on
        // import specifiers, not file names.
        const workspaceModuleSpecifierPrefix = `${workspaceName}/`;
        const workspaceDir = `${path.sep}${workspaceName}${path.sep}`;
        function jsModuleResolver(moduleName, containingFile, compilerOptions, host) {
            let resolvedFileName;
            if (containingFile === '') {
                // In tsickle we resolve the filename against '' to get the goog module
                // name of a sourcefile.
                resolvedFileName = moduleName;
            }
            else if (moduleName.startsWith(workspaceModuleSpecifierPrefix)) {
                // Given a workspace name of 'foo', we want to resolve import specifiers
                // like: 'foo/project/file.js' to the absolute filesystem path of
                // project/file.js within the workspace.
                const workspaceDirLocation = containingFile.indexOf(workspaceDir);
                if (workspaceDirLocation < 0) {
                    return { resolvedModule: undefined };
                }
                const absolutePathToWorkspaceDir = containingFile.slice(0, workspaceDirLocation);
                resolvedFileName = path.join(absolutePathToWorkspaceDir, moduleName);
            }
            else {
                if (!moduleName.startsWith('./') && !moduleName.startsWith('../')) {
                    throw new Error(`Unsupported module import specifier: ${JSON.stringify(moduleName)}.\n` +
                        `JS module imports must either be relative paths ` +
                        `(beginning with '.' or '..'), ` +
                        `or they must begin with '${workspaceName}/'.`);
                }
                resolvedFileName = path.join(path.dirname(containingFile), moduleName);
            }
            return {
                resolvedModule: {
                    resolvedFileName,
                    extension: ts.Extension.Js,
                    // These two fields are cargo culted from what ts.resolveModuleName
                    // seems to return.
                    packageId: undefined,
                    isExternalLibraryImport: false,
                }
            };
        }
        return jsModuleResolver;
    }
    if (require.main === module) {
        // Do not call process.exit(), as that terminates the binary before
        // completing pending operations, such as writing to stdout or emitting the
        // v8 performance log. Rather, set the exit code and fall off the main
        // thread, which will cause node to terminate cleanly.
        process.exitCode = main(process.argv.slice(2));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNjX3dyYXBwZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL3RzY193cmFwcGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEseUJBQXlCO0lBQ3pCLDZCQUE2QjtJQUU3QixpQ0FBaUM7SUFFakMsNkNBQWtFO0lBRWxFLG1DQUE4RjtJQUM5RixtREFBNkM7SUFDN0Msa0RBQWtEO0lBQ2xELHlDQUE2QztJQUM3QywwQ0FBMEM7SUFFMUMsK0NBQXlEO0lBQ3pELHlDQUE4RTtJQUM5RSxxQ0FBZ0U7SUFFaEUsOENBQThDO0lBQzlDLHdFQUF3RTtJQUN4RSxnQkFBZ0I7SUFDaEIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUssVUFBVSxFQUFFO1FBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDakQ7SUFFRDs7T0FFRztJQUNILFNBQWdCLElBQUksQ0FBQyxJQUFjO1FBQ2pDLElBQUksb0JBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixZQUFHLENBQUMsbURBQW1ELENBQUMsQ0FBQztZQUN6RCxzQkFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNCLHVFQUF1RTtZQUN2RSw0Q0FBNEM7U0FDN0M7YUFBTTtZQUNMLGNBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ25DLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxF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O3dCQUNoQyw0QkFBNEIsYUFBYSxLQUFLLENBQUMsQ0FBQztpQkFDckQ7Z0JBQ0QsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ3hFO1lBQ0QsT0FBTztnQkFDTCxjQUFjLEVBQUU7b0JBQ2QsZ0JBQWdCO29CQUNoQixTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFO29CQUMxQixtRUFBbUU7b0JBQ25FLG1CQUFtQjtvQkFDbkIsU0FBUyxFQUFFLFNBQVM7b0JBQ3BCLHVCQUF1QixFQUFFLEtBQUs7aUJBQy9CO2FBQ0YsQ0FBQztRQUNKLENBQUM7UUFFRCxPQUFPLGdCQUFnQixDQUFDO0lBQzFCLENBQUM7SUFHRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQzNCLG1FQUFtRTtRQUNuRSwyRUFBMkU7UUFDM0Usc0VBQXNFO1FBQ3RFLHNEQUFzRDtRQUN0RCxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2hEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzaWNrbGUgZnJvbSAndHNpY2tsZSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtQbHVnaW4gYXMgQmF6ZWxDb25mb3JtYW5jZVBsdWdpbn0gZnJvbSAnLi4vdHNldHNlL3J1bm5lcic7XG5cbmltcG9ydCB7Q2FjaGVkRmlsZUxvYWRlciwgRmlsZUxvYWRlciwgUHJvZ3JhbUFuZEZpbGVDYWNoZSwgVW5jYWNoZWRGaWxlTG9hZGVyfSBmcm9tICcuL2NhY2hlJztcbmltcG9ydCB7Q29tcGlsZXJIb3N0fSBmcm9tICcuL2NvbXBpbGVyX2hvc3QnO1xuaW1wb3J0ICogYXMgYmF6ZWxEaWFnbm9zdGljcyBmcm9tICcuL2RpYWdub3N0aWNzJztcbmltcG9ydCB7Y29uc3RydWN0TWFuaWZlc3R9IGZyb20gJy4vbWFuaWZlc3QnO1xuaW1wb3J0ICogYXMgcGVyZlRyYWNlIGZyb20gJy4vcGVyZl90cmFjZSc7XG5pbXBvcnQge0RpYWdub3N0aWNQbHVnaW4sIFBsdWdpbkNvbXBpbGVySG9zdCwgVHNjUGx1Z2lufSBmcm9tICcuL3BsdWdpbl9hcGknO1xuaW1wb3J0IHtQbHVnaW4gYXMgU3RyaWN0RGVwc1BsdWdpbn0gZnJvbSAnLi9zdHJpY3RfZGVwcyc7XG5pbXBvcnQge0JhemVsT3B0aW9ucywgcGFyc2VUc2NvbmZpZywgcmVzb2x2ZU5vcm1hbGl6ZWRQYXRofSBmcm9tICcuL3RzY29uZmlnJztcbmltcG9ydCB7ZGVidWcsIGxvZywgcnVuQXNXb3JrZXIsIHJ1bldvcmtlckxvb3B9IGZyb20gJy4vd29ya2VyJztcblxuLy8gRXF1aXZhbGVudCBvZiBydW5uaW5nIG5vZGUgd2l0aCAtLWV4cG9zZS1nY1xuLy8gYnV0IGVhc2llciB0byB3cml0ZSB0b29saW5nIHNpbmNlIHdlIGRvbid0IG5lZWQgdG8gaW5qZWN0IHRoYXQgYXJnIHRvXG4vLyBub2RlanNfYmluYXJ5XG5pZiAodHlwZW9mIGdsb2JhbC5nYyAhPT0gJ2Z1bmN0aW9uJykge1xuICByZXF1aXJlKCd2OCcpLnNldEZsYWdzRnJvbVN0cmluZygnLS1leHBvc2VfZ2MnKTtcbiAgZ2xvYmFsLmdjID0gcmVxdWlyZSgndm0nKS5ydW5Jbk5ld0NvbnRleHQoJ2djJyk7XG59XG5cbi8qKlxuICogVG9wLWxldmVsIGVudHJ5IHBvaW50IGZvciB0c2Nfd3JhcHBlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1haW4oYXJnczogc3RyaW5nW10pIHtcbiAgaWYgKHJ1bkFzV29ya2VyKGFyZ3MpKSB7XG4gICAgbG9nKCdTdGFydGluZyBUeXBlU2NyaXB0IGNvbXBpbGVyIHBlcnNpc3RlbnQgd29ya2VyLi4uJyk7XG4gICAgcnVuV29ya2VyTG9vcChydW5PbmVCdWlsZCk7XG4gICAgLy8gTm90ZTogaW50ZW50aW9uYWxseSBkb24ndCBwcm9jZXNzLmV4aXQoKSBoZXJlLCBiZWNhdXNlIHJ1bldvcmtlckxvb3BcbiAgICAvLyBpcyB3YWl0aW5nIGZvciBhc3luYyBjYWxsYmFja3MgZnJvbSBub2RlLlxuICB9IGVsc2Uge1xuICAgIGRlYnVnKCdSdW5uaW5nIGEgc2luZ2xlIGJ1aWxkLi4uJyk7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ05vdCBlbm91Z2ggYXJndW1lbnRzJyk7XG4gICAgaWYgKCFydW5PbmVCdWlsZChhcmdzKSkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG4vKiogVGhlIG9uZSBQcm9ncmFtQW5kRmlsZUNhY2hlIGluc3RhbmNlIHVzZWQgaW4gdGhpcyBwcm9jZXNzLiAqL1xuY29uc3QgY2FjaGUgPSBuZXcgUHJvZ3JhbUFuZEZpbGVDYWNoZShkZWJ1Zyk7XG5cbmZ1bmN0aW9uIGlzQ29tcGlsYXRpb25UYXJnZXQoXG4gICAgYmF6ZWxPcHRzOiBCYXplbE9wdGlvbnMsIHNmOiB0cy5Tb3VyY2VGaWxlKTogYm9vbGVhbiB7XG4gIGlmIChiYXplbE9wdHMuaXNKc1RyYW5zcGlsYXRpb24gJiYgYmF6ZWxPcHRzLnRyYW5zcGlsZWRKc0lucHV0RGlyZWN0b3J5KSB7XG4gICAgLy8gdHJhbnNwaWxlZEpzSW5wdXREaXJlY3RvcnkgaXMgYSByZWxhdGl2ZSBsb2dpY2FsIHBhdGgsIHNvIHdlIGNhbm5vdFxuICAgIC8vIGNvbXBhcmUgaXQgdG8gdGhlIHJlc29sdmVkLCBhYnNvbHV0ZSBwYXRoIG9mIHNmIGhlcmUuXG4gICAgLy8gY29tcGlsYXRpb25UYXJnZXRTcmMgaXMgcmVzb2x2ZWQsIHNvIHVzZSB0aGF0IGZvciB0aGUgY29tcGFyaXNvbi5cbiAgICByZXR1cm4gc2YuZmlsZU5hbWUuc3RhcnRzV2l0aChiYXplbE9wdHMuY29tcGlsYXRpb25UYXJnZXRTcmNbMF0pO1xuICB9XG4gIHJldHVybiAoYmF6ZWxPcHRzLmNvbXBpbGF0aW9uVGFyZ2V0U3JjLmluZGV4T2Yoc2YuZmlsZU5hbWUpICE9PSAtMSk7XG59XG5cbi8qKlxuICogR2F0aGVyIGRpYWdub3N0aWNzIGZyb20gVHlwZVNjcmlwdCdzIHR5cGUtY2hlY2tlciBhcyB3ZWxsIGFzIG90aGVyIHBsdWdpbnMgd2VcbiAqIGluc3RhbGwgc3VjaCBhcyBzdHJpY3QgZGVwZW5kZW5jeSBjaGVja2luZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdhdGhlckRpYWdub3N0aWNzKFxuICAgIG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucywgYmF6ZWxPcHRzOiBCYXplbE9wdGlvbnMsIHByb2dyYW06IHRzLlByb2dyYW0sXG4gICAgZGlzYWJsZWRUc2V0c2VSdWxlczogc3RyaW5nW10sIGFuZ3VsYXJQbHVnaW4/OiBUc2NQbHVnaW4sXG4gICAgcGx1Z2luczogRGlhZ25vc3RpY1BsdWdpbltdID0gW10pOiB0cy5EaWFnbm9zdGljW10ge1xuICAvLyBJbnN0YWxsIGV4dHJhIGRpYWdub3N0aWMgcGx1Z2luc1xuICBwbHVnaW5zLnB1c2goXG4gICAgICAuLi5nZXRDb21tb25QbHVnaW5zKG9wdGlvbnMsIGJhemVsT3B0cywgcHJvZ3JhbSwgZGlzYWJsZWRUc2V0c2VSdWxlcykpO1xuICBpZiAoYW5ndWxhclBsdWdpbikge1xuICAgIHByb2dyYW0gPSBhbmd1bGFyUGx1Z2luLndyYXAocHJvZ3JhbSk7XG4gIH1cblxuICBjb25zdCBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdID0gW107XG4gIHBlcmZUcmFjZS53cmFwKCd0eXBlIGNoZWNraW5nJywgKCkgPT4ge1xuICAgIC8vIFRoZXNlIGNoZWNrcyBtaXJyb3IgdHMuZ2V0UHJlRW1pdERpYWdub3N0aWNzLCB3aXRoIHRoZSBpbXBvcnRhbnRcbiAgICAvLyBleGNlcHRpb24gb2YgYXZvaWRpbmcgYi8zMDcwODI0MCwgd2hpY2ggaXMgdGhhdCBpZiB5b3UgY2FsbFxuICAgIC8vIHByb2dyYW0uZ2V0RGVjbGFyYXRpb25EaWFnbm9zdGljcygpIGl0IHNvbWVob3cgY29ycnVwdHMgdGhlIGVtaXQuXG4gICAgcGVyZlRyYWNlLndyYXAoYGdsb2JhbCBkaWFnbm9zdGljc2AsICgpID0+IHtcbiAgICAgIGRpYWdub3N0aWNzLnB1c2goLi4ucHJvZ3JhbS5nZXRPcHRpb25zRGlhZ25vc3RpY3MoKSk7XG4gICAgICBkaWFnbm9zdGljcy5wdXNoKC4uLnByb2dyYW0uZ2V0R2xvYmFsRGlhZ25vc3RpY3MoKSk7XG4gICAgfSk7XG4gICAgbGV0IHNvdXJjZUZpbGVzVG9DaGVjazogUmVhZG9ubHlBcnJheTx0cy5Tb3VyY2VGaWxlPjtcbiAgICBpZiAoYmF6ZWxPcHRzLnR5cGVDaGVja0RlcGVuZGVuY2llcykge1xuICAgICAgc291cmNlRmlsZXNUb0NoZWNrID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3VyY2VGaWxlc1RvQ2hlY2sgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgICAgIGYgPT4gaXNDb21waWxhdGlvblRhcmdldChiYXplbE9wdHMsIGYpKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzZiBvZiBzb3VyY2VGaWxlc1RvQ2hlY2spIHtcbiAgICAgIHBlcmZUcmFjZS53cmFwKGBjaGVjayAke3NmLmZpbGVOYW1lfWAsICgpID0+IHtcbiAgICAgICAgZGlhZ25vc3RpY3MucHVzaCguLi5wcm9ncmFtLmdldFN5bnRhY3RpY0RpYWdub3N0aWNzKHNmKSk7XG4gICAgICAgIGRpYWdub3N0aWNzLnB1c2goLi4ucHJvZ3JhbS5nZXRTZW1hbnRpY0RpYWdub3N0aWNzKHNmKSk7XG4gICAgICB9KTtcbiAgICAgIHBlcmZUcmFjZS5zbmFwc2hvdE1lbW9yeVVzYWdlKCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcGx1Z2luIG9mIHBsdWdpbnMpIHtcbiAgICAgIHBlcmZUcmFjZS53cmFwKGAke3BsdWdpbi5uYW1lfSBkaWFnbm9zdGljc2AsICgpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBzZiBvZiBzb3VyY2VGaWxlc1RvQ2hlY2spIHtcbiAgICAgICAgICBwZXJmVHJhY2Uud3JhcChgJHtwbHVnaW4ubmFtZX0gY2hlY2tpbmcgJHtzZi5maWxlTmFtZX1gLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwbHVnaW5EaWFnbm9zdGljcyA9IHBsdWdpbi5nZXREaWFnbm9zdGljcyhzZikubWFwKChkKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0YWdEaWFnbm9zdGljV2l0aFBsdWdpbihwbHVnaW4ubmFtZSwgZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRpYWdub3N0aWNzLnB1c2goLi4ucGx1Z2luRGlhZ25vc3RpY3MpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHBlcmZUcmFjZS5zbmFwc2hvdE1lbW9yeVVzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRpYWdub3N0aWNzO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdCBkaWFnbm9zdGljIHBsdWdpbnMgdGhhdCB3ZSBhbHdheXMgd2FudCBpbmNsdWRlZC5cbiAqXG4gKiBUT0RPOiBDYWxsIHNpdGVzIG9mIGdldERpYWdub3N0aWNzIHNob3VsZCBpbml0aWFsaXplIHBsdWdpbnMgdGhlbXNlbHZlcyxcbiAqICAgaW5jbHVkaW5nIHRoZXNlLCBhbmQgdGhlIGFyZ3VtZW50cyB0byBnZXREaWFnbm9zdGljcyBzaG91bGQgYmUgc2ltcGxpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbW1vblBsdWdpbnMoXG4gICAgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLCBiYXplbE9wdHM6IEJhemVsT3B0aW9ucywgcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICBkaXNhYmxlZFRzZXRzZVJ1bGVzOiBzdHJpbmdbXSk6IERpYWdub3N0aWNQbHVnaW5bXSB7XG4gIGNvbnN0IHBsdWdpbnM6IERpYWdub3N0aWNQbHVnaW5bXSA9IFtdO1xuICBpZiAoIWJhemVsT3B0cy5kaXNhYmxlU3RyaWN0RGVwcykge1xuICAgIGlmIChvcHRpb25zLnJvb3REaXIgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdHJpY3REZXBzUGx1Z2luIHJlcXVpcmVzIHRoYXQgcm9vdERpciBiZSBzcGVjaWZpZWRgKTtcbiAgICB9XG4gICAgcGx1Z2lucy5wdXNoKG5ldyBTdHJpY3REZXBzUGx1Z2luKHByb2dyYW0sIHtcbiAgICAgIC4uLmJhemVsT3B0cyxcbiAgICAgIHJvb3REaXI6IG9wdGlvbnMucm9vdERpcixcbiAgICB9KSk7XG4gIH1cbiAgaWYgKCFiYXplbE9wdHMuaXNKc1RyYW5zcGlsYXRpb24pIHtcbiAgICBsZXQgdHNldHNlUGx1Z2luQ29uc3RydWN0b3I6XG4gICAgICAgIHtuZXcgKHByb2dyYW06IHRzLlByb2dyYW0sIGRpc2FibGVkUnVsZXM6IHN0cmluZ1tdKTogRGlhZ25vc3RpY1BsdWdpbn0gPVxuICAgICAgICAgICAgQmF6ZWxDb25mb3JtYW5jZVBsdWdpbjtcbiAgICBwbHVnaW5zLnB1c2gobmV3IHRzZXRzZVBsdWdpbkNvbnN0cnVjdG9yKHByb2dyYW0sIGRpc2FibGVkVHNldHNlUnVsZXMpKTtcbiAgfVxuICByZXR1cm4gcGx1Z2lucztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgY29weSBvZiBkaWFnbm9zdGljIHdpdGggb25lIHdob3NlIHRleHQgaGFzIGJlZW4gcHJlcGVuZGVkIHdpdGhcbiAqIGFuIGluZGljYXRpb24gb2Ygd2hhdCBwbHVnaW4gY29udHJpYnV0ZWQgdGhhdCBkaWFnbm9zdGljLlxuICpcbiAqIFRoaXMgaXMgc2xpZ2h0bHkgY29tcGxpY2F0ZWQgYmVjYXVzZSBhIGRpYWdub3N0aWMncyBtZXNzYWdlIHRleHQgY2FuIGJlXG4gKiBzcGxpdCB1cCBpbnRvIGEgY2hhaW4gb2YgZGlhZ25vc3RpY3MsIGUuZy4gd2hlbiB0aGVyZSdzIHN1cHBsZW1lbnRhcnkgaW5mb1xuICogYWJvdXQgYSBkaWFnbm9zdGljLlxuICovXG5mdW5jdGlvbiB0YWdEaWFnbm9zdGljV2l0aFBsdWdpbihcbiAgICBwbHVnaW5OYW1lOiBzdHJpbmcsIGRpYWdub3N0aWM6IFJlYWRvbmx5PHRzLkRpYWdub3N0aWM+KTogdHMuRGlhZ25vc3RpYyB7XG4gIGNvbnN0IHRhZ01lc3NhZ2VXaXRoUGx1Z2luTmFtZSA9ICh0ZXh0OiBzdHJpbmcpID0+IGBbJHtwbHVnaW5OYW1lfV0gJHt0ZXh0fWA7XG5cbiAgbGV0IG1lc3NhZ2VUZXh0O1xuICBpZiAodHlwZW9mIGRpYWdub3N0aWMubWVzc2FnZVRleHQgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gVGhlIHNpbXBsZSBjYXNlLCB3aGVyZSBhIGRpYWdub3N0aWMncyBtZXNzYWdlIGlzIGp1c3QgYSBzdHJpbmcuXG4gICAgbWVzc2FnZVRleHQgPSB0YWdNZXNzYWdlV2l0aFBsdWdpbk5hbWUoZGlhZ25vc3RpYy5tZXNzYWdlVGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gdGhlIGNhc2Ugb2YgYSBjaGFpbiBvZiBtZXNzYWdlcyB3ZSBvbmx5IHdhbnQgdG8gdGFnIHRoZSBoZWFkIG9mIHRoZVxuICAgIC8vICAgY2hhaW4sIGFzIHRoYXQncyB0aGUgZmlyc3QgbGluZSBvZiBtZXNzYWdlIG9uIHRoZSBDTEkuXG4gICAgY29uc3QgY2hhaW46IHRzLkRpYWdub3N0aWNNZXNzYWdlQ2hhaW4gPSBkaWFnbm9zdGljLm1lc3NhZ2VUZXh0O1xuICAgIG1lc3NhZ2VUZXh0ID0ge1xuICAgICAgLi4uY2hhaW4sXG4gICAgICBtZXNzYWdlVGV4dDogdGFnTWVzc2FnZVdpdGhQbHVnaW5OYW1lKGNoYWluLm1lc3NhZ2VUZXh0KVxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHtcbiAgICAuLi5kaWFnbm9zdGljLFxuICAgIG1lc3NhZ2VUZXh0LFxuICB9O1xufVxuXG4vKipcbiAqIGV4cGFuZFNvdXJjZXNGcm9tRGlyZWN0b3JpZXMgZmluZHMgYW55IGRpcmVjdG9yaWVzIHVuZGVyIGZpbGVQYXRoIGFuZCBleHBhbmRzXG4gKiB0aGVtIHRvIHRoZWlyIC5qcyBvciAudHMgY29udGVudHMuXG4gKi9cbmZ1bmN0aW9uIGV4cGFuZFNvdXJjZXNGcm9tRGlyZWN0b3JpZXMoZmlsZUxpc3Q6IHN0cmluZ1tdLCBmaWxlUGF0aDogc3RyaW5nKSB7XG4gIGlmICghZnMuc3RhdFN5bmMoZmlsZVBhdGgpLmlzRGlyZWN0b3J5KCkpIHtcbiAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgoJy50cycpIHx8IGZpbGVQYXRoLmVuZHNXaXRoKCcudHN4JykgfHxcbiAgICAgICAgZmlsZVBhdGguZW5kc1dpdGgoJy5qcycpKSB7XG4gICAgICBmaWxlTGlzdC5wdXNoKGZpbGVQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSBmcy5yZWFkZGlyU3luYyhmaWxlUGF0aCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGV4cGFuZFNvdXJjZXNGcm9tRGlyZWN0b3JpZXMoZmlsZUxpc3QsIHBhdGguam9pbihmaWxlUGF0aCwgZW50cnkpKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBzaW5nbGUgYnVpbGQsIHJldHVybmluZyBmYWxzZSBvbiBmYWlsdXJlLiAgVGhpcyBpcyBwb3RlbnRpYWxseSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIChvbmNlIHBlciBiYXplbCByZXF1ZXN0KSB3aGVuIHJ1bm5pbmcgYXMgYSBiYXplbCB3b3JrZXIuXG4gKiBBbnkgZW5jb3VudGVyZWQgZXJyb3JzIGFyZSB3cml0dGVuIHRvIHN0ZGVyci5cbiAqL1xuZnVuY3Rpb24gcnVuT25lQnVpbGQoXG4gICAgYXJnczogc3RyaW5nW10sIGlucHV0cz86IHtbcGF0aDogc3RyaW5nXTogc3RyaW5nfSk6IGJvb2xlYW4ge1xuICBpZiAoYXJncy5sZW5ndGggIT09IDEpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFeHBlY3RlZCBvbmUgYXJndW1lbnQ6IHBhdGggdG8gdHNjb25maWcuanNvbicpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBlcmZUcmFjZS5zbmFwc2hvdE1lbW9yeVVzYWdlKCk7XG5cbiAgLy8gU3RyaXAgbGVhZGluZyBhdC1zaWducywgdXNlZCBpbiBidWlsZF9kZWZzLmJ6bCB0byBpbmRpY2F0ZSBhIHBhcmFtcyBmaWxlXG4gIGNvbnN0IHRzY29uZmlnRmlsZSA9IGFyZ3NbMF0ucmVwbGFjZSgvXkArLywgJycpO1xuICBjb25zdCBbcGFyc2VkLCBlcnJvcnMsIHt0YXJnZXR9XSA9IHBhcnNlVHNjb25maWcodHNjb25maWdGaWxlKTtcbiAgaWYgKGVycm9ycykge1xuICAgIGNvbnNvbGUuZXJyb3IoYmF6ZWxEaWFnbm9zdGljcy5mb3JtYXQodGFyZ2V0LCBlcnJvcnMpKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKCFwYXJzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdJbXBvc3NpYmxlIHN0YXRlOiBpZiBwYXJzZVRzY29uZmlnIHJldHVybnMgbm8gZXJyb3JzLCB0aGVuIHBhcnNlZCBzaG91bGQgYmUgbm9uLW51bGwnKTtcbiAgfVxuICBjb25zdCB7XG4gICAgb3B0aW9ucyxcbiAgICBiYXplbE9wdHMsXG4gICAgZmlsZXMsXG4gICAgZGlzYWJsZWRUc2V0c2VSdWxlcyxcbiAgICBhbmd1bGFyQ29tcGlsZXJPcHRpb25zXG4gIH0gPSBwYXJzZWQ7XG5cbiAgY29uc3Qgc291cmNlRmlsZXM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IGZpbGVzW2ldO1xuICAgIGV4cGFuZFNvdXJjZXNGcm9tRGlyZWN0b3JpZXMoc291cmNlRmlsZXMsIGZpbGVQYXRoKTtcbiAgfVxuXG4gIGlmIChiYXplbE9wdHMubWF4Q2FjaGVTaXplTWIgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1heENhY2hlU2l6ZUJ5dGVzID0gYmF6ZWxPcHRzLm1heENhY2hlU2l6ZU1iICogKDEgPDwgMjApO1xuICAgIGNhY2hlLnNldE1heENhY2hlU2l6ZShtYXhDYWNoZVNpemVCeXRlcyk7XG4gIH0gZWxzZSB7XG4gICAgY2FjaGUucmVzZXRNYXhDYWNoZVNpemUoKTtcbiAgfVxuXG4gIGxldCBmaWxlTG9hZGVyOiBGaWxlTG9hZGVyO1xuICBpZiAoaW5wdXRzKSB7XG4gICAgZmlsZUxvYWRlciA9IG5ldyBDYWNoZWRGaWxlTG9hZGVyKGNhY2hlKTtcbiAgICAvLyBSZXNvbHZlIHRoZSBpbnB1dHMgdG8gYWJzb2x1dGUgcGF0aHMgdG8gbWF0Y2ggVHlwZVNjcmlwdCBpbnRlcm5hbHNcbiAgICBjb25zdCByZXNvbHZlZElucHV0cyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXRzKSkge1xuICAgICAgcmVzb2x2ZWRJbnB1dHMuc2V0KHJlc29sdmVOb3JtYWxpemVkUGF0aChrZXkpLCBpbnB1dHNba2V5XSk7XG4gICAgfVxuICAgIGNhY2hlLnVwZGF0ZUNhY2hlKHJlc29sdmVkSW5wdXRzKTtcbiAgfSBlbHNlIHtcbiAgICBmaWxlTG9hZGVyID0gbmV3IFVuY2FjaGVkRmlsZUxvYWRlcigpO1xuICB9XG5cbiAgY29uc3QgcGVyZlRyYWNlUGF0aCA9IGJhemVsT3B0cy5wZXJmVHJhY2VQYXRoO1xuICBpZiAoIXBlcmZUcmFjZVBhdGgpIHtcbiAgICBjb25zdCB7ZGlhZ25vc3RpY3N9ID0gY3JlYXRlUHJvZ3JhbUFuZEVtaXQoXG4gICAgICAgIGZpbGVMb2FkZXIsIG9wdGlvbnMsIGJhemVsT3B0cywgc291cmNlRmlsZXMsIGRpc2FibGVkVHNldHNlUnVsZXMsXG4gICAgICAgIGFuZ3VsYXJDb21waWxlck9wdGlvbnMpO1xuICAgIGlmIChkaWFnbm9zdGljcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGJhemVsRGlhZ25vc3RpY3MuZm9ybWF0KGJhemVsT3B0cy50YXJnZXQsIGRpYWdub3N0aWNzKSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbG9nKCdXcml0aW5nIHRyYWNlIHRvJywgcGVyZlRyYWNlUGF0aCk7XG4gIGNvbnN0IHN1Y2Nlc3MgPSBwZXJmVHJhY2Uud3JhcCgncnVuT25lQnVpbGQnLCAoKSA9PiB7XG4gICAgY29uc3Qge2RpYWdub3N0aWNzfSA9IGNyZWF0ZVByb2dyYW1BbmRFbWl0KFxuICAgICAgICBmaWxlTG9hZGVyLCBvcHRpb25zLCBiYXplbE9wdHMsIHNvdXJjZUZpbGVzLCBkaXNhYmxlZFRzZXRzZVJ1bGVzLFxuICAgICAgICBhbmd1bGFyQ29tcGlsZXJPcHRpb25zKTtcbiAgICBpZiAoZGlhZ25vc3RpY3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5lcnJvcihiYXplbERpYWdub3N0aWNzLmZvcm1hdChiYXplbE9wdHMudGFyZ2V0LCBkaWFnbm9zdGljcykpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIGlmICghc3VjY2VzcykgcmV0dXJuIGZhbHNlO1xuICAvLyBGb3JjZSBhIGdhcmJhZ2UgY29sbGVjdGlvbiBwYXNzLiAgVGhpcyBrZWVwcyBvdXIgbWVtb3J5IHVzYWdlXG4gIC8vIGNvbnNpc3RlbnQgYWNyb3NzIG11bHRpcGxlIGNvbXBpbGF0aW9ucywgYW5kIGFsbG93cyB0aGUgZmlsZVxuICAvLyBjYWNoZSB0byB1c2UgdGhlIGN1cnJlbnQgbWVtb3J5IHVzYWdlIGFzIGEgZ3VpZGVsaW5lIGZvciBleHBpcmluZ1xuICAvLyBkYXRhLiAgTm90ZTogdGhpcyBpcyBpbnRlbnRpb25hbGx5IG5vdCB3aXRoaW4gcnVuRnJvbU9wdGlvbnMoKSwgYXNcbiAgLy8gd2Ugd2FudCB0byBnYyBvbmx5IGFmdGVyIGFsbCBpdHMgbG9jYWxzIGhhdmUgZ29uZSBvdXQgb2Ygc2NvcGUuXG4gIGdsb2JhbC5nYygpO1xuXG4gIHBlcmZUcmFjZS5zbmFwc2hvdE1lbW9yeVVzYWdlKCk7XG4gIHBlcmZUcmFjZS53cml0ZShwZXJmVHJhY2VQYXRoKTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gV2Ugb25seSBhbGxvdyBvdXIgb3duIGNvZGUgdG8gdXNlIHRoZSBleHBlY3RlZF9kaWFnbm9zdGljcyBhdHRyaWJ1dGVcbmNvbnN0IGV4cGVjdERpYWdub3N0aWNzV2hpdGVsaXN0OiBzdHJpbmdbXSA9IFtcbl07XG5cbi8qKiBlcnJvckRpYWcgcHJvZHVjZXMgYW4gZXJyb3IgZGlhZ25vc3RpYyBub3QgYm91bmQgdG8gYSBmaWxlIG9yIGxvY2F0aW9uLiAqL1xuZnVuY3Rpb24gZXJyb3JEaWFnKG1lc3NhZ2VUZXh0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIHtcbiAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgIGNvZGU6IDAsXG4gICAgZmlsZTogdW5kZWZpbmVkLFxuICAgIHN0YXJ0OiB1bmRlZmluZWQsXG4gICAgbGVuZ3RoOiB1bmRlZmluZWQsXG4gICAgbWVzc2FnZVRleHQsXG4gIH07XG59XG5cbi8qKlxuICogY3JlYXRlUHJvZ3JhbUFuZEVtaXQgY3JlYXRlcyBhIHRzLlByb2dyYW0gZnJvbSB0aGUgZ2l2ZW4gb3B0aW9ucyBhbmQgZW1pdHMgaXRcbiAqIGFjY29yZGluZyB0byB0aGVtIChlLmcuIGluY2x1ZGluZyBydW5uaW5nIHZhcmlvdXMgcGx1Z2lucyBhbmQgdHNpY2tsZSkuIEl0XG4gKiByZXR1cm5zIHRoZSBwcm9ncmFtIGFuZCBhbnkgZGlhZ25vc3RpY3MgZ2VuZXJhdGVkLlxuICpcbiAqIENhbGxlcnMgc2hvdWxkIGNoZWNrIGFuZCBlbWl0IGRpYWdub3N0aWNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZ3JhbUFuZEVtaXQoXG4gICAgZmlsZUxvYWRlcjogRmlsZUxvYWRlciwgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLFxuICAgIGJhemVsT3B0czogQmF6ZWxPcHRpb25zLCBmaWxlczogc3RyaW5nW10sIGRpc2FibGVkVHNldHNlUnVsZXM6IHN0cmluZ1tdLFxuICAgIGFuZ3VsYXJDb21waWxlck9wdGlvbnM/OiB7W2tleTogc3RyaW5nXTogdW5rbm93bn0pOlxuICAgIHtwcm9ncmFtPzogdHMuUHJvZ3JhbSwgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXX0ge1xuICAvLyBCZXdhcmUhIGNyZWF0ZVByb2dyYW1BbmRFbWl0IG11c3Qgbm90IHByaW50IHRvIGNvbnNvbGUsIG5vciBleGl0IGV0Yy5cbiAgLy8gSGFuZGxlIGVycm9ycyBieSByZXBvcnRpbmcgYW5kIHJldHVybmluZyBkaWFnbm9zdGljcy5cbiAgcGVyZlRyYWNlLnNuYXBzaG90TWVtb3J5VXNhZ2UoKTtcbiAgY2FjaGUucmVzZXRTdGF0cygpO1xuICBjYWNoZS50cmFjZVN0YXRzKCk7XG5cbiAgY29uc3QgY29tcGlsZXJIb3N0RGVsZWdhdGUgPVxuICAgICAgdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHt0YXJnZXQ6IHRzLlNjcmlwdFRhcmdldC5FUzV9KTtcblxuICBjb25zdCBtb2R1bGVSZXNvbHZlciA9IGJhemVsT3B0cy5pc0pzVHJhbnNwaWxhdGlvbiA/XG4gICAgICBtYWtlSnNNb2R1bGVSZXNvbHZlcihiYXplbE9wdHMud29ya3NwYWNlTmFtZSkgOlxuICAgICAgdHMucmVzb2x2ZU1vZHVsZU5hbWU7XG4gIGNvbnN0IHRzaWNrbGVDb21waWxlckhvc3QgPSBuZXcgQ29tcGlsZXJIb3N0KFxuICAgICAgZmlsZXMsIG9wdGlvbnMsIGJhemVsT3B0cywgY29tcGlsZXJIb3N0RGVsZWdhdGUsIGZpbGVMb2FkZXIsXG4gICAgICBtb2R1bGVSZXNvbHZlcik7XG4gIGxldCBjb21waWxlckhvc3Q6IFBsdWdpbkNvbXBpbGVySG9zdCA9IHRzaWNrbGVDb21waWxlckhvc3Q7XG4gIGNvbnN0IGRpYWdub3N0aWNQbHVnaW5zOiBEaWFnbm9zdGljUGx1Z2luW10gPSBbXTtcblxuICBsZXQgYW5ndWxhclBsdWdpbjogVHNjUGx1Z2lufHVuZGVmaW5lZDtcbiAgaWYgKGJhemVsT3B0cy5jb21waWxlQW5ndWxhclRlbXBsYXRlcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBuZ09wdGlvbnMgPSBhbmd1bGFyQ29tcGlsZXJPcHRpb25zIHx8IHt9O1xuICAgICAgLy8gQWRkIHRoZSByb290RGlyIHNldHRpbmcgdG8gdGhlIG9wdGlvbnMgcGFzc2VkIHRvIE5nVHNjUGx1Z2luLlxuICAgICAgLy8gUmVxdWlyZWQgc28gdGhhdCBzeW50aGV0aWMgZmlsZXMgYWRkZWQgdG8gdGhlIHJvb3RGaWxlcyBpbiB0aGUgcHJvZ3JhbVxuICAgICAgLy8gY2FuIGJlIGdpdmVuIGFic29sdXRlIHBhdGhzLCBqdXN0IGFzIHdlIGRvIGluIHRzY29uZmlnLnRzLCBtYXRjaGluZ1xuICAgICAgLy8gdGhlIGJlaGF2aW9yIGluIFR5cGVTY3JpcHQncyB0c2NvbmZpZyBwYXJzaW5nIGxvZ2ljLlxuICAgICAgbmdPcHRpb25zWydyb290RGlyJ10gPSBvcHRpb25zLnJvb3REaXI7XG5cbiAgICAgIC8vIER5bmFtaWNhbGx5IGxvYWQgdGhlIEFuZ3VsYXIgY29tcGlsZXIgaW5zdGFsbGVkIGFzIGEgcGVlckRlcFxuICAgICAgY29uc3Qgbmd0c2MgPSByZXF1aXJlKCdAYW5ndWxhci9jb21waWxlci1jbGknKTtcbiAgICAgIGFuZ3VsYXJQbHVnaW4gPSBuZXcgbmd0c2MuTmdUc2NQbHVnaW4obmdPcHRpb25zKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBkaWFnbm9zdGljczogW2Vycm9yRGlhZyhcbiAgICAgICAgICAgICd3aGVuIHVzaW5nIGB0c19saWJyYXJ5KGNvbXBpbGVfYW5ndWxhcl90ZW1wbGF0ZXM9VHJ1ZSlgLCAnICtcbiAgICAgICAgICAgIGB5b3UgbXVzdCBpbnN0YWxsIEBhbmd1bGFyL2NvbXBpbGVyLWNsaSAod2FzOiAke2V9KWApXVxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBXcmFwIGhvc3Qgb25seSBuZWVkZWQgdW50aWwgYWZ0ZXIgSXZ5IGNsZWFudXBcbiAgICAvLyBUT0RPKGFsZXhlYWdsZSk6IHJlbW92ZSBhZnRlciBuZ3N1bW1hcnkgYW5kIG5nZmFjdG9yeSBmaWxlcyBlbGltaW5hdGVkXG4gICAgY29tcGlsZXJIb3N0ID0gYW5ndWxhclBsdWdpbiEud3JhcEhvc3QhKGZpbGVzLCBjb21waWxlckhvc3QpO1xuICB9XG5cblxuICBjb25zdCBvbGRQcm9ncmFtID0gY2FjaGUuZ2V0UHJvZ3JhbShiYXplbE9wdHMudGFyZ2V0KTtcbiAgY29uc3QgcHJvZ3JhbSA9IHBlcmZUcmFjZS53cmFwKFxuICAgICAgJ2NyZWF0ZVByb2dyYW0nLFxuICAgICAgKCkgPT4gdHMuY3JlYXRlUHJvZ3JhbShcbiAgICAgICAgICBjb21waWxlckhvc3QuaW5wdXRGaWxlcywgb3B0aW9ucywgY29tcGlsZXJIb3N0LCBvbGRQcm9ncmFtKSk7XG4gIGNhY2hlLnB1dFByb2dyYW0oYmF6ZWxPcHRzLnRhcmdldCwgcHJvZ3JhbSk7XG5cblxuICBpZiAoIWJhemVsT3B0cy5pc0pzVHJhbnNwaWxhdGlvbikge1xuICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgVHlwZVNjcmlwdCB0eXBlIGVycm9ycyBhYm9ydCBub3csIHNvIHRoZSBlcnJvclxuICAgIC8vIG1lc3NhZ2VzIHJlZmVyIHRvIHRoZSBvcmlnaW5hbCBzb3VyY2UuICBBZnRlciBhbnkgc3Vic2VxdWVudCBwYXNzZXNcbiAgICAvLyAoZGVjb3JhdG9yIGRvd25sZXZlbGluZyBvciB0c2lja2xlKSB3ZSBkbyBub3QgdHlwZSBjaGVjay5cbiAgICBsZXQgZGlhZ25vc3RpY3MgPSBnYXRoZXJEaWFnbm9zdGljcyhcbiAgICAgICAgb3B0aW9ucywgYmF6ZWxPcHRzLCBwcm9ncmFtLCBkaXNhYmxlZFRzZXRzZVJ1bGVzLCBhbmd1bGFyUGx1Z2luLFxuICAgICAgICBkaWFnbm9zdGljUGx1Z2lucyk7XG4gICAgaWYgKCFleHBlY3REaWFnbm9zdGljc1doaXRlbGlzdC5sZW5ndGggfHxcbiAgICAgICAgZXhwZWN0RGlhZ25vc3RpY3NXaGl0ZWxpc3Quc29tZShwID0+IGJhemVsT3B0cy50YXJnZXQuc3RhcnRzV2l0aChwKSkpIHtcbiAgICAgIGRpYWdub3N0aWNzID0gYmF6ZWxEaWFnbm9zdGljcy5maWx0ZXJFeHBlY3RlZChcbiAgICAgICAgICBiYXplbE9wdHMsIGRpYWdub3N0aWNzLCBiYXplbERpYWdub3N0aWNzLnVnbHlGb3JtYXQpO1xuICAgIH0gZWxzZSBpZiAoYmF6ZWxPcHRzLmV4cGVjdGVkRGlhZ25vc3RpY3MubGVuZ3RoID4gMCkge1xuICAgICAgZGlhZ25vc3RpY3MucHVzaChlcnJvckRpYWcoXG4gICAgICAgICAgYE9ubHkgdGFyZ2V0cyB1bmRlciAke1xuICAgICAgICAgICAgICBleHBlY3REaWFnbm9zdGljc1doaXRlbGlzdC5qb2luKCcsICcpfSBjYW4gdXNlIGAgK1xuICAgICAgICAgICdleHBlY3RlZF9kaWFnbm9zdGljcywgYnV0IGdvdCAnICsgYmF6ZWxPcHRzLnRhcmdldCkpO1xuICAgIH1cblxuICAgIGlmIChkaWFnbm9zdGljcy5sZW5ndGggPiAwKSB7XG4gICAgICBkZWJ1ZygnY29tcGlsYXRpb24gZmFpbGVkIGF0JywgbmV3IEVycm9yKCkuc3RhY2shKTtcbiAgICAgIHJldHVybiB7cHJvZ3JhbSwgZGlhZ25vc3RpY3N9O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNvbXBpbGF0aW9uVGFyZ2V0cyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmaWxlTmFtZSA9PiBpc0NvbXBpbGF0aW9uVGFyZ2V0KGJhemVsT3B0cywgZmlsZU5hbWUpKTtcblxuICBsZXQgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSA9IFtdO1xuICBsZXQgdXNlVHNpY2tsZUVtaXQgPSBiYXplbE9wdHMudHNpY2tsZTtcbiAgbGV0IHRyYW5zZm9ybXM6IHRzLkN1c3RvbVRyYW5zZm9ybWVycyA9IHtcbiAgICBiZWZvcmU6IFtdLFxuICAgIGFmdGVyOiBbXSxcbiAgICBhZnRlckRlY2xhcmF0aW9uczogW10sXG4gIH07XG5cbiAgaWYgKGFuZ3VsYXJQbHVnaW4pIHtcbiAgICB0cmFuc2Zvcm1zID0gYW5ndWxhclBsdWdpbi5jcmVhdGVUcmFuc2Zvcm1lcnMhKGNvbXBpbGVySG9zdCk7XG4gIH1cblxuICBpZiAodXNlVHNpY2tsZUVtaXQpIHtcbiAgICBkaWFnbm9zdGljcyA9IGVtaXRXaXRoVHNpY2tsZShcbiAgICAgICAgcHJvZ3JhbSwgdHNpY2tsZUNvbXBpbGVySG9zdCwgY29tcGlsYXRpb25UYXJnZXRzLCBvcHRpb25zLCBiYXplbE9wdHMsXG4gICAgICAgIHRyYW5zZm9ybXMpO1xuICB9IGVsc2Uge1xuICAgIGRpYWdub3N0aWNzID0gZW1pdFdpdGhUeXBlc2NyaXB0KHByb2dyYW0sIGNvbXBpbGF0aW9uVGFyZ2V0cywgdHJhbnNmb3Jtcyk7XG4gIH1cblxuICBpZiAoZGlhZ25vc3RpY3MubGVuZ3RoID4gMCkge1xuICAgIGRlYnVnKCdjb21waWxhdGlvbiBmYWlsZWQgYXQnLCBuZXcgRXJyb3IoKS5zdGFjayEpO1xuICB9XG4gIGNhY2hlLnByaW50U3RhdHMoKTtcbiAgcmV0dXJuIHtwcm9ncmFtLCBkaWFnbm9zdGljc307XG59XG5cbmZ1bmN0aW9uIGVtaXRXaXRoVHlwZXNjcmlwdChcbiAgICBwcm9ncmFtOiB0cy5Qcm9ncmFtLCBjb21waWxhdGlvblRhcmdldHM6IHRzLlNvdXJjZUZpbGVbXSxcbiAgICB0cmFuc2Zvcm1zOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMpOiB0cy5EaWFnbm9zdGljW10ge1xuICBjb25zdCBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdID0gW107XG4gIGZvciAoY29uc3Qgc2Ygb2YgY29tcGlsYXRpb25UYXJnZXRzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gcHJvZ3JhbS5lbWl0KFxuICAgICAgICBzZiwgLyp3cml0ZUZpbGUqLyB1bmRlZmluZWQsXG4gICAgICAgIC8qY2FuY2VsbGF0aW9uVG9rZW4qLyB1bmRlZmluZWQsIC8qZW1pdE9ubHlEdHNGaWxlcyovIHVuZGVmaW5lZCxcbiAgICAgICAgdHJhbnNmb3Jtcyk7XG4gICAgZGlhZ25vc3RpY3MucHVzaCguLi5yZXN1bHQuZGlhZ25vc3RpY3MpO1xuICB9XG4gIHJldHVybiBkaWFnbm9zdGljcztcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSBlbWl0IHBpcGVsaW5lIHdpdGggVHNpY2tsZSB0cmFuc2Zvcm1hdGlvbnMgLSBnb29nLm1vZHVsZSByZXdyaXRpbmdcbiAqIGFuZCBDbG9zdXJlIHR5cGVzIGVtaXR0ZWQgaW5jbHVkZWQuXG4gKiBFeHBvcnRlZCB0byBiZSB1c2VkIGJ5IHRoZSBpbnRlcm5hbCBnbG9iYWwgcmVmYWN0b3JpbmcgdG9vbHMuXG4gKiBUT0RPKHJhZG9raXJvdik6IGludmVzdGlnYXRlIHVzaW5nIHJ1bldpdGhPcHRpb25zIGFuZCBtYWtpbmcgdGhpcyBwcml2YXRlXG4gKiBhZ2FpbiwgaWYgd2UgY2FuIG1ha2UgY29tcGlsZXJIb3N0cyBtYXRjaC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtaXRXaXRoVHNpY2tsZShcbiAgICBwcm9ncmFtOiB0cy5Qcm9ncmFtLCBjb21waWxlckhvc3Q6IENvbXBpbGVySG9zdCxcbiAgICBjb21waWxhdGlvblRhcmdldHM6IHRzLlNvdXJjZUZpbGVbXSwgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLFxuICAgIGJhemVsT3B0czogQmF6ZWxPcHRpb25zLFxuICAgIHRyYW5zZm9ybXM6IHRzLkN1c3RvbVRyYW5zZm9ybWVycyk6IHRzLkRpYWdub3N0aWNbXSB7XG4gIGNvbnN0IGVtaXRSZXN1bHRzOiB0c2lja2xlLkVtaXRSZXN1bHRbXSA9IFtdO1xuICBjb25zdCBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdID0gW107XG4gIC8vIFRoZSAndHNpY2tsZScgaW1wb3J0IGFib3ZlIGlzIG9ubHkgdXNlZCBpbiB0eXBlIHBvc2l0aW9ucywgc28gaXQgd29uJ3RcbiAgLy8gcmVzdWx0IGluIGEgcnVudGltZSBkZXBlbmRlbmN5IG9uIHRzaWNrbGUuXG4gIC8vIElmIHRoZSB1c2VyIHJlcXVlc3RzIHRoZSB0c2lja2xlIGVtaXQsIHRoZW4gd2UgZHluYW1pY2FsbHkgcmVxdWlyZSBpdFxuICAvLyBoZXJlIGZvciB1c2UgYXQgcnVudGltZS5cbiAgbGV0IG9wdFRzaWNrbGU6IHR5cGVvZiB0c2lja2xlO1xuICB0cnkge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1yZXF1aXJlLWltcG9ydHNcbiAgICBvcHRUc2lja2xlID0gcmVxdWlyZSgndHNpY2tsZScpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUuY29kZSAhPT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdXaGVuIHNldHRpbmcgYmF6ZWxPcHRzIHsgdHNpY2tsZTogdHJ1ZSB9LCAnICtcbiAgICAgICAgJ3lvdSBtdXN0IGFsc28gYWRkIGEgZGV2RGVwZW5kZW5jeSBvbiB0aGUgdHNpY2tsZSBucG0gcGFja2FnZScpO1xuICB9XG4gIHBlcmZUcmFjZS53cmFwKCdlbWl0JywgKCkgPT4ge1xuICAgIGZvciAoY29uc3Qgc2Ygb2YgY29tcGlsYXRpb25UYXJnZXRzKSB7XG4gICAgICBwZXJmVHJhY2Uud3JhcChgZW1pdCAke3NmLmZpbGVOYW1lfWAsICgpID0+IHtcbiAgICAgICAgZW1pdFJlc3VsdHMucHVzaChvcHRUc2lja2xlLmVtaXRXaXRoVHNpY2tsZShcbiAgICAgICAgICAgIHByb2dyYW0sIGNvbXBpbGVySG9zdCwgY29tcGlsZXJIb3N0LCBvcHRpb25zLCBzZixcbiAgICAgICAgICAgIC8qd3JpdGVGaWxlKi8gdW5kZWZpbmVkLFxuICAgICAgICAgICAgLypjYW5jZWxsYXRpb25Ub2tlbiovIHVuZGVmaW5lZCwgLyplbWl0T25seUR0c0ZpbGVzKi8gdW5kZWZpbmVkLCB7XG4gICAgICAgICAgICAgIGJlZm9yZVRzOiB0cmFuc2Zvcm1zLmJlZm9yZSxcbiAgICAgICAgICAgICAgYWZ0ZXJUczogdHJhbnNmb3Jtcy5hZnRlcixcbiAgICAgICAgICAgICAgYWZ0ZXJEZWNsYXJhdGlvbnM6IHRyYW5zZm9ybXMuYWZ0ZXJEZWNsYXJhdGlvbnMsXG4gICAgICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCBlbWl0UmVzdWx0ID0gb3B0VHNpY2tsZS5tZXJnZUVtaXRSZXN1bHRzKGVtaXRSZXN1bHRzKTtcbiAgZGlhZ25vc3RpY3MucHVzaCguLi5lbWl0UmVzdWx0LmRpYWdub3N0aWNzKTtcblxuICAvLyBJZiB0c2lja2xlIHJlcG9ydGVkIGRpYWdub3N0aWNzLCBkb24ndCBwcm9kdWNlIGV4dGVybnMgb3IgbWFuaWZlc3Qgb3V0cHV0cy5cbiAgaWYgKGRpYWdub3N0aWNzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gZGlhZ25vc3RpY3M7XG4gIH1cblxuICBsZXQgZXh0ZXJucyA9ICcvKiogQGV4dGVybnMgKi9cXG4nICtcbiAgICAgICcvLyBnZW5lcmF0aW5nIGV4dGVybnMgd2FzIGRpc2FibGVkIHVzaW5nIGdlbmVyYXRlX2V4dGVybnM9RmFsc2VcXG4nO1xuICBpZiAoYmF6ZWxPcHRzLnRzaWNrbGVHZW5lcmF0ZUV4dGVybnMpIHtcbiAgICBleHRlcm5zID1cbiAgICAgICAgb3B0VHNpY2tsZS5nZXRHZW5lcmF0ZWRFeHRlcm5zKGVtaXRSZXN1bHQuZXh0ZXJucywgb3B0aW9ucy5yb290RGlyISk7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMubm9FbWl0ICYmIGJhemVsT3B0cy50c2lja2xlRXh0ZXJuc1BhdGgpIHtcbiAgICAvLyBOb3RlOiB3aGVuIHRzaWNrbGVFeHRlcm5zUGF0aCBpcyBwcm92aWRlZCwgd2UgYWx3YXlzIHdyaXRlIGEgZmlsZSBhcyBhXG4gICAgLy8gbWFya2VyIHRoYXQgY29tcGlsYXRpb24gc3VjY2VlZGVkLCBldmVuIGlmIGl0J3MgZW1wdHkgKGp1c3QgY29udGFpbmluZyBhblxuICAgIC8vIEBleHRlcm5zKS5cbiAgICBmcy53cml0ZUZpbGVTeW5jKGJhemVsT3B0cy50c2lja2xlRXh0ZXJuc1BhdGgsIGV4dGVybnMpO1xuXG4gICAgLy8gV2hlbiBnZW5lcmF0aW5nIGV4dGVybnMsIGdlbmVyYXRlIGFuIGV4dGVybnMgZmlsZSBmb3IgZWFjaCBvZiB0aGUgaW5wdXRcbiAgICAvLyAuZC50cyBmaWxlcy5cbiAgICBpZiAoYmF6ZWxPcHRzLnRzaWNrbGVHZW5lcmF0ZUV4dGVybnMgJiZcbiAgICAgICAgY29tcGlsZXJIb3N0LnByb3ZpZGVFeHRlcm5hbE1vZHVsZUR0c05hbWVzcGFjZSkge1xuICAgICAgZm9yIChjb25zdCBleHRlcm4gb2YgY29tcGlsYXRpb25UYXJnZXRzKSB7XG4gICAgICAgIGlmICghZXh0ZXJuLmlzRGVjbGFyYXRpb25GaWxlKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgb3V0cHV0QmFzZURpciA9IG9wdGlvbnMub3V0RGlyITtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVPdXRwdXRQYXRoID1cbiAgICAgICAgICAgIGNvbXBpbGVySG9zdC5yZWxhdGl2ZU91dHB1dFBhdGgoZXh0ZXJuLmZpbGVOYW1lKTtcbiAgICAgICAgbWtkaXJwKG91dHB1dEJhc2VEaXIsIHBhdGguZGlybmFtZShyZWxhdGl2ZU91dHB1dFBhdGgpKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihvdXRwdXRCYXNlRGlyLCByZWxhdGl2ZU91dHB1dFBhdGgpO1xuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gY29tcGlsZXJIb3N0LnBhdGhUb01vZHVsZU5hbWUoJycsIGV4dGVybi5maWxlTmFtZSk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgICAgYGdvb2cubW9kdWxlKCcke21vZHVsZU5hbWV9Jyk7XFxuYCArXG4gICAgICAgICAgICAgICAgYC8vIEV4cG9ydCBhbiBlbXB0eSBvYmplY3Qgb2YgdW5rbm93biB0eXBlIHRvIGFsbG93IGltcG9ydHMuXFxuYCArXG4gICAgICAgICAgICAgICAgYC8vIFRPRE86IHVzZSB0eXBlb2Ygb25jZSBhdmFpbGFibGVcXG5gICtcbiAgICAgICAgICAgICAgICBgZXhwb3J0cyA9IC8qKiBAdHlwZSB7P30gKi8gKHt9KTtcXG5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoIW9wdGlvbnMubm9FbWl0ICYmIGJhemVsT3B0cy5tYW5pZmVzdCkge1xuICAgIHBlcmZUcmFjZS53cmFwKCdtYW5pZmVzdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG1hbmlmZXN0ID1cbiAgICAgICAgICBjb25zdHJ1Y3RNYW5pZmVzdChlbWl0UmVzdWx0Lm1vZHVsZXNNYW5pZmVzdCwgY29tcGlsZXJIb3N0KTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoYmF6ZWxPcHRzLm1hbmlmZXN0LCBtYW5pZmVzdCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZGlhZ25vc3RpY3M7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RvcmllcyBzdWJkaXIgKGEgc2xhc2ggc2VwYXJhdGVkIHJlbGF0aXZlIHBhdGgpIHN0YXJ0aW5nIGZyb21cbiAqIGJhc2UuXG4gKi9cbmZ1bmN0aW9uIG1rZGlycChiYXNlOiBzdHJpbmcsIHN1YmRpcjogc3RyaW5nKSB7XG4gIGNvbnN0IHN0ZXBzID0gc3ViZGlyLnNwbGl0KHBhdGguc2VwKTtcbiAgbGV0IGN1cnJlbnQgPSBiYXNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgY3VycmVudCA9IHBhdGguam9pbihjdXJyZW50LCBzdGVwc1tpXSk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGN1cnJlbnQpKSBmcy5ta2RpclN5bmMoY3VycmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJlc29sdmUgbW9kdWxlIGZpbGVuYW1lcyBmb3IgSlMgbW9kdWxlcy5cbiAqXG4gKiBKUyBtb2R1bGUgcmVzb2x1dGlvbiBuZWVkcyB0byBiZSBkaWZmZXJlbnQgYmVjYXVzZSB3aGVuIHRyYW5zcGlsaW5nIEpTIHdlXG4gKiBkbyBub3QgcGFzcyBpbiBhbnkgZGVwZW5kZW5jaWVzLCBzbyB0aGUgVFMgbW9kdWxlIHJlc29sdmVyIHdpbGwgbm90IHJlc29sdmVcbiAqIGFueSBmaWxlcy5cbiAqXG4gKiBGb3J0dW5hdGVseSwgSlMgbW9kdWxlIHJlc29sdXRpb24gaXMgdmVyeSBzaW1wbGUuIFRoZSBpbXBvcnRlZCBtb2R1bGUgbmFtZVxuICogbXVzdCBlaXRoZXIgYSByZWxhdGl2ZSBwYXRoLCBvciB0aGUgd29ya3NwYWNlIHJvb3QgKGkuZS4gJ2dvb2dsZTMnKSxcbiAqIHNvIHdlIGNhbiBwZXJmb3JtIG1vZHVsZSByZXNvbHV0aW9uIGVudGlyZWx5IGJhc2VkIG9uIGZpbGUgbmFtZXMsIHdpdGhvdXRcbiAqIGxvb2tpbmcgYXQgdGhlIGZpbGVzeXN0ZW0uXG4gKi9cbmZ1bmN0aW9uIG1ha2VKc01vZHVsZVJlc29sdmVyKHdvcmtzcGFjZU5hbWU6IHN0cmluZykge1xuICAvLyBUaGUgbGl0ZXJhbCAnLycgaGVyZSBpcyBjcm9zcy1wbGF0Zm9ybSBzYWZlIGJlY2F1c2UgaXQncyBtYXRjaGluZyBvblxuICAvLyBpbXBvcnQgc3BlY2lmaWVycywgbm90IGZpbGUgbmFtZXMuXG4gIGNvbnN0IHdvcmtzcGFjZU1vZHVsZVNwZWNpZmllclByZWZpeCA9IGAke3dvcmtzcGFjZU5hbWV9L2A7XG4gIGNvbnN0IHdvcmtzcGFjZURpciA9IGAke3BhdGguc2VwfSR7d29ya3NwYWNlTmFtZX0ke3BhdGguc2VwfWA7XG4gIGZ1bmN0aW9uIGpzTW9kdWxlUmVzb2x2ZXIoXG4gICAgICBtb2R1bGVOYW1lOiBzdHJpbmcsIGNvbnRhaW5pbmdGaWxlOiBzdHJpbmcsXG4gICAgICBjb21waWxlck9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucywgaG9zdDogdHMuTW9kdWxlUmVzb2x1dGlvbkhvc3QpOlxuICAgICAgdHMuUmVzb2x2ZWRNb2R1bGVXaXRoRmFpbGVkTG9va3VwTG9jYXRpb25zIHtcbiAgICBsZXQgcmVzb2x2ZWRGaWxlTmFtZTtcbiAgICBpZiAoY29udGFpbmluZ0ZpbGUgPT09ICcnKSB7XG4gICAgICAvLyBJbiB0c2lja2xlIHdlIHJlc29sdmUgdGhlIGZpbGVuYW1lIGFnYWluc3QgJycgdG8gZ2V0IHRoZSBnb29nIG1vZHVsZVxuICAgICAgLy8gbmFtZSBvZiBhIHNvdXJjZWZpbGUuXG4gICAgICByZXNvbHZlZEZpbGVOYW1lID0gbW9kdWxlTmFtZTtcbiAgICB9IGVsc2UgaWYgKG1vZHVsZU5hbWUuc3RhcnRzV2l0aCh3b3Jrc3BhY2VNb2R1bGVTcGVjaWZpZXJQcmVmaXgpKSB7XG4gICAgICAvLyBHaXZlbiBhIHdvcmtzcGFjZSBuYW1lIG9mICdmb28nLCB3ZSB3YW50IHRvIHJlc29sdmUgaW1wb3J0IHNwZWNpZmllcnNcbiAgICAgIC8vIGxpa2U6ICdmb28vcHJvamVjdC9maWxlLmpzJyB0byB0aGUgYWJzb2x1dGUgZmlsZXN5c3RlbSBwYXRoIG9mXG4gICAgICAvLyBwcm9qZWN0L2ZpbGUuanMgd2l0aGluIHRoZSB3b3Jrc3BhY2UuXG4gICAgICBjb25zdCB3b3Jrc3BhY2VEaXJMb2NhdGlvbiA9IGNvbnRhaW5pbmdGaWxlLmluZGV4T2Yod29ya3NwYWNlRGlyKTtcbiAgICAgIGlmICh3b3Jrc3BhY2VEaXJMb2NhdGlvbiA8IDApIHtcbiAgICAgICAgcmV0dXJuIHtyZXNvbHZlZE1vZHVsZTogdW5kZWZpbmVkfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFic29sdXRlUGF0aFRvV29ya3NwYWNlRGlyID1cbiAgICAgICAgICBjb250YWluaW5nRmlsZS5zbGljZSgwLCB3b3Jrc3BhY2VEaXJMb2NhdGlvbik7XG4gICAgICByZXNvbHZlZEZpbGVOYW1lID0gcGF0aC5qb2luKGFic29sdXRlUGF0aFRvV29ya3NwYWNlRGlyLCBtb2R1bGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFtb2R1bGVOYW1lLnN0YXJ0c1dpdGgoJy4vJykgJiYgIW1vZHVsZU5hbWUuc3RhcnRzV2l0aCgnLi4vJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFVuc3VwcG9ydGVkIG1vZHVsZSBpbXBvcnQgc3BlY2lmaWVyOiAke1xuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KG1vZHVsZU5hbWUpfS5cXG5gICtcbiAgICAgICAgICAgIGBKUyBtb2R1bGUgaW1wb3J0cyBtdXN0IGVpdGhlciBiZSByZWxhdGl2ZSBwYXRocyBgICtcbiAgICAgICAgICAgIGAoYmVnaW5uaW5nIHdpdGggJy4nIG9yICcuLicpLCBgICtcbiAgICAgICAgICAgIGBvciB0aGV5IG11c3QgYmVnaW4gd2l0aCAnJHt3b3Jrc3BhY2VOYW1lfS8nLmApO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZWRGaWxlTmFtZSA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoY29udGFpbmluZ0ZpbGUpLCBtb2R1bGVOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc29sdmVkTW9kdWxlOiB7XG4gICAgICAgIHJlc29sdmVkRmlsZU5hbWUsXG4gICAgICAgIGV4dGVuc2lvbjogdHMuRXh0ZW5zaW9uLkpzLCAgLy8ganMgY2FuIG9ubHkgaW1wb3J0IGpzXG4gICAgICAgIC8vIFRoZXNlIHR3byBmaWVsZHMgYXJlIGNhcmdvIGN1bHRlZCBmcm9tIHdoYXQgdHMucmVzb2x2ZU1vZHVsZU5hbWVcbiAgICAgICAgLy8gc2VlbXMgdG8gcmV0dXJuLlxuICAgICAgICBwYWNrYWdlSWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgaXNFeHRlcm5hbExpYnJhcnlJbXBvcnQ6IGZhbHNlLFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICByZXR1cm4ganNNb2R1bGVSZXNvbHZlcjtcbn1cblxuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgLy8gRG8gbm90IGNhbGwgcHJvY2Vzcy5leGl0KCksIGFzIHRoYXQgdGVybWluYXRlcyB0aGUgYmluYXJ5IGJlZm9yZVxuICAvLyBjb21wbGV0aW5nIHBlbmRpbmcgb3BlcmF0aW9ucywgc3VjaCBhcyB3cml0aW5nIHRvIHN0ZG91dCBvciBlbWl0dGluZyB0aGVcbiAgLy8gdjggcGVyZm9ybWFuY2UgbG9nLiBSYXRoZXIsIHNldCB0aGUgZXhpdCBjb2RlIGFuZCBmYWxsIG9mZiB0aGUgbWFpblxuICAvLyB0aHJlYWQsIHdoaWNoIHdpbGwgY2F1c2Ugbm9kZSB0byB0ZXJtaW5hdGUgY2xlYW5seS5cbiAgcHJvY2Vzcy5leGl0Q29kZSA9IG1haW4ocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbn1cbiJdfQ==