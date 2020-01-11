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
        define(["require", "exports", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const ts = require("typescript");
    /**
     * The same as Node's path.resolve, however it returns a path with forward
     * slashes rather than joining the resolved path with the platform's path
     * separator.
     * Note that even path.posix.resolve('.') returns C:\Users\... with backslashes.
     */
    function resolveNormalizedPath(...segments) {
        return path.resolve(...segments).replace(/\\/g, '/');
    }
    exports.resolveNormalizedPath = resolveNormalizedPath;
    /**
     * Load a tsconfig.json and convert all referenced paths (including
     * bazelOptions) to absolute paths.
     * Paths seen by TypeScript should be absolute, to match behavior
     * of the tsc ModuleResolution implementation.
     * @param tsconfigFile path to tsconfig, relative to process.cwd() or absolute
     * @return configuration parsed from the file, or error diagnostics
     */
    function parseTsconfig(tsconfigFile, host = ts.sys) {
        // TypeScript expects an absolute path for the tsconfig.json file
        tsconfigFile = resolveNormalizedPath(tsconfigFile);
        const isUndefined = (value) => value === undefined;
        // Handle bazel specific options, but make sure not to crash when reading a
        // vanilla tsconfig.json.
        const readExtendedConfigFile = (configFile, existingConfig) => {
            const { config, error } = ts.readConfigFile(configFile, host.readFile);
            if (error) {
                return { error };
            }
            // Allow Bazel users to control some of the bazel options.
            // Since TypeScript's "extends" mechanism applies only to "compilerOptions"
            // we have to repeat some of their logic to get the user's bazelOptions.
            const mergedConfig = existingConfig || config;
            if (existingConfig) {
                const existingBazelOpts = existingConfig.bazelOptions || {};
                const newBazelBazelOpts = config.bazelOptions || {};
                mergedConfig.bazelOptions = Object.assign({}, existingBazelOpts, { disableStrictDeps: isUndefined(existingBazelOpts.disableStrictDeps)
                        ? newBazelBazelOpts.disableStrictDeps
                        : existingBazelOpts.disableStrictDeps, suppressTsconfigOverrideWarnings: isUndefined(existingBazelOpts.suppressTsconfigOverrideWarnings)
                        ? newBazelBazelOpts.suppressTsconfigOverrideWarnings
                        : existingBazelOpts.suppressTsconfigOverrideWarnings, tsickle: isUndefined(existingBazelOpts.tsickle)
                        ? newBazelBazelOpts.tsickle
                        : existingBazelOpts.tsickle, googmodule: isUndefined(existingBazelOpts.googmodule)
                        ? newBazelBazelOpts.googmodule
                        : existingBazelOpts.googmodule, devmodeTargetOverride: isUndefined(existingBazelOpts.devmodeTargetOverride)
                        ? newBazelBazelOpts.devmodeTargetOverride
                        : existingBazelOpts.devmodeTargetOverride });
            }
            if (config.extends) {
                let extendedConfigPath = resolveNormalizedPath(path.dirname(configFile), config.extends);
                if (!extendedConfigPath.endsWith('.json'))
                    extendedConfigPath += '.json';
                return readExtendedConfigFile(extendedConfigPath, mergedConfig);
            }
            return { config: mergedConfig };
        };
        const { config, error } = readExtendedConfigFile(tsconfigFile);
        if (error) {
            // target is in the config file we failed to load...
            return [null, [error], { target: '' }];
        }
        const { options, errors, fileNames } = ts.parseJsonConfigFileContent(config, host, path.dirname(tsconfigFile));
        // Handle bazel specific options, but make sure not to crash when reading a
        // vanilla tsconfig.json.
        const bazelOpts = config.bazelOptions || {};
        const target = bazelOpts.target;
        bazelOpts.allowedStrictDeps = bazelOpts.allowedStrictDeps || [];
        bazelOpts.typeBlackListPaths = bazelOpts.typeBlackListPaths || [];
        bazelOpts.compilationTargetSrc = bazelOpts.compilationTargetSrc || [];
        if (errors && errors.length) {
            return [null, errors, { target }];
        }
        // Override the devmode target if devmodeTargetOverride is set
        if (bazelOpts.es5Mode && bazelOpts.devmodeTargetOverride) {
            switch (bazelOpts.devmodeTargetOverride.toLowerCase()) {
                case 'es3':
                    options.target = ts.ScriptTarget.ES3;
                    break;
                case 'es5':
                    options.target = ts.ScriptTarget.ES5;
                    break;
                case 'es2015':
                    options.target = ts.ScriptTarget.ES2015;
                    break;
                case 'es2016':
                    options.target = ts.ScriptTarget.ES2016;
                    break;
                case 'es2017':
                    options.target = ts.ScriptTarget.ES2017;
                    break;
                case 'es2018':
                    options.target = ts.ScriptTarget.ES2018;
                    break;
                case 'esnext':
                    options.target = ts.ScriptTarget.ESNext;
                    break;
                default:
                    console.error('WARNING: your tsconfig.json file specifies an invalid bazelOptions.devmodeTargetOverride value of: \'${bazelOpts.devmodeTargetOverride\'');
            }
        }
        // Sort rootDirs with longest include directories first.
        // When canonicalizing paths, we always want to strip
        // `workspace/bazel-bin/file` to just `file`, not to `bazel-bin/file`.
        if (options.rootDirs)
            options.rootDirs.sort((a, b) => b.length - a.length);
        // If the user requested goog.module, we need to produce that output even if
        // the generated tsconfig indicates otherwise.
        if (bazelOpts.googmodule)
            options.module = ts.ModuleKind.CommonJS;
        // TypeScript's parseJsonConfigFileContent returns paths that are joined, eg.
        // /path/to/project/bazel-out/arch/bin/path/to/package/../../../../../../path
        // We normalize them to remove the intermediate parent directories.
        // This improves error messages and also matches logic in tsc_wrapped where we
        // expect normalized paths.
        const files = fileNames.map(f => path.posix.normalize(f));
        // The bazelOpts paths in the tsconfig are relative to
        // options.rootDir (the workspace root) and aren't transformed by
        // parseJsonConfigFileContent (because TypeScript doesn't know
        // about them). Transform them to also be absolute here.
        bazelOpts.compilationTargetSrc = bazelOpts.compilationTargetSrc.map(f => resolveNormalizedPath(options.rootDir, f));
        bazelOpts.allowedStrictDeps = bazelOpts.allowedStrictDeps.map(f => resolveNormalizedPath(options.rootDir, f));
        bazelOpts.typeBlackListPaths = bazelOpts.typeBlackListPaths.map(f => resolveNormalizedPath(options.rootDir, f));
        if (bazelOpts.nodeModulesPrefix) {
            bazelOpts.nodeModulesPrefix =
                resolveNormalizedPath(options.rootDir, bazelOpts.nodeModulesPrefix);
        }
        let disabledTsetseRules = [];
        for (const pluginConfig of options['plugins'] ||
            []) {
            if (pluginConfig.name && pluginConfig.name === '@bazel/tsetse') {
                const disabledRules = pluginConfig['disabledRules'];
                if (disabledRules && !Array.isArray(disabledRules)) {
                    throw new Error('Disabled tsetse rules must be an array of rule names');
                }
                disabledTsetseRules = disabledRules;
                break;
            }
        }
        return [
            { options, bazelOpts, files, config, disabledTsetseRules }, null, { target }
        ];
    }
    exports.parseTsconfig = parseTsconfig;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL3RzY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7Ozs7Ozs7Ozs7O0lBRUgsNkJBQTZCO0lBQzdCLGlDQUFpQztJQWtNakM7Ozs7O09BS0c7SUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxHQUFHLFFBQWtCO1FBQ3pELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUZELHNEQUVDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILFNBQWdCLGFBQWEsQ0FDekIsWUFBb0IsRUFBRSxPQUEyQixFQUFFLENBQUMsR0FBRztRQUV6RCxpRUFBaUU7UUFDakUsWUFBWSxHQUFHLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRW5ELE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBVSxFQUFzQixFQUFFLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQztRQUU1RSwyRUFBMkU7UUFDM0UseUJBQXlCO1FBRXpCLE1BQU0sc0JBQXNCLEdBQzFCLENBQUMsVUFBa0IsRUFBRSxjQUFvQixFQUF5QyxFQUFFO1lBQ2xGLE1BQU0sRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXJFLElBQUksS0FBSyxFQUFFO2dCQUNULE9BQU8sRUFBQyxLQUFLLEVBQUMsQ0FBQzthQUNoQjtZQUVELDBEQUEwRDtZQUMxRCwyRUFBMkU7WUFDM0Usd0VBQXdFO1lBQ3hFLE1BQU0sWUFBWSxHQUFHLGNBQWMsSUFBSSxNQUFN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LEVBQUUsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDMUU7UUFFRCxJQUFJLG1CQUFtQixHQUFhLEVBQUUsQ0FBQztRQUN2QyxLQUFLLE1BQU0sWUFBWSxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQTZCO1lBQ3BFLEVBQUUsRUFBRTtZQUNQLElBQUksWUFBWSxDQUFDLElBQUksSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLGVBQWUsRUFBRTtnQkFDOUQsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLGFBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7b0JBQ2xELE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztpQkFDekU7Z0JBQ0QsbUJBQW1CLEdBQUcsYUFBeUIsQ0FBQztnQkFDaEQsTUFBTTthQUNQO1NBQ0Y7UUFFRCxPQUFPO1lBQ0wsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUMsRUFBRSxJQUFJLEVBQUUsRUFBQyxNQUFNLEVBQUM7U0FDekUsQ0FBQztJQUNKLENBQUM7SUFsS0Qsc0NBa0tDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgVGhlIEJhemVsIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuXG4vKipcbiAqIFRoZSBjb25maWd1cmF0aW9uIGJsb2NrIHByb3ZpZGVkIGJ5IHRoZSB0c2NvbmZpZyBcImJhemVsT3B0aW9uc1wiLlxuICogTm90ZSB0aGF0IGFsbCBwYXRocyBoZXJlIGFyZSByZWxhdGl2ZSB0byB0aGUgcm9vdERpciwgbm90IGFic29sdXRlIG5vclxuICogcmVsYXRpdmUgdG8gdGhlIGxvY2F0aW9uIGNvbnRhaW5pbmcgdGhlIHRzY29uZmlnIGZpbGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmF6ZWxPcHRpb25zIHtcbiAgLyoqIE5hbWUgb2YgdGhlIGJhemVsIHdvcmtzcGFjZSB3aGVyZSB3ZSBhcmUgYnVpbGRpbmcuICovXG4gIHdvcmtzcGFjZU5hbWU6IHN0cmluZztcblxuICAvKiogVGhlIGZ1bGwgYmF6ZWwgdGFyZ2V0IHRoYXQgaXMgYmVpbmcgYnVpbHQsIGUuZy4gLy9teS9wa2c6bGlicmFyeS4gKi9cbiAgdGFyZ2V0OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBiYXplbCBwYWNrYWdlLCBlZyBteS9wa2cgKi9cbiAgcGFja2FnZTogc3RyaW5nO1xuXG4gIC8qKiBJZiB0cnVlLCBjb252ZXJ0IHJlcXVpcmUoKXMgaW50byBnb29nLm1vZHVsZSgpLiAqL1xuICBnb29nbW9kdWxlOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCBlbWl0IGRldm1vZGUgb3V0cHV0IGludG8gZmlsZW5hbWUuanMuXG4gICAqIElmIGZhbHNlLCBlbWl0IHByb2Rtb2RlIG91dHB1dCBpbnRvIGZpbGVuYW1lLm1qcy5cbiAgICovXG4gIGVzNU1vZGU6IGJvb2xlYW47XG5cbiAgLyoqIElmIHRydWUsIGNvbnZlcnQgVHlwZVNjcmlwdCBjb2RlIGludG8gYSBDbG9zdXJlLWNvbXBhdGlibGUgdmFyaWFudC4gKi9cbiAgdHNpY2tsZTogYm9vbGVhbjtcblxuICAvKiogSWYgdHJ1ZSwgZ2VuZXJhdGUgZXh0ZXJucyBmcm9tIGRlY2xhcmF0aW9ucyBpbiBkLnRzIGZpbGVzLiAqL1xuICB0c2lja2xlR2VuZXJhdGVFeHRlcm5zOiBib29sZWFuO1xuXG4gIC8qKiBXcml0ZSBnZW5lcmF0ZWQgZXh0ZXJucyB0byB0aGUgZ2l2ZW4gcGF0aC4gKi9cbiAgdHNpY2tsZUV4dGVybnNQYXRoOiBzdHJpbmc7XG5cbiAgLyoqIFBhdGhzIG9mIGRlY2xhcmF0aW9ucyB3aG9zZSB0eXBlcyBtdXN0IG5vdCBhcHBlYXIgaW4gcmVzdWx0IC5kLnRzLiAqL1xuICB0eXBlQmxhY2tMaXN0UGF0aHM6IHN0cmluZ1tdO1xuXG4gIC8qKiBJZiB0cnVlLCBlbWl0IENsb3N1cmUgdHlwZXMgaW4gVHlwZVNjcmlwdC0+SlMgb3V0cHV0LiAqL1xuICB1bnR5cGVkOiBib29sZWFuO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBzb3VyY2VzIHdlJ3JlIGludGVyZXN0ZWQgaW4gKGVtaXR0aW5nIGFuZCB0eXBlIGNoZWNraW5nKS4gKi9cbiAgY29tcGlsYXRpb25UYXJnZXRTcmM6IHN0cmluZ1tdO1xuXG4gIC8qKiBQYXRoIHRvIHdyaXRlIHRoZSBtb2R1bGUgZGVwZW5kZW5jeSBtYW5pZmVzdCB0by4gKi9cbiAgbWFuaWZlc3Q6IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0byBkaXNhYmxlIHN0cmljdCBkZXBzIGNoZWNrLiBJZiB0cnVlIHRoZSBuZXh0IHBhcmFtZXRlciBpc1xuICAgKiBpZ25vcmVkLlxuICAgKi9cbiAgZGlzYWJsZVN0cmljdERlcHM/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBQYXRocyBvZiBkZXBlbmRlbmNpZXMgdGhhdCBhcmUgYWxsb3dlZCBieSBzdHJpY3QgZGVwcywgaS5lLiB0aGF0IG1heSBiZVxuICAgKiBpbXBvcnRlZCBieSB0aGUgc291cmNlIGZpbGVzIGluIGNvbXBpbGF0aW9uVGFyZ2V0U3JjLlxuICAgKi9cbiAgYWxsb3dlZFN0cmljdERlcHM6IHN0cmluZ1tdO1xuXG4gIC8qKiBXcml0ZSBhIHBlcmZvcm1hbmNlIHRyYWNlIHRvIHRoaXMgcGF0aC4gRGlzYWJsZWQgd2hlbiBmYWxzeS4gKi9cbiAgcGVyZlRyYWNlUGF0aD86IHN0cmluZztcblxuICAvKipcbiAgICogQW4gYWRkaXRpb25hbCBwcmVsdWRlIHRvIGluc2VydCBhZnRlciB0aGUgYGdvb2cubW9kdWxlYCBjYWxsLFxuICAgKiBlLmcuIHdpdGggYWRkaXRpb25hbCBpbXBvcnRzIG9yIHJlcXVpcmVzLlxuICAgKi9cbiAgcHJlbHVkZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBOYW1lIG9mIHRoZSBjdXJyZW50IGxvY2FsZSBpZiBwcm9jZXNzaW5nIGEgbG9jYWxlLXNwZWNpZmljIGZpbGUuXG4gICAqL1xuICBsb2NhbGU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBlcnJvcnMgdGhpcyBjb21waWxhdGlvbiBpcyBleHBlY3RlZCB0byBnZW5lcmF0ZSwgaW4gdGhlIGZvcm1cbiAgICogXCJUUzEyMzQ6cmVnZXhwXCIuIElmIGVtcHR5LCBjb21waWxhdGlvbiBpcyBleHBlY3RlZCB0byBzdWNjZWVkLlxuICAgKi9cbiAgZXhwZWN0ZWREaWFnbm9zdGljczogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIFRvIHN1cHBvcnQgbm9kZV9tb2R1bGUgcmVzb2x1dGlvbiwgYWxsb3cgVHlwZVNjcmlwdCB0byBtYWtlIGFyYml0cmFyeVxuICAgKiBmaWxlIHN5c3RlbSBhY2Nlc3MgdG8gcGF0aHMgdW5kZXIgdGhpcyBwcmVmaXguXG4gICAqL1xuICBub2RlTW9kdWxlc1ByZWZpeDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIHJlZ2V4ZXMgb24gZmlsZSBwYXRocyBmb3Igd2hpY2ggd2Ugc3VwcHJlc3MgdHNpY2tsZSdzIHdhcm5pbmdzLlxuICAgKi9cbiAgaWdub3JlV2FybmluZ1BhdGhzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogV2hldGhlciB0byBhZGQgYWxpYXNlcyB0byB0aGUgLmQudHMgZmlsZXMgdG8gYWRkIHRoZSBleHBvcnRzIHRvIHRoZVxuICAgKiDgsqBf4LKgLmNsdXR6IG5hbWVzcGFjZS5cbiAgICovXG4gIGFkZER0c0NsdXR6QWxpYXNlczogdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciB0byB0eXBlIGNoZWNrIGlucHV0cyB0aGF0IGFyZW4ndCBzcmNzLiAgRGlmZmVycyBmcm9tXG4gICAqIC0tc2tpcExpYkNoZWNrLCB3aGljaCBza2lwcyBhbGwgLmQudHMgZmlsZXMsIGV2ZW4gdGhvc2Ugd2hpY2ggYXJlXG4gICAqIHNyY3MuXG4gICAqL1xuICB0eXBlQ2hlY2tEZXBlbmRlbmNpZXM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBtYXhpbXVtIGNhY2hlIHNpemUgZm9yIGJhemVsIG91dHB1dHMsIGluIG1lZ2FieXRlcy5cbiAgICovXG4gIG1heENhY2hlU2l6ZU1iPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdXBwcmVzcyB3YXJuaW5ncyBhYm91dCB0c2NvbmZpZy5qc29uIHByb3BlcnRpZXMgdGhhdCBhcmUgb3ZlcnJpZGRlbi5cbiAgICogQ3VycmVudGx5IHVudXNlZCwgcmVtYWlucyBoZXJlIGZvciBiYWNrd2FyZHMgY29tcGF0IGZvciB1c2VycyB3aG8gc2V0IGl0LlxuICAgKi9cbiAgc3VwcHJlc3NUc2NvbmZpZ092ZXJyaWRlV2FybmluZ3M6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEFuIGV4cGxpY2l0IG5hbWUgZm9yIHRoaXMgbW9kdWxlLCBnaXZlbiBieSB0aGUgbW9kdWxlX25hbWUgYXR0cmlidXRlIG9uIGFcbiAgICogdHNfbGlicmFyeS5cbiAgICovXG4gIG1vZHVsZU5hbWU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEFuIGV4cGxpY2l0IGVudHJ5IHBvaW50IGZvciB0aGlzIG1vZHVsZSwgZ2l2ZW4gYnkgdGhlIG1vZHVsZV9yb290IGF0dHJpYnV0ZVxuICAgKiBvbiBhIHRzX2xpYnJhcnkuXG4gICAqL1xuICBtb2R1bGVSb290Pzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCBpbmRpY2F0ZXMgdGhhdCB0aGlzIGpvYiBpcyB0cmFuc3BpbGluZyBKUyBzb3VyY2VzLiBJZiB0cnVlLCBvbmx5XG4gICAqIG9uZSBmaWxlIGNhbiBhcHBlYXIgaW4gY29tcGlsYXRpb25UYXJnZXRTcmMsIGFuZCBlaXRoZXJcbiAgICogdHJhbnNwaWxlZEpzT3V0cHV0RmlsZU5hbWUgb3IgdGhlIHRyYW5zcGlsZWRKcypEaXJlY3Rvcnkgb3B0aW9ucyBtdXN0IGJlXG4gICAqIHNldC5cbiAgICovXG4gIGlzSnNUcmFuc3BpbGF0aW9uPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIHBhdGggd2hlcmUgdGhlIGZpbGUgY29udGFpbmluZyB0aGUgSlMgdHJhbnNwaWxlZCBvdXRwdXQgc2hvdWxkIGJlXG4gICAqIHdyaXR0ZW4uIElnbm9yZWQgaWYgaXNKc1RyYW5zcGlsYXRpb24gaXMgZmFsc2UuIHRyYW5zcGlsZWRKc091dHB1dEZpbGVOYW1lXG4gICAqXG4gICAqL1xuICB0cmFuc3BpbGVkSnNPdXRwdXRGaWxlTmFtZT86IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIHBhdGggd2hlcmUgdHJhbnNwaWxlZCBKUyBvdXRwdXQgc2hvdWxkIGJlIHdyaXR0ZW4uIElnbm9yZWQgaWZcbiAgICogaXNKc1RyYW5zcGlsYXRpb24gaXMgZmFsc2UuIE11c3Qgbm90IGJlIHNldCB0b2dldGhlciB3aXRoXG4gICAqIHRyYW5zcGlsZWRKc091dHB1dEZpbGVOYW1lLlxuICAgKi9cbiAgdHJhbnNwaWxlZEpzSW5wdXREaXJlY3Rvcnk/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBwYXRoIHdoZXJlIHRyYW5zcGlsZWQgSlMgb3V0cHV0IHNob3VsZCBiZSB3cml0dGVuLiBJZ25vcmVkIGlmXG4gICAqIGlzSnNUcmFuc3BpbGF0aW9uIGlzIGZhbHNlLiBNdXN0IG5vdCBiZSBzZXQgdG9nZXRoZXIgd2l0aFxuICAgKiB0cmFuc3BpbGVkSnNPdXRwdXRGaWxlTmFtZS5cbiAgICovXG4gIHRyYW5zcGlsZWRKc091dHB1dERpcmVjdG9yeT86IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgdXNlciBwcm92aWRlZCBhbiBpbXBsZW1lbnRhdGlvbiBzaGltIGZvciAuZC50cyBmaWxlcyBpbiB0aGVcbiAgICogY29tcGlsYXRpb24gdW5pdC5cbiAgICovXG4gIGhhc0ltcGxlbWVudGF0aW9uPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogRW5hYmxlIHRoZSBBbmd1bGFyIG5ndHNjIHBsdWdpbi5cbiAgICovXG4gIGNvbXBpbGVBbmd1bGFyVGVtcGxhdGVzPzogYm9vbGVhbjtcblxuXG4gIC8qKlxuICAgKiBPdmVycmlkZSBmb3IgRUNNQVNjcmlwdCB0YXJnZXQgbGFuZ3VhZ2UgbGV2ZWwgdG8gdXNlIGZvciBkZXZtb2RlLlxuICAgKlxuICAgKiBUaGlzIHNldHRpbmcgY2FuIGJlIHNldCBpbiBhIHVzZXIncyB0c2NvbmZpZyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdFxuICAgKiBkZXZtb2RlIHRhcmdldC5cbiAgICpcbiAgICogRVhQRVJJTUVOVEFMOiBUaGlzIHNldHRpbmcgaXMgZXhwZXJpbWVudGFsIGFuZCBtYXkgYmUgcmVtb3ZlZCBpbiB0aGVcbiAgICogZnV0dXJlLlxuICAgKi9cbiAgZGV2bW9kZVRhcmdldE92ZXJyaWRlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlZFRzQ29uZmlnIHtcbiAgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zO1xuICBiYXplbE9wdHM6IEJhemVsT3B0aW9ucztcbiAgYW5ndWxhckNvbXBpbGVyT3B0aW9ucz86IHtbazogc3RyaW5nXTogdW5rbm93bn07XG4gIGZpbGVzOiBzdHJpbmdbXTtcbiAgZGlzYWJsZWRUc2V0c2VSdWxlczogc3RyaW5nW107XG4gIGNvbmZpZzoge307XG59XG5cbi8vIFRPRE8oY2FsZWJlZ2cpOiBVcHN0cmVhbT9cbmludGVyZmFjZSBQbHVnaW5JbXBvcnRXaXRoQ29uZmlnIGV4dGVuZHMgdHMuUGx1Z2luSW1wb3J0IHtcbiAgW29wdGlvbk5hbWU6IHN0cmluZ106IHN0cmluZ3x7fTtcbn1cblxuLyoqXG4gKiBUaGUgc2FtZSBhcyBOb2RlJ3MgcGF0aC5yZXNvbHZlLCBob3dldmVyIGl0IHJldHVybnMgYSBwYXRoIHdpdGggZm9yd2FyZFxuICogc2xhc2hlcyByYXRoZXIgdGhhbiBqb2luaW5nIHRoZSByZXNvbHZlZCBwYXRoIHdpdGggdGhlIHBsYXRmb3JtJ3MgcGF0aFxuICogc2VwYXJhdG9yLlxuICogTm90ZSB0aGF0IGV2ZW4gcGF0aC5wb3NpeC5yZXNvbHZlKCcuJykgcmV0dXJucyBDOlxcVXNlcnNcXC4uLiB3aXRoIGJhY2tzbGFzaGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZU5vcm1hbGl6ZWRQYXRoKC4uLnNlZ21lbnRzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLnJlc29sdmUoLi4uc2VnbWVudHMpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbn1cblxuLyoqXG4gKiBMb2FkIGEgdHNjb25maWcuanNvbiBhbmQgY29udmVydCBhbGwgcmVmZXJlbmNlZCBwYXRocyAoaW5jbHVkaW5nXG4gKiBiYXplbE9wdGlvbnMpIHRvIGFic29sdXRlIHBhdGhzLlxuICogUGF0aHMgc2VlbiBieSBUeXBlU2NyaXB0IHNob3VsZCBiZSBhYnNvbHV0ZSwgdG8gbWF0Y2ggYmVoYXZpb3JcbiAqIG9mIHRoZSB0c2MgTW9kdWxlUmVzb2x1dGlvbiBpbXBsZW1lbnRhdGlvbi5cbiAqIEBwYXJhbSB0c2NvbmZpZ0ZpbGUgcGF0aCB0byB0c2NvbmZpZywgcmVsYXRpdmUgdG8gcHJvY2Vzcy5jd2QoKSBvciBhYnNvbHV0ZVxuICogQHJldHVybiBjb25maWd1cmF0aW9uIHBhcnNlZCBmcm9tIHRoZSBmaWxlLCBvciBlcnJvciBkaWFnbm9zdGljc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUc2NvbmZpZyhcbiAgICB0c2NvbmZpZ0ZpbGU6IHN0cmluZywgaG9zdDogdHMuUGFyc2VDb25maWdIb3N0ID0gdHMuc3lzKTpcbiAgICBbUGFyc2VkVHNDb25maWd8bnVsbCwgdHMuRGlhZ25vc3RpY1tdfG51bGwsIHt0YXJnZXQ6IHN0cmluZ31dIHtcbiAgLy8gVHlwZVNjcmlwdCBleHBlY3RzIGFuIGFic29sdXRlIHBhdGggZm9yIHRoZSB0c2NvbmZpZy5qc29uIGZpbGVcbiAgdHNjb25maWdGaWxlID0gcmVzb2x2ZU5vcm1hbGl6ZWRQYXRoKHRzY29uZmlnRmlsZSk7XG5cbiAgY29uc3QgaXNVbmRlZmluZWQgPSAodmFsdWU6IGFueSk6IHZhbHVlIGlzIHVuZGVmaW5lZCA9PiB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xuXG4gIC8vIEhhbmRsZSBiYXplbCBzcGVjaWZpYyBvcHRpb25zLCBidXQgbWFrZSBzdXJlIG5vdCB0byBjcmFzaCB3aGVuIHJlYWRpbmcgYVxuICAvLyB2YW5pbGxhIHRzY29uZmlnLmpzb24uXG5cbiAgY29uc3QgcmVhZEV4dGVuZGVkQ29uZmlnRmlsZSA9XG4gICAgKGNvbmZpZ0ZpbGU6IHN0cmluZywgZXhpc3RpbmdDb25maWc/OiBhbnkpOiB7Y29uZmlnPzogYW55LCBlcnJvcj86IHRzLkRpYWdub3N0aWN9ID0+IHtcbiAgICAgIGNvbnN0IHtjb25maWcsIGVycm9yfSA9IHRzLnJlYWRDb25maWdGaWxlKGNvbmZpZ0ZpbGUsIGhvc3QucmVhZEZpbGUpO1xuXG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHtlcnJvcn07XG4gICAgICB9XG5cbiAgICAgIC8vIEFsbG93IEJhemVsIHVzZXJzIHRvIGNvbnRyb2wgc29tZSBvZiB0aGUgYmF6ZWwgb3B0aW9ucy5cbiAgICAgIC8vIFNpbmNlIFR5cGVTY3JpcHQncyBcImV4dGVuZHNcIiBtZWNoYW5pc20gYXBwbGllcyBvbmx5IHRvIFwiY29tcGlsZXJPcHRpb25zXCJcbiAgICAgIC8vIHdlIGhhdmUgdG8gcmVwZWF0IHNvbWUgb2YgdGhlaXIgbG9naWMgdG8gZ2V0IHRoZSB1c2VyJ3MgYmF6ZWxPcHRpb25zLlxuICAgICAgY29uc3QgbWVyZ2VkQ29uZmlnID0gZXhpc3RpbmdDb25maWcgfHwgY29uZmlnO1xuXG4gICAgICBpZiAoZXhpc3RpbmdDb25maWcpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdCYXplbE9wdHM6IEJhemVsT3B0aW9ucyA9IGV4aXN0aW5nQ29uZmlnLmJhemVsT3B0aW9ucyB8fCB7fTtcbiAgICAgICAgY29uc3QgbmV3QmF6ZWxCYXplbE9wdHM6IEJhemVsT3B0aW9ucyA9IGNvbmZpZy5iYXplbE9wdGlvbnMgfHwge307XG5cbiAgICAgICAgbWVyZ2VkQ29uZmlnLmJhemVsT3B0aW9ucyA9IHtcbiAgICAgICAgICAuLi5leGlzdGluZ0JhemVsT3B0cyxcblxuICAgICAgICAgIGRpc2FibGVTdHJpY3REZXBzOiBpc1VuZGVmaW5lZChleGlzdGluZ0JhemVsT3B0cy5kaXNhYmxlU3RyaWN0RGVwcylcbiAgICAgICAgICAgID8gbmV3QmF6ZWxCYXplbE9wdHMuZGlzYWJsZVN0cmljdERlcHNcbiAgICAgICAgICAgIDogZXhpc3RpbmdCYXplbE9wdHMuZGlzYWJsZVN0cmljdERlcHMsXG5cbiAgICAgICAgICBzdXBwcmVzc1RzY29uZmlnT3ZlcnJpZGVXYXJuaW5nczogaXNVbmRlZmluZWQoZXhpc3RpbmdCYXplbE9wdHMuc3VwcHJlc3NUc2NvbmZpZ092ZXJyaWRlV2FybmluZ3MpXG4gICAgICAgICAgICA/IG5ld0JhemVsQmF6ZWxPcHRzLnN1cHByZXNzVHNjb25maWdPdmVycmlkZVdhcm5pbmdzXG4gICAgICAgICAgICA6IGV4aXN0aW5nQmF6ZWxPcHRzLnN1cHByZXNzVHNjb25maWdPdmVycmlkZVdhcm5pbmdzLFxuXG4gICAgICAgICAgdHNpY2tsZTogaXNVbmRlZmluZWQoZXhpc3RpbmdCYXplbE9wdHMudHNpY2tsZSlcbiAgICAgICAgICAgID8gbmV3QmF6ZWxCYXplbE9wdHMudHNpY2tsZVxuICAgICAgICAgICAgOiBleGlzdGluZ0JhemVsT3B0cy50c2lja2xlLFxuXG4gICAgICAgICAgZ29vZ21vZHVsZTogaXNVbmRlZmluZWQoZXhpc3RpbmdCYXplbE9wdHMuZ29vZ21vZHVsZSlcbiAgICAgICAgICAgID8gbmV3QmF6ZWxCYXplbE9wdHMuZ29vZ21vZHVsZVxuICAgICAgICAgICAgOiBleGlzdGluZ0JhemVsT3B0cy5nb29nbW9kdWxlLFxuXG4gICAgICAgICAgZGV2bW9kZVRhcmdldE92ZXJyaWRlOiBpc1VuZGVmaW5lZChleGlzdGluZ0JhemVsT3B0cy5kZXZtb2RlVGFyZ2V0T3ZlcnJpZGUpXG4gICAgICAgICAgICA/IG5ld0JhemVsQmF6ZWxPcHRzLmRldm1vZGVUYXJnZXRPdmVycmlkZVxuICAgICAgICAgICAgOiBleGlzdGluZ0JhemVsT3B0cy5kZXZtb2RlVGFyZ2V0T3ZlcnJpZGUsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5leHRlbmRzKSB7XG4gICAgICAgIGxldCBleHRlbmRlZENvbmZpZ1BhdGggPSByZXNvbHZlTm9ybWFsaXplZFBhdGgocGF0aC5kaXJuYW1lKGNvbmZpZ0ZpbGUpLCBjb25maWcuZXh0ZW5kcyk7XG4gICAgICAgIGlmICghZXh0ZW5kZWRDb25maWdQYXRoLmVuZHNXaXRoKCcuanNvbicpKSBleHRlbmRlZENvbmZpZ1BhdGggKz0gJy5qc29uJztcblxuICAgICAgICByZXR1cm4gcmVhZEV4dGVuZGVkQ29uZmlnRmlsZShleHRlbmRlZENvbmZpZ1BhdGgsIG1lcmdlZENvbmZpZyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7Y29uZmlnOiBtZXJnZWRDb25maWd9O1xuICAgIH07XG5cbiAgY29uc3Qge2NvbmZpZywgZXJyb3J9ID0gcmVhZEV4dGVuZGVkQ29uZmlnRmlsZSh0c2NvbmZpZ0ZpbGUpO1xuICBpZiAoZXJyb3IpIHtcbiAgICAvLyB0YXJnZXQgaXMgaW4gdGhlIGNvbmZpZyBmaWxlIHdlIGZhaWxlZCB0byBsb2FkLi4uXG4gICAgcmV0dXJuIFtudWxsLCBbZXJyb3JdLCB7dGFyZ2V0OiAnJ31dO1xuICB9XG5cbiAgY29uc3Qge29wdGlvbnMsIGVycm9ycywgZmlsZU5hbWVzfSA9XG4gICAgdHMucGFyc2VKc29uQ29uZmlnRmlsZUNvbnRlbnQoY29uZmlnLCBob3N0LCBwYXRoLmRpcm5hbWUodHNjb25maWdGaWxlKSk7XG5cbiAgLy8gSGFuZGxlIGJhemVsIHNwZWNpZmljIG9wdGlvbnMsIGJ1dCBtYWtlIHN1cmUgbm90IHRvIGNyYXNoIHdoZW4gcmVhZGluZyBhXG4gIC8vIHZhbmlsbGEgdHNjb25maWcuanNvbi5cbiAgY29uc3QgYmF6ZWxPcHRzOiBCYXplbE9wdGlvbnMgPSBjb25maWcuYmF6ZWxPcHRpb25zIHx8IHt9O1xuICBjb25zdCB0YXJnZXQgPSBiYXplbE9wdHMudGFyZ2V0O1xuICBiYXplbE9wdHMuYWxsb3dlZFN0cmljdERlcHMgPSBiYXplbE9wdHMuYWxsb3dlZFN0cmljdERlcHMgfHwgW107XG4gIGJhemVsT3B0cy50eXBlQmxhY2tMaXN0UGF0aHMgPSBiYXplbE9wdHMudHlwZUJsYWNrTGlzdFBhdGhzIHx8IFtdO1xuICBiYXplbE9wdHMuY29tcGlsYXRpb25UYXJnZXRTcmMgPSBiYXplbE9wdHMuY29tcGlsYXRpb25UYXJnZXRTcmMgfHwgW107XG5cblxuICBpZiAoZXJyb3JzICYmIGVycm9ycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gW251bGwsIGVycm9ycywge3RhcmdldH1dO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgdGhlIGRldm1vZGUgdGFyZ2V0IGlmIGRldm1vZGVUYXJnZXRPdmVycmlkZSBpcyBzZXRcbiAgaWYgKGJhemVsT3B0cy5lczVNb2RlICYmIGJhemVsT3B0cy5kZXZtb2RlVGFyZ2V0T3ZlcnJpZGUpIHtcbiAgICBzd2l0Y2ggKGJhemVsT3B0cy5kZXZtb2RlVGFyZ2V0T3ZlcnJpZGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgY2FzZSAnZXMzJzpcbiAgICAgICAgb3B0aW9ucy50YXJnZXQgPSB0cy5TY3JpcHRUYXJnZXQuRVMzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2VzNSc6XG4gICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gdHMuU2NyaXB0VGFyZ2V0LkVTNTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdlczIwMTUnOlxuICAgICAgICBvcHRpb25zLnRhcmdldCA9IHRzLlNjcmlwdFRhcmdldC5FUzIwMTU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZXMyMDE2JzpcbiAgICAgICAgb3B0aW9ucy50YXJnZXQgPSB0cy5TY3JpcHRUYXJnZXQuRVMyMDE2O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2VzMjAxNyc6XG4gICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gdHMuU2NyaXB0VGFyZ2V0LkVTMjAxNztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdlczIwMTgnOlxuICAgICAgICBvcHRpb25zLnRhcmdldCA9IHRzLlNjcmlwdFRhcmdldC5FUzIwMTg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZXNuZXh0JzpcbiAgICAgICAgb3B0aW9ucy50YXJnZXQgPSB0cy5TY3JpcHRUYXJnZXQuRVNOZXh0O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAnV0FSTklORzogeW91ciB0c2NvbmZpZy5qc29uIGZpbGUgc3BlY2lmaWVzIGFuIGludmFsaWQgYmF6ZWxPcHRpb25zLmRldm1vZGVUYXJnZXRPdmVycmlkZSB2YWx1ZSBvZjogXFwnJHtiYXplbE9wdHMuZGV2bW9kZVRhcmdldE92ZXJyaWRlXFwnJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gU29ydCByb290RGlycyB3aXRoIGxvbmdlc3QgaW5jbHVkZSBkaXJlY3RvcmllcyBmaXJzdC5cbiAgLy8gV2hlbiBjYW5vbmljYWxpemluZyBwYXRocywgd2UgYWx3YXlzIHdhbnQgdG8gc3RyaXBcbiAgLy8gYHdvcmtzcGFjZS9iYXplbC1iaW4vZmlsZWAgdG8ganVzdCBgZmlsZWAsIG5vdCB0byBgYmF6ZWwtYmluL2ZpbGVgLlxuICBpZiAob3B0aW9ucy5yb290RGlycykgb3B0aW9ucy5yb290RGlycy5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcblxuICAvLyBJZiB0aGUgdXNlciByZXF1ZXN0ZWQgZ29vZy5tb2R1bGUsIHdlIG5lZWQgdG8gcHJvZHVjZSB0aGF0IG91dHB1dCBldmVuIGlmXG4gIC8vIHRoZSBnZW5lcmF0ZWQgdHNjb25maWcgaW5kaWNhdGVzIG90aGVyd2lzZS5cbiAgaWYgKGJhemVsT3B0cy5nb29nbW9kdWxlKSBvcHRpb25zLm1vZHVsZSA9IHRzLk1vZHVsZUtpbmQuQ29tbW9uSlM7XG5cbiAgLy8gVHlwZVNjcmlwdCdzIHBhcnNlSnNvbkNvbmZpZ0ZpbGVDb250ZW50IHJldHVybnMgcGF0aHMgdGhhdCBhcmUgam9pbmVkLCBlZy5cbiAgLy8gL3BhdGgvdG8vcHJvamVjdC9iYXplbC1vdXQvYXJjaC9iaW4vcGF0aC90by9wYWNrYWdlLy4uLy4uLy4uLy4uLy4uLy4uL3BhdGhcbiAgLy8gV2Ugbm9ybWFsaXplIHRoZW0gdG8gcmVtb3ZlIHRoZSBpbnRlcm1lZGlhdGUgcGFyZW50IGRpcmVjdG9yaWVzLlxuICAvLyBUaGlzIGltcHJvdmVzIGVycm9yIG1lc3NhZ2VzIGFuZCBhbHNvIG1hdGNoZXMgbG9naWMgaW4gdHNjX3dyYXBwZWQgd2hlcmUgd2VcbiAgLy8gZXhwZWN0IG5vcm1hbGl6ZWQgcGF0aHMuXG4gIGNvbnN0IGZpbGVzID0gZmlsZU5hbWVzLm1hcChmID0+IHBhdGgucG9zaXgubm9ybWFsaXplKGYpKTtcblxuICAvLyBUaGUgYmF6ZWxPcHRzIHBhdGhzIGluIHRoZSB0c2NvbmZpZyBhcmUgcmVsYXRpdmUgdG9cbiAgLy8gb3B0aW9ucy5yb290RGlyICh0aGUgd29ya3NwYWNlIHJvb3QpIGFuZCBhcmVuJ3QgdHJhbnNmb3JtZWQgYnlcbiAgLy8gcGFyc2VKc29uQ29uZmlnRmlsZUNvbnRlbnQgKGJlY2F1c2UgVHlwZVNjcmlwdCBkb2Vzbid0IGtub3dcbiAgLy8gYWJvdXQgdGhlbSkuIFRyYW5zZm9ybSB0aGVtIHRvIGFsc28gYmUgYWJzb2x1dGUgaGVyZS5cbiAgYmF6ZWxPcHRzLmNvbXBpbGF0aW9uVGFyZ2V0U3JjID0gYmF6ZWxPcHRzLmNvbXBpbGF0aW9uVGFyZ2V0U3JjLm1hcChcbiAgICAgIGYgPT4gcmVzb2x2ZU5vcm1hbGl6ZWRQYXRoKG9wdGlvbnMucm9vdERpciEsIGYpKTtcbiAgYmF6ZWxPcHRzLmFsbG93ZWRTdHJpY3REZXBzID0gYmF6ZWxPcHRzLmFsbG93ZWRTdHJpY3REZXBzLm1hcChcbiAgICAgIGYgPT4gcmVzb2x2ZU5vcm1hbGl6ZWRQYXRoKG9wdGlvbnMucm9vdERpciEsIGYpKTtcbiAgYmF6ZWxPcHRzLnR5cGVCbGFja0xpc3RQYXRocyA9IGJhemVsT3B0cy50eXBlQmxhY2tMaXN0UGF0aHMubWFwKFxuICAgICAgZiA9PiByZXNvbHZlTm9ybWFsaXplZFBhdGgob3B0aW9ucy5yb290RGlyISwgZikpO1xuICBpZiAoYmF6ZWxPcHRzLm5vZGVNb2R1bGVzUHJlZml4KSB7XG4gICAgYmF6ZWxPcHRzLm5vZGVNb2R1bGVzUHJlZml4ID1cbiAgICAgICAgcmVzb2x2ZU5vcm1hbGl6ZWRQYXRoKG9wdGlvbnMucm9vdERpciEsIGJhemVsT3B0cy5ub2RlTW9kdWxlc1ByZWZpeCk7XG4gIH1cblxuICBsZXQgZGlzYWJsZWRUc2V0c2VSdWxlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBwbHVnaW5Db25maWcgb2Ygb3B0aW9uc1sncGx1Z2lucyddIGFzIFBsdWdpbkltcG9ydFdpdGhDb25maWdbXSB8fFxuICAgICAgIFtdKSB7XG4gICAgaWYgKHBsdWdpbkNvbmZpZy5uYW1lICYmIHBsdWdpbkNvbmZpZy5uYW1lID09PSAnQGJhemVsL3RzZXRzZScpIHtcbiAgICAgIGNvbnN0IGRpc2FibGVkUnVsZXMgPSBwbHVnaW5Db25maWdbJ2Rpc2FibGVkUnVsZXMnXTtcbiAgICAgIGlmIChkaXNhYmxlZFJ1bGVzICYmICFBcnJheS5pc0FycmF5KGRpc2FibGVkUnVsZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGlzYWJsZWQgdHNldHNlIHJ1bGVzIG11c3QgYmUgYW4gYXJyYXkgb2YgcnVsZSBuYW1lcycpO1xuICAgICAgfVxuICAgICAgZGlzYWJsZWRUc2V0c2VSdWxlcyA9IGRpc2FibGVkUnVsZXMgYXMgc3RyaW5nW107XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIHtvcHRpb25zLCBiYXplbE9wdHMsIGZpbGVzLCBjb25maWcsIGRpc2FibGVkVHNldHNlUnVsZXN9LCBudWxsLCB7dGFyZ2V0fVxuICBdO1xufVxuIl19