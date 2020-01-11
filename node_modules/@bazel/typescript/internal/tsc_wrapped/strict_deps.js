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
    /** The TypeScript diagnostic code for "Cannot find module ...". */
    exports.TS_ERR_CANNOT_FIND_MODULE = 2307;
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
    class Plugin {
        constructor(program, config) {
            this.program = program;
            this.config = config;
            this.name = 'strictDeps';
        }
        getDiagnostics(sourceFile) {
            return checkModuleDeps(sourceFile, this.program.getTypeChecker(), this.config.allowedStrictDeps, this.config.rootDir);
        }
    }
    exports.Plugin = Plugin;
    // Exported for testing
    function checkModuleDeps(sf, tc, allowedDeps, rootDir) {
        function stripExt(fn) {
            return fn.replace(/(\.d)?\.tsx?$/, '');
        }
        const allowedMap = {};
        for (const d of allowedDeps)
            allowedMap[stripExt(d)] = true;
        const result = [];
        for (const stmt of sf.statements) {
            if (stmt.kind !== ts.SyntaxKind.ImportDeclaration &&
                stmt.kind !== ts.SyntaxKind.ExportDeclaration) {
                continue;
            }
            const id = stmt;
            const modSpec = id.moduleSpecifier;
            if (!modSpec)
                continue; // E.g. a bare "export {x};"
            const sym = tc.getSymbolAtLocation(modSpec);
            if (!sym || !sym.declarations || sym.declarations.length < 1) {
                continue;
            }
            // Module imports can only have one declaration location.
            const declFileName = sym.declarations[0].getSourceFile().fileName;
            if (allowedMap[stripExt(declFileName)])
                continue;
            const importName = path.posix.relative(rootDir, declFileName);
            result.push({
                file: sf,
                start: modSpec.getStart(),
                length: modSpec.getEnd() - modSpec.getStart(),
                messageText: `transitive dependency on ${importName} not allowed. ` +
                    `Please add the BUILD target to your rule's deps.`,
                category: ts.DiagnosticCategory.Error,
                // semantics are close enough, needs taze.
                code: exports.TS_ERR_CANNOT_FIND_MODULE,
            });
        }
        return result;
    }
    exports.checkModuleDeps = checkModuleDeps;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaWN0X2RlcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL3N0cmljdF9kZXBzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7Ozs7Ozs7Ozs7O0lBRUgsNkJBQTZCO0lBQzdCLGlDQUFpQztJQVdqQyxtRUFBbUU7SUFDdEQsUUFBQSx5QkFBeUIsR0FBRyxJQUFJLENBQUM7SUFFOUM7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxNQUFhLE1BQU07UUFDakIsWUFDcUIsT0FBbUIsRUFDbkIsTUFBOEI7WUFEOUIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtZQUNuQixXQUFNLEdBQU4sTUFBTSxDQUF3QjtZQUUxQyxTQUFJLEdBQUcsWUFBWSxDQUFDO1FBRnlCLENBQUM7UUFJdkQsY0FBYyxDQUFDLFVBQXlCO1lBQ3RDLE9BQU8sZUFBZSxDQUNsQixVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFDekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFELENBQUM7S0FDRjtJQVpELHdCQVlDO0lBRUQsdUJBQXVCO0lBQ3ZCLFNBQWdCLGVBQWUsQ0FDM0IsRUFBaUIsRUFBRSxFQUFrQixFQUFFLFdBQXFCLEVBQzVELE9BQWU7UUFDakIsU0FBUyxRQUFRLENBQUMsRUFBVTtZQUMxQixPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBa0MsRUFBRSxDQUFDO1FBQ3JELEtBQUssTUFBTSxDQUFDLElBQUksV0FBVztZQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7UUFFNUQsTUFBTSxNQUFNLEdBQW9CLEVBQUUsQ0FBQztRQUNuQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEVBQUUsQ0FBQyxVQUFVLEVBQUU7WUFDaEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCO2dCQUM3QyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ2pELFNBQVM7YUFDVjtZQUNELE1BQU0sRUFBRSxHQUFHLElBQW1ELENBQUM7WUFDL0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQztZQUNuQyxJQUFJLENBQUMsT0FBTztnQkFBRSxTQUFTLENBQUUsNEJBQTRCO1lBRXJELE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzVELFNBQVM7YUFDVjtZQUNELHlEQUF5RDtZQUN6RCxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQztZQUNsRSxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQUUsU0FBUztZQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDVixJQUFJLEVBQUUsRUFBRTtnQkFDUixLQUFLLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRTtnQkFDekIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFO2dCQUM3QyxXQUFXLEVBQUUsNEJBQTRCLFVBQVUsZ0JBQWdCO29CQUMvRCxrREFBa0Q7Z0JBQ3RELFFBQVEsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSztnQkFDckMsMENBQTBDO2dCQUMxQyxJQUFJLEVBQUUsaUNBQXlCO2FBQ2hDLENBQUMsQ0FBQztTQUNKO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQXZDRCwwQ0F1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBUaGUgQmF6ZWwgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICpcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQgKiBhcyBwZXJmVHJhY2UgZnJvbSAnLi9wZXJmX3RyYWNlJztcbmltcG9ydCAqIGFzIHBsdWdpbkFwaSBmcm9tICcuL3BsdWdpbl9hcGknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0cmljdERlcHNQbHVnaW5Db25maWcge1xuICBjb21waWxhdGlvblRhcmdldFNyYzogc3RyaW5nW107XG4gIGFsbG93ZWRTdHJpY3REZXBzOiBzdHJpbmdbXTtcbiAgcm9vdERpcjogc3RyaW5nO1xufVxuXG4vKiogVGhlIFR5cGVTY3JpcHQgZGlhZ25vc3RpYyBjb2RlIGZvciBcIkNhbm5vdCBmaW5kIG1vZHVsZSAuLi5cIi4gKi9cbmV4cG9ydCBjb25zdCBUU19FUlJfQ0FOTk9UX0ZJTkRfTU9EVUxFID0gMjMwNztcblxuLyoqXG4gKiBUaGUgc3RyaWN0X2RlcHMgcGx1Z2luIGNoZWNrcyB0aGUgaW1wb3J0cyBvZiB0aGUgY29tcGlsZWQgbW9kdWxlcy5cbiAqXG4gKiBJdCBpbXBsZW1lbnRzIHN0cmljdCBkZXBzLCBpLmUuIGVuZm9yY2VzIHRoYXQgZWFjaCBmaWxlIGluXG4gKiBgY29uZmlnLmNvbXBpbGF0aW9uVGFyZ2V0U3JjYCBvbmx5IGltcG9ydHMgZnJvbSBmaWxlcyBpblxuICogYGNvbmZpZy5hbGxvd2VkU3RyaWN0RGVwc2AuXG4gKlxuICogVGhpcyBpcyB1c2VkIHRvIGltcGxlbWVudCBzdHJpY3QgZGVwZW5kZW5jeSBjaGVja2luZyAtXG4gKiBzb3VyY2UgZmlsZXMgaW4gYSBidWlsZCB0YXJnZXQgbWF5IG9ubHkgaW1wb3J0IHNvdXJjZXMgb2YgdGhlaXIgaW1tZWRpYXRlXG4gKiBkZXBlbmRlbmNpZXMsIGJ1dCBub3Qgc291cmNlcyBvZiB0aGVpciB0cmFuc2l0aXZlIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBzdHJpY3RfZGVwcyBhbHNvIG1ha2VzIHN1cmUgdGhhdCBubyBpbXBvcnRzIGVuZHMgaW4gJy50cycuIFR5cGVTY3JpcHRcbiAqIGFsbG93cyBpbXBvcnRzIGluY2x1ZGluZyB0aGUgZmlsZSBleHRlbnNpb24sIGJ1dCBvdXIgcnVudGltZSBsb2FkaW5nIHN1cHBvcnRcbiAqIGZhaWxzIHdpdGggaXQuXG4gKlxuICogc3RyaWN0X2RlcHMgY3VycmVudGx5IGRvZXMgbm90IGNoZWNrIGFtYmllbnQvZ2xvYmFsIGRlZmluaXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgUGx1Z2luIGltcGxlbWVudHMgcGx1Z2luQXBpLkRpYWdub3N0aWNQbHVnaW4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnOiBTdHJpY3REZXBzUGx1Z2luQ29uZmlnKSB7fVxuXG4gIHJlYWRvbmx5IG5hbWUgPSAnc3RyaWN0RGVwcyc7XG5cbiAgZ2V0RGlhZ25vc3RpY3Moc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkge1xuICAgIHJldHVybiBjaGVja01vZHVsZURlcHMoXG4gICAgICAgIHNvdXJjZUZpbGUsIHRoaXMucHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpLFxuICAgICAgICB0aGlzLmNvbmZpZy5hbGxvd2VkU3RyaWN0RGVwcywgdGhpcy5jb25maWcucm9vdERpcik7XG4gIH1cbn1cblxuLy8gRXhwb3J0ZWQgZm9yIHRlc3RpbmdcbmV4cG9ydCBmdW5jdGlvbiBjaGVja01vZHVsZURlcHMoXG4gICAgc2Y6IHRzLlNvdXJjZUZpbGUsIHRjOiB0cy5UeXBlQ2hlY2tlciwgYWxsb3dlZERlcHM6IHN0cmluZ1tdLFxuICAgIHJvb3REaXI6IHN0cmluZyk6IHRzLkRpYWdub3N0aWNbXSB7XG4gIGZ1bmN0aW9uIHN0cmlwRXh0KGZuOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZm4ucmVwbGFjZSgvKFxcLmQpP1xcLnRzeD8kLywgJycpO1xuICB9XG4gIGNvbnN0IGFsbG93ZWRNYXA6IHtbZmlsZU5hbWU6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIGZvciAoY29uc3QgZCBvZiBhbGxvd2VkRGVwcykgYWxsb3dlZE1hcFtzdHJpcEV4dChkKV0gPSB0cnVlO1xuXG4gIGNvbnN0IHJlc3VsdDogdHMuRGlhZ25vc3RpY1tdID0gW107XG4gIGZvciAoY29uc3Qgc3RtdCBvZiBzZi5zdGF0ZW1lbnRzKSB7XG4gICAgaWYgKHN0bXQua2luZCAhPT0gdHMuU3ludGF4S2luZC5JbXBvcnREZWNsYXJhdGlvbiAmJlxuICAgICAgICBzdG10LmtpbmQgIT09IHRzLlN5bnRheEtpbmQuRXhwb3J0RGVjbGFyYXRpb24pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBpZCA9IHN0bXQgYXMgdHMuSW1wb3J0RGVjbGFyYXRpb24gfCB0cy5FeHBvcnREZWNsYXJhdGlvbjtcbiAgICBjb25zdCBtb2RTcGVjID0gaWQubW9kdWxlU3BlY2lmaWVyO1xuICAgIGlmICghbW9kU3BlYykgY29udGludWU7ICAvLyBFLmcuIGEgYmFyZSBcImV4cG9ydCB7eH07XCJcblxuICAgIGNvbnN0IHN5bSA9IHRjLmdldFN5bWJvbEF0TG9jYXRpb24obW9kU3BlYyk7XG4gICAgaWYgKCFzeW0gfHwgIXN5bS5kZWNsYXJhdGlvbnMgfHwgc3ltLmRlY2xhcmF0aW9ucy5sZW5ndGggPCAxKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gTW9kdWxlIGltcG9ydHMgY2FuIG9ubHkgaGF2ZSBvbmUgZGVjbGFyYXRpb24gbG9jYXRpb24uXG4gICAgY29uc3QgZGVjbEZpbGVOYW1lID0gc3ltLmRlY2xhcmF0aW9uc1swXS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG4gICAgaWYgKGFsbG93ZWRNYXBbc3RyaXBFeHQoZGVjbEZpbGVOYW1lKV0pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGltcG9ydE5hbWUgPSBwYXRoLnBvc2l4LnJlbGF0aXZlKHJvb3REaXIsIGRlY2xGaWxlTmFtZSk7XG4gICAgcmVzdWx0LnB1c2goe1xuICAgICAgZmlsZTogc2YsXG4gICAgICBzdGFydDogbW9kU3BlYy5nZXRTdGFydCgpLFxuICAgICAgbGVuZ3RoOiBtb2RTcGVjLmdldEVuZCgpIC0gbW9kU3BlYy5nZXRTdGFydCgpLFxuICAgICAgbWVzc2FnZVRleHQ6IGB0cmFuc2l0aXZlIGRlcGVuZGVuY3kgb24gJHtpbXBvcnROYW1lfSBub3QgYWxsb3dlZC4gYCArXG4gICAgICAgICAgYFBsZWFzZSBhZGQgdGhlIEJVSUxEIHRhcmdldCB0byB5b3VyIHJ1bGUncyBkZXBzLmAsXG4gICAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgLy8gc2VtYW50aWNzIGFyZSBjbG9zZSBlbm91Z2gsIG5lZWRzIHRhemUuXG4gICAgICBjb2RlOiBUU19FUlJfQ0FOTk9UX0ZJTkRfTU9EVUxFLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=