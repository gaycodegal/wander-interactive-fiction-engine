/**
 * @fileoverview This is a collection of smaller utility functions to operate on
 * a TypeScript AST, used by JSConformance rules and elsewhere.
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /**
     * Triggers increased verbosity in the rules.
     */
    let DEBUG = false;
    /**
     * Turns on or off logging for ConformancePatternRules.
     */
    function setDebug(state) {
        DEBUG = state;
    }
    exports.setDebug = setDebug;
    /**
     * Debug helper.
     */
    function debugLog(msg) {
        if (DEBUG)
            console.log(msg);
    }
    exports.debugLog = debugLog;
    /**
     * Returns `n`'s parents in order.
     */
    function parents(n) {
        const p = [];
        while (n.parent) {
            n = n.parent;
            p.push(n);
        }
        return p;
    }
    exports.parents = parents;
    /**
     * Searches for something satisfying the given test in `n` or its children.
     */
    function findInChildren(n, test) {
        let toExplore = [n];
        let cur;
        while (cur = toExplore.pop()) {
            if (test(cur)) {
                return true;
            }
            // Recurse
            toExplore = toExplore.concat(cur.getChildren());
        }
        return false;
    }
    exports.findInChildren = findInChildren;
    /**
     * Returns true if the pattern-based Rule should look at that node and consider
     * warning there. The goal is to make it easy to exclude on source files,
     * blocks, module declarations, JSDoc, lib.d.ts nodes, that kind of things.
     */
    function shouldExamineNode(n) {
        return !(ts.isBlock(n) || ts.isModuleBlock(n) || ts.isModuleDeclaration(n) ||
            ts.isSourceFile(n) || (n.parent && ts.isTypeNode(n.parent)) ||
            ts.isJSDoc(n) || isInStockLibraries(n));
    }
    exports.shouldExamineNode = shouldExamineNode;
    /**
     * Return whether the given declaration is ambient.
     */
    function isAmbientDeclaration(d) {
        return Boolean(d.modifiers &&
            d.modifiers.some(m => m.kind === ts.SyntaxKind.DeclareKeyword));
    }
    exports.isAmbientDeclaration = isAmbientDeclaration;
    /**
     * Return whether the given Node is (or is in) a library included as default.
     * We currently look for a node_modules/typescript/ prefix, but this could
     * be expanded if needed.
     */
    function isInStockLibraries(n) {
        const sourceFile = ts.isSourceFile(n) ? n : n.getSourceFile();
        if (sourceFile) {
            return sourceFile.fileName.indexOf('node_modules/typescript/') !== -1;
        }
        else {
            // the node is nowhere? Consider it as part of the core libs: we can't do
            // anything with it anyways, and it was likely included as default.
            return true;
        }
    }
    exports.isInStockLibraries = isInStockLibraries;
    /**
     * Turns the given Symbol into its non-aliased version (which could be itself).
     * Returns undefined if given an undefined Symbol (so you can call
     * `dealias(typeChecker.getSymbolAtLocation(node))`).
     */
    function dealias(symbol, tc) {
        if (!symbol) {
            return undefined;
        }
        if (symbol.getFlags() & ts.SymbolFlags.Alias) {
            // Note: something that has only TypeAlias is not acceptable here.
            return dealias(tc.getAliasedSymbol(symbol), tc);
        }
        return symbol;
    }
    exports.dealias = dealias;
    /**
     * Returns whether `n`'s parents are something indicating a type.
     */
    function isPartOfTypeDeclaration(n) {
        return [n, ...parents(n)].some(p => p.kind === ts.SyntaxKind.TypeReference ||
            p.kind === ts.SyntaxKind.TypeLiteral);
    }
    exports.isPartOfTypeDeclaration = isPartOfTypeDeclaration;
    /**
     * Returns whether `n` is under an import statement.
     */
    function isPartOfImportStatement(n) {
        return [n, ...parents(n)].some(p => p.kind === ts.SyntaxKind.ImportDeclaration);
    }
    exports.isPartOfImportStatement = isPartOfImportStatement;
    /**
     * Returns whether `n` is a declaration.
     */
    function isDeclaration(n) {
        return ts.isVariableDeclaration(n) || ts.isClassDeclaration(n) ||
            ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) ||
            ts.isPropertyDeclaration(n) || ts.isVariableDeclarationList(n) ||
            ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) ||
            ts.isEnumDeclaration(n) || ts.isModuleDeclaration(n) ||
            ts.isImportDeclaration(n) || ts.isImportEqualsDeclaration(n) ||
            ts.isExportDeclaration(n) || ts.isMissingDeclaration(n);
    }
    exports.isDeclaration = isDeclaration;
    /** Type guard for expressions that looks like property writes. */
    function isPropertyWriteExpression(node) {
        if (!ts.isBinaryExpression(node)) {
            return false;
        }
        if (node.operatorToken.getText().trim() !== '=') {
            return false;
        }
        if (!ts.isPropertyAccessExpression(node.left) ||
            node.left.expression.getFullText().trim() === '') {
            return false;
        }
        // TODO: Destructuring assigments aren't covered. This would be a potential
        // bypass, but I doubt we'd catch bugs, so fixing it seems low priority
        // overall.
        return true;
    }
    exports.isPropertyWriteExpression = isPropertyWriteExpression;
    /**
     * If verbose, logs the given error that happened while walking n, with a
     * stacktrace.
     */
    function logASTWalkError(verbose, n, e) {
        let nodeText = `[error getting name for ${JSON.stringify(n)}]`;
        try {
            nodeText = '"' + n.getFullText().trim() + '"';
        }
        catch (_a) {
        }
        debugLog(`Walking node ${nodeText} failed with error ${e}.\n` +
            `Stacktrace:\n${e.stack}`);
    }
    exports.logASTWalkError = logASTWalkError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0X3Rvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvdXRpbC9hc3RfdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakM7O09BRUc7SUFDSCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7SUFFbEI7O09BRUc7SUFDSCxTQUFnQixRQUFRLENBQUMsS0FBYztRQUNyQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2hCLENBQUM7SUFGRCw0QkFFQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsUUFBUSxDQUFDLEdBQVc7UUFDbEMsSUFBSSxLQUFLO1lBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRkQsNEJBRUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxDQUFVO1FBQ2hDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUNmLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNYO1FBQ0QsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBUEQsMEJBT0M7SUFFRDs7T0FFRztJQUNILFNBQWdCLGNBQWMsQ0FDMUIsQ0FBVSxFQUFFLElBQTZCO1FBQzNDLElBQUksU0FBUyxHQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsSUFBSSxHQUFzQixDQUFDO1FBQzNCLE9BQU8sR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDYixPQUFPLElBQUksQ0FBQzthQUNi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VUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNwRCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsMkVBQTJFO1FBQzNFLHVFQUF1RTtRQUN2RSxXQUFXO1FBRVgsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBcEJELDhEQW9CQztJQUVEOzs7T0FHRztJQUNILFNBQWdCLGVBQWUsQ0FBQyxPQUFnQixFQUFFLENBQVUsRUFBRSxDQUFRO1FBQ3BFLElBQUksUUFBUSxHQUFHLDJCQUEyQixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFDL0QsSUFBSTtZQUNGLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQztTQUMvQztRQUFDLFdBQU07U0FDUDtRQUNELFFBQVEsQ0FDSixnQkFBZ0IsUUFBUSxzQkFBc0IsQ0FBQyxLQUFLO1lBQ3BELGdCQUFnQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBVEQsMENBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2Ygc21hbGxlciB1dGlsaXR5IGZ1bmN0aW9ucyB0byBvcGVyYXRlIG9uXG4gKiBhIFR5cGVTY3JpcHQgQVNULCB1c2VkIGJ5IEpTQ29uZm9ybWFuY2UgcnVsZXMgYW5kIGVsc2V3aGVyZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqXG4gKiBUcmlnZ2VycyBpbmNyZWFzZWQgdmVyYm9zaXR5IGluIHRoZSBydWxlcy5cbiAqL1xubGV0IERFQlVHID0gZmFsc2U7XG5cbi8qKlxuICogVHVybnMgb24gb3Igb2ZmIGxvZ2dpbmcgZm9yIENvbmZvcm1hbmNlUGF0dGVyblJ1bGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0RGVidWcoc3RhdGU6IGJvb2xlYW4pIHtcbiAgREVCVUcgPSBzdGF0ZTtcbn1cblxuLyoqXG4gKiBEZWJ1ZyBoZWxwZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWJ1Z0xvZyhtc2c6IHN0cmluZykge1xuICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKG1zZyk7XG59XG5cbi8qKlxuICogUmV0dXJucyBgbmAncyBwYXJlbnRzIGluIG9yZGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyZW50cyhuOiB0cy5Ob2RlKTogdHMuTm9kZVtdIHtcbiAgY29uc3QgcCA9IFtdO1xuICB3aGlsZSAobi5wYXJlbnQpIHtcbiAgICBuID0gbi5wYXJlbnQ7XG4gICAgcC5wdXNoKG4pO1xuICB9XG4gIHJldHVybiBwO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciBzb21ldGhpbmcgc2F0aXNmeWluZyB0aGUgZ2l2ZW4gdGVzdCBpbiBgbmAgb3IgaXRzIGNoaWxkcmVuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEluQ2hpbGRyZW4oXG4gICAgbjogdHMuTm9kZSwgdGVzdDogKG46IHRzLk5vZGUpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbGV0IHRvRXhwbG9yZTogdHMuTm9kZVtdID0gW25dO1xuICBsZXQgY3VyOiB0cy5Ob2RlfHVuZGVmaW5lZDtcbiAgd2hpbGUgKGN1ciA9IHRvRXhwbG9yZS5wb3AoKSkge1xuICAgIGlmICh0ZXN0KGN1cikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBSZWN1cnNlXG4gICAgdG9FeHBsb3JlID0gdG9FeHBsb3JlLmNvbmNhdChjdXIuZ2V0Q2hpbGRyZW4oKSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcGF0dGVybi1iYXNlZCBSdWxlIHNob3VsZCBsb29rIGF0IHRoYXQgbm9kZSBhbmQgY29uc2lkZXJcbiAqIHdhcm5pbmcgdGhlcmUuIFRoZSBnb2FsIGlzIHRvIG1ha2UgaXQgZWFzeSB0byBleGNsdWRlIG9uIHNvdXJjZSBmaWxlcyxcbiAqIGJsb2NrcywgbW9kdWxlIGRlY2xhcmF0aW9ucywgSlNEb2MsIGxpYi5kLnRzIG5vZGVzLCB0aGF0IGtpbmQgb2YgdGhpbmdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkRXhhbWluZU5vZGUobjogdHMuTm9kZSkge1xuICByZXR1cm4gIShcbiAgICAgIHRzLmlzQmxvY2sobikgfHwgdHMuaXNNb2R1bGVCbG9jayhuKSB8fCB0cy5pc01vZHVsZURlY2xhcmF0aW9uKG4pIHx8XG4gICAgICB0cy5pc1NvdXJjZUZpbGUobikgfHwgKG4ucGFyZW50ICYmIHRzLmlzVHlwZU5vZGUobi5wYXJlbnQpKSB8fFxuICAgICAgdHMuaXNKU0RvYyhuKSB8fCBpc0luU3RvY2tMaWJyYXJpZXMobikpO1xufVxuXG4vKipcbiAqIFJldHVybiB3aGV0aGVyIHRoZSBnaXZlbiBkZWNsYXJhdGlvbiBpcyBhbWJpZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBbWJpZW50RGVjbGFyYXRpb24oZDogdHMuRGVjbGFyYXRpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIEJvb2xlYW4oXG4gICAgICBkLm1vZGlmaWVycyAmJlxuICAgICAgZC5tb2RpZmllcnMuc29tZShtID0+IG0ua2luZCA9PT0gdHMuU3ludGF4S2luZC5EZWNsYXJlS2V5d29yZCkpO1xufVxuXG4vKipcbiAqIFJldHVybiB3aGV0aGVyIHRoZSBnaXZlbiBOb2RlIGlzIChvciBpcyBpbikgYSBsaWJyYXJ5IGluY2x1ZGVkIGFzIGRlZmF1bHQuXG4gKiBXZSBjdXJyZW50bHkgbG9vayBmb3IgYSBub2RlX21vZHVsZXMvdHlwZXNjcmlwdC8gcHJlZml4LCBidXQgdGhpcyBjb3VsZFxuICogYmUgZXhwYW5kZWQgaWYgbmVlZGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJblN0b2NrTGlicmFyaWVzKG46IHRzLk5vZGV8dHMuU291cmNlRmlsZSk6IGJvb2xlYW4ge1xuICBjb25zdCBzb3VyY2VGaWxlID0gdHMuaXNTb3VyY2VGaWxlKG4pID8gbiA6IG4uZ2V0U291cmNlRmlsZSgpO1xuICBpZiAoc291cmNlRmlsZSkge1xuICAgIHJldHVybiBzb3VyY2VGaWxlLmZpbGVOYW1lLmluZGV4T2YoJ25vZGVfbW9kdWxlcy90eXBlc2NyaXB0LycpICE9PSAtMTtcbiAgfSBlbHNlIHtcbiAgICAvLyB0aGUgbm9kZSBpcyBub3doZXJlPyBDb25zaWRlciBpdCBhcyBwYXJ0IG9mIHRoZSBjb3JlIGxpYnM6IHdlIGNhbid0IGRvXG4gICAgLy8gYW55dGhpbmcgd2l0aCBpdCBhbnl3YXlzLCBhbmQgaXQgd2FzIGxpa2VseSBpbmNsdWRlZCBhcyBkZWZhdWx0LlxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogVHVybnMgdGhlIGdpdmVuIFN5bWJvbCBpbnRvIGl0cyBub24tYWxpYXNlZCB2ZXJzaW9uICh3aGljaCBjb3VsZCBiZSBpdHNlbGYpLlxuICogUmV0dXJucyB1bmRlZmluZWQgaWYgZ2l2ZW4gYW4gdW5kZWZpbmVkIFN5bWJvbCAoc28geW91IGNhbiBjYWxsXG4gKiBgZGVhbGlhcyh0eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpKWApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVhbGlhcyhcbiAgICBzeW1ib2w6IHRzLlN5bWJvbHx1bmRlZmluZWQsIHRjOiB0cy5UeXBlQ2hlY2tlcik6IHRzLlN5bWJvbHx1bmRlZmluZWQge1xuICBpZiAoIXN5bWJvbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKHN5bWJvbC5nZXRGbGFncygpICYgdHMuU3ltYm9sRmxhZ3MuQWxpYXMpIHtcbiAgICAvLyBOb3RlOiBzb21ldGhpbmcgdGhhdCBoYXMgb25seSBUeXBlQWxpYXMgaXMgbm90IGFjY2VwdGFibGUgaGVyZS5cbiAgICByZXR1cm4gZGVhbGlhcyh0Yy5nZXRBbGlhc2VkU3ltYm9sKHN5bWJvbCksIHRjKTtcbiAgfVxuICByZXR1cm4gc3ltYm9sO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBgbmAncyBwYXJlbnRzIGFyZSBzb21ldGhpbmcgaW5kaWNhdGluZyBhIHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BhcnRPZlR5cGVEZWNsYXJhdGlvbihuOiB0cy5Ob2RlKSB7XG4gIHJldHVybiBbbiwgLi4ucGFyZW50cyhuKV0uc29tZShcbiAgICAgIHAgPT4gcC5raW5kID09PSB0cy5TeW50YXhLaW5kLlR5cGVSZWZlcmVuY2UgfHxcbiAgICAgICAgICBwLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHlwZUxpdGVyYWwpO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBgbmAgaXMgdW5kZXIgYW4gaW1wb3J0IHN0YXRlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUGFydE9mSW1wb3J0U3RhdGVtZW50KG46IHRzLk5vZGUpIHtcbiAgcmV0dXJuIFtuLCAuLi5wYXJlbnRzKG4pXS5zb21lKFxuICAgICAgcCA9PiBwLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuSW1wb3J0RGVjbGFyYXRpb24pO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBgbmAgaXMgYSBkZWNsYXJhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGVjbGFyYXRpb24objogdHMuTm9kZSk6IG4gaXMgdHMuVmFyaWFibGVEZWNsYXJhdGlvbnxcbiAgICB0cy5DbGFzc0RlY2xhcmF0aW9ufHRzLkZ1bmN0aW9uRGVjbGFyYXRpb258dHMuTWV0aG9kRGVjbGFyYXRpb258XG4gICAgdHMuUHJvcGVydHlEZWNsYXJhdGlvbnx0cy5WYXJpYWJsZURlY2xhcmF0aW9uTGlzdHx0cy5JbnRlcmZhY2VEZWNsYXJhdGlvbnxcbiAgICB0cy5UeXBlQWxpYXNEZWNsYXJhdGlvbnx0cy5FbnVtRGVjbGFyYXRpb258dHMuTW9kdWxlRGVjbGFyYXRpb258XG4gICAgdHMuSW1wb3J0RGVjbGFyYXRpb258dHMuSW1wb3J0RXF1YWxzRGVjbGFyYXRpb258dHMuRXhwb3J0RGVjbGFyYXRpb258XG4gICAgdHMuTWlzc2luZ0RlY2xhcmF0aW9uIHtcbiAgcmV0dXJuIHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihuKSB8fCB0cy5pc0NsYXNzRGVjbGFyYXRpb24obikgfHxcbiAgICAgIHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihuKSB8fCB0cy5pc01ldGhvZERlY2xhcmF0aW9uKG4pIHx8XG4gICAgICB0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24obikgfHwgdHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uTGlzdChuKSB8fFxuICAgICAgdHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihuKSB8fCB0cy5pc1R5cGVBbGlhc0RlY2xhcmF0aW9uKG4pIHx8XG4gICAgICB0cy5pc0VudW1EZWNsYXJhdGlvbihuKSB8fCB0cy5pc01vZHVsZURlY2xhcmF0aW9uKG4pIHx8XG4gICAgICB0cy5pc0ltcG9ydERlY2xhcmF0aW9uKG4pIHx8IHRzLmlzSW1wb3J0RXF1YWxzRGVjbGFyYXRpb24obikgfHxcbiAgICAgIHRzLmlzRXhwb3J0RGVjbGFyYXRpb24obikgfHwgdHMuaXNNaXNzaW5nRGVjbGFyYXRpb24obik7XG59XG5cbi8qKiBUeXBlIGd1YXJkIGZvciBleHByZXNzaW9ucyB0aGF0IGxvb2tzIGxpa2UgcHJvcGVydHkgd3JpdGVzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlXcml0ZUV4cHJlc3Npb24obm9kZTogdHMuTm9kZSk6XG4gICAgbm9kZSBpcyh0cy5CaW5hcnlFeHByZXNzaW9uICYge1xuICAgICAgbGVmdDogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uO1xuICAgIH0pIHtcbiAgaWYgKCF0cy5pc0JpbmFyeUV4cHJlc3Npb24obm9kZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKG5vZGUub3BlcmF0b3JUb2tlbi5nZXRUZXh0KCkudHJpbSgpICE9PSAnPScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKCF0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmxlZnQpIHx8XG4gICAgICBub2RlLmxlZnQuZXhwcmVzc2lvbi5nZXRGdWxsVGV4dCgpLnRyaW0oKSA9PT0gJycpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUT0RPOiBEZXN0cnVjdHVyaW5nIGFzc2lnbWVudHMgYXJlbid0IGNvdmVyZWQuIFRoaXMgd291bGQgYmUgYSBwb3RlbnRpYWxcbiAgLy8gYnlwYXNzLCBidXQgSSBkb3VidCB3ZSdkIGNhdGNoIGJ1Z3MsIHNvIGZpeGluZyBpdCBzZWVtcyBsb3cgcHJpb3JpdHlcbiAgLy8gb3ZlcmFsbC5cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBJZiB2ZXJib3NlLCBsb2dzIHRoZSBnaXZlbiBlcnJvciB0aGF0IGhhcHBlbmVkIHdoaWxlIHdhbGtpbmcgbiwgd2l0aCBhXG4gKiBzdGFja3RyYWNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9nQVNUV2Fsa0Vycm9yKHZlcmJvc2U6IGJvb2xlYW4sIG46IHRzLk5vZGUsIGU6IEVycm9yKSB7XG4gIGxldCBub2RlVGV4dCA9IGBbZXJyb3IgZ2V0dGluZyBuYW1lIGZvciAke0pTT04uc3RyaW5naWZ5KG4pfV1gO1xuICB0cnkge1xuICAgIG5vZGVUZXh0ID0gJ1wiJyArIG4uZ2V0RnVsbFRleHQoKS50cmltKCkgKyAnXCInO1xuICB9IGNhdGNoIHtcbiAgfVxuICBkZWJ1Z0xvZyhcbiAgICAgIGBXYWxraW5nIG5vZGUgJHtub2RlVGV4dH0gZmFpbGVkIHdpdGggZXJyb3IgJHtlfS5cXG5gICtcbiAgICAgIGBTdGFja3RyYWNlOlxcbiR7ZS5zdGFja31gKTtcbn1cbiJdfQ==