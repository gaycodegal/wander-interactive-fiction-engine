(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "./ast_tools"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const ast_tools_1 = require("./ast_tools");
    /**
     * Determines if the given ts.Node is literal enough for security purposes. This
     * is true when the value is built from compile-time constants, with a certain
     * tolerance for indirection in order to make this more user-friendly.
     *
     * This considers a few different things. We accept
     * - What TS deems literal (literal strings, literal numbers, literal booleans,
     *   enum literals),
     * - Binary operations of two expressions that we accept (including
     *   concatenation),
     * - Template interpolations of what we accept,
     * - `x?y:z` constructions, if we accept `y` and `z`
     * - Variables that are const, and initialized with an expression we accept
     *
     * And to prevent bypasses, expressions that include casts are not accepted, and
     * this checker does not follow imports.
     */
    function isLiteral(typeChecker, node) {
        if (ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
            // Concatenation is fine, if the parts are literals.
            return (isLiteral(typeChecker, node.left) &&
                isLiteral(typeChecker, node.right));
        }
        else if (ts.isTemplateExpression(node)) {
            // Same for template expressions.
            return node.templateSpans.every(span => {
                return isLiteral(typeChecker, span.expression);
            });
        }
        else if (ts.isTemplateLiteral(node)) {
            // and literals (in that order).
            return true;
        }
        else if (ts.isConditionalExpression(node)) {
            return isLiteral(typeChecker, node.whenTrue) &&
                isLiteral(typeChecker, node.whenFalse);
        }
        else if (ts.isIdentifier(node)) {
            return isUnderlyingValueAStringLiteral(node, typeChecker);
        }
        const hasCasts = ast_tools_1.findInChildren(node, ts.isAsExpression);
        return !hasCasts && isLiteralAccordingToItsType(typeChecker, node);
    }
    exports.isLiteral = isLiteral;
    /**
     * Given an identifier, this function goes around the AST to determine
     * whether we should consider it a string literal, on a best-effort basis. It
     * is an approximation, but should never have false positives.
     */
    function isUnderlyingValueAStringLiteral(identifier, tc) {
        // The identifier references a value, and we try to follow the trail: if we
        // find a variable declaration for the identifier, and it was declared as a
        // const (so we know it wasn't altered along the way), then the value used
        // in the declaration is the value our identifier references. That means we
        // should look at the value used in its initialization (by applying the same
        // rules as before).
        // Since we're best-effort, if a part of that operation failed due to lack
        // of support (for instance, the identifier was imported), then we fail
        // closed and don't consider the value a literal.
        // TODO(rjamet): This doesn't follow imports, which is a feature that we need
        // in a fair amount of cases.
        return getVariableDeclarationsInSameFile(identifier, tc)
            .filter(isConst)
            .some(d => d.initializer !== undefined && isLiteral(tc, d.initializer));
    }
    /**
     * Returns whether this thing is a literal based on TS's understanding. This is
     * only looking at the local type, so there's no magic in that function.
     */
    function isLiteralAccordingToItsType(typeChecker, node) {
        const nodeType = typeChecker.getTypeAtLocation(node);
        return (nodeType.flags &
            (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral |
                ts.TypeFlags.BooleanLiteral | ts.TypeFlags.EnumLiteral)) !== 0;
    }
    /**
     * Follows the symbol behind the given identifier, assuming it is a variable,
     * and return all the variable declarations we can find that match it in the
     * same file.
     */
    function getVariableDeclarationsInSameFile(node, tc) {
        const symbol = tc.getSymbolAtLocation(node);
        if (!symbol) {
            return [];
        }
        const decls = symbol.getDeclarations();
        if (!decls) {
            return [];
        }
        return decls.filter(ts.isVariableDeclaration);
    }
    // Tests whether the given variable declaration is Const.
    function isConst(varDecl) {
        return Boolean(varDecl && varDecl.parent &&
            ts.isVariableDeclarationList(varDecl.parent) &&
            varDecl.parent.flags & ts.NodeFlags.Const);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNfbGl0ZXJhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL3V0aWwvaXNfbGl0ZXJhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLGlDQUFpQztJQUNqQywyQ0FBMkM7SUFFM0M7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxTQUFnQixTQUFTLENBQUMsV0FBMkIsRUFBRSxJQUFhO1FBQ2xFLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQztZQUMzQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUN2RCxvREFBb0Q7WUFDcEQsT0FBTyxDQUNILFNBQVMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDakMsU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN6QzthQUFNLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hDLGlDQUFpQztZQUNqQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNyQyxPQUFPLFNBQVMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDO1NBQ0o7YUFBTSxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQyxnQ0FBZ0M7WUFDaEMsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNLElBQUksRUFBRSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzNDLE9BQU8sU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUN4QyxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM1QzthQUFNLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoQyxPQUFPLCtCQUErQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztTQUMzRDtRQUVELE1BQU0sUUFBUSxHQUFHLDBCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV6RCxPQUFPLENBQUMsUUFBUSxJQUFJLDJCQUEyQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBekJELDhCQXlCQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLCtCQUErQixDQUNwQyxVQUF5QixFQUFFLEVBQWtCO1FBQy9DLDJFQUEyRTtRQUMzRSwyRUFBMkU7UUFDM0UsMEVBQTBFO1FBQzFFLDJFQUEyRTtRQUMzRSw0RUFBNEU7UUFDNUUsb0JBQW9CO1FBQ3BCLDBFQUEwRTtRQUMxRSx1RUFBdUU7UUFDdkUsaURBQWlEO1FBRWpELDZFQUE2RTtRQUM3RSw2QkFBNkI7UUFDN0IsT0FBTyxpQ0FBaUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2FBQ25ELE1BQU0sQ0FBQyxPQUFPLENBQUM7YUFDZixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLDJCQUEyQixDQUNoQyxXQUEyQixFQUFFLElBQWE7UUFDNUMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSztZQUNkLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhO2dCQUN2RCxFQUFFLENBQUMsU0FBUyxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyxpQ0FBaUMsQ0FDdEMsSUFBbUIsRUFBRSxFQUFrQjtRQUN6QyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELHlEQUF5RDtJQUN6RCxTQUFTLE9BQU8sQ0FBQyxPQUErQjtRQUM5QyxPQUFPLE9BQU8sQ0FDVixPQUFPLElBQUksT0FBTyxDQUFDLE1BQU07WUFDekIsRUFBRSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDNUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2ZpbmRJbkNoaWxkcmVufSBmcm9tICcuL2FzdF90b29scyc7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gdHMuTm9kZSBpcyBsaXRlcmFsIGVub3VnaCBmb3Igc2VjdXJpdHkgcHVycG9zZXMuIFRoaXNcbiAqIGlzIHRydWUgd2hlbiB0aGUgdmFsdWUgaXMgYnVpbHQgZnJvbSBjb21waWxlLXRpbWUgY29uc3RhbnRzLCB3aXRoIGEgY2VydGFpblxuICogdG9sZXJhbmNlIGZvciBpbmRpcmVjdGlvbiBpbiBvcmRlciB0byBtYWtlIHRoaXMgbW9yZSB1c2VyLWZyaWVuZGx5LlxuICpcbiAqIFRoaXMgY29uc2lkZXJzIGEgZmV3IGRpZmZlcmVudCB0aGluZ3MuIFdlIGFjY2VwdFxuICogLSBXaGF0IFRTIGRlZW1zIGxpdGVyYWwgKGxpdGVyYWwgc3RyaW5ncywgbGl0ZXJhbCBudW1iZXJzLCBsaXRlcmFsIGJvb2xlYW5zLFxuICogICBlbnVtIGxpdGVyYWxzKSxcbiAqIC0gQmluYXJ5IG9wZXJhdGlvbnMgb2YgdHdvIGV4cHJlc3Npb25zIHRoYXQgd2UgYWNjZXB0IChpbmNsdWRpbmdcbiAqICAgY29uY2F0ZW5hdGlvbiksXG4gKiAtIFRlbXBsYXRlIGludGVycG9sYXRpb25zIG9mIHdoYXQgd2UgYWNjZXB0LFxuICogLSBgeD95OnpgIGNvbnN0cnVjdGlvbnMsIGlmIHdlIGFjY2VwdCBgeWAgYW5kIGB6YFxuICogLSBWYXJpYWJsZXMgdGhhdCBhcmUgY29uc3QsIGFuZCBpbml0aWFsaXplZCB3aXRoIGFuIGV4cHJlc3Npb24gd2UgYWNjZXB0XG4gKlxuICogQW5kIHRvIHByZXZlbnQgYnlwYXNzZXMsIGV4cHJlc3Npb25zIHRoYXQgaW5jbHVkZSBjYXN0cyBhcmUgbm90IGFjY2VwdGVkLCBhbmRcbiAqIHRoaXMgY2hlY2tlciBkb2VzIG5vdCBmb2xsb3cgaW1wb3J0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGl0ZXJhbCh0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgaWYgKHRzLmlzQmluYXJ5RXhwcmVzc2lvbihub2RlKSAmJlxuICAgICAgbm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUGx1c1Rva2VuKSB7XG4gICAgLy8gQ29uY2F0ZW5hdGlvbiBpcyBmaW5lLCBpZiB0aGUgcGFydHMgYXJlIGxpdGVyYWxzLlxuICAgIHJldHVybiAoXG4gICAgICAgIGlzTGl0ZXJhbCh0eXBlQ2hlY2tlciwgbm9kZS5sZWZ0KSAmJlxuICAgICAgICBpc0xpdGVyYWwodHlwZUNoZWNrZXIsIG5vZGUucmlnaHQpKTtcbiAgfSBlbHNlIGlmICh0cy5pc1RlbXBsYXRlRXhwcmVzc2lvbihub2RlKSkge1xuICAgIC8vIFNhbWUgZm9yIHRlbXBsYXRlIGV4cHJlc3Npb25zLlxuICAgIHJldHVybiBub2RlLnRlbXBsYXRlU3BhbnMuZXZlcnkoc3BhbiA9PiB7XG4gICAgICByZXR1cm4gaXNMaXRlcmFsKHR5cGVDaGVja2VyLCBzcGFuLmV4cHJlc3Npb24pO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHRzLmlzVGVtcGxhdGVMaXRlcmFsKG5vZGUpKSB7XG4gICAgLy8gYW5kIGxpdGVyYWxzIChpbiB0aGF0IG9yZGVyKS5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0cy5pc0NvbmRpdGlvbmFsRXhwcmVzc2lvbihub2RlKSkge1xuICAgIHJldHVybiBpc0xpdGVyYWwodHlwZUNoZWNrZXIsIG5vZGUud2hlblRydWUpICYmXG4gICAgICAgIGlzTGl0ZXJhbCh0eXBlQ2hlY2tlciwgbm9kZS53aGVuRmFsc2UpO1xuICB9IGVsc2UgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSkge1xuICAgIHJldHVybiBpc1VuZGVybHlpbmdWYWx1ZUFTdHJpbmdMaXRlcmFsKG5vZGUsIHR5cGVDaGVja2VyKTtcbiAgfVxuXG4gIGNvbnN0IGhhc0Nhc3RzID0gZmluZEluQ2hpbGRyZW4obm9kZSwgdHMuaXNBc0V4cHJlc3Npb24pO1xuXG4gIHJldHVybiAhaGFzQ2FzdHMgJiYgaXNMaXRlcmFsQWNjb3JkaW5nVG9JdHNUeXBlKHR5cGVDaGVja2VyLCBub2RlKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhbiBpZGVudGlmaWVyLCB0aGlzIGZ1bmN0aW9uIGdvZXMgYXJvdW5kIHRoZSBBU1QgdG8gZGV0ZXJtaW5lXG4gKiB3aGV0aGVyIHdlIHNob3VsZCBjb25zaWRlciBpdCBhIHN0cmluZyBsaXRlcmFsLCBvbiBhIGJlc3QtZWZmb3J0IGJhc2lzLiBJdFxuICogaXMgYW4gYXBwcm94aW1hdGlvbiwgYnV0IHNob3VsZCBuZXZlciBoYXZlIGZhbHNlIHBvc2l0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaXNVbmRlcmx5aW5nVmFsdWVBU3RyaW5nTGl0ZXJhbChcbiAgICBpZGVudGlmaWVyOiB0cy5JZGVudGlmaWVyLCB0YzogdHMuVHlwZUNoZWNrZXIpIHtcbiAgLy8gVGhlIGlkZW50aWZpZXIgcmVmZXJlbmNlcyBhIHZhbHVlLCBhbmQgd2UgdHJ5IHRvIGZvbGxvdyB0aGUgdHJhaWw6IGlmIHdlXG4gIC8vIGZpbmQgYSB2YXJpYWJsZSBkZWNsYXJhdGlvbiBmb3IgdGhlIGlkZW50aWZpZXIsIGFuZCBpdCB3YXMgZGVjbGFyZWQgYXMgYVxuICAvLyBjb25zdCAoc28gd2Uga25vdyBpdCB3YXNuJ3QgYWx0ZXJlZCBhbG9uZyB0aGUgd2F5KSwgdGhlbiB0aGUgdmFsdWUgdXNlZFxuICAvLyBpbiB0aGUgZGVjbGFyYXRpb24gaXMgdGhlIHZhbHVlIG91ciBpZGVudGlmaWVyIHJlZmVyZW5jZXMuIFRoYXQgbWVhbnMgd2VcbiAgLy8gc2hvdWxkIGxvb2sgYXQgdGhlIHZhbHVlIHVzZWQgaW4gaXRzIGluaXRpYWxpemF0aW9uIChieSBhcHBseWluZyB0aGUgc2FtZVxuICAvLyBydWxlcyBhcyBiZWZvcmUpLlxuICAvLyBTaW5jZSB3ZSdyZSBiZXN0LWVmZm9ydCwgaWYgYSBwYXJ0IG9mIHRoYXQgb3BlcmF0aW9uIGZhaWxlZCBkdWUgdG8gbGFja1xuICAvLyBvZiBzdXBwb3J0IChmb3IgaW5zdGFuY2UsIHRoZSBpZGVudGlmaWVyIHdhcyBpbXBvcnRlZCksIHRoZW4gd2UgZmFpbFxuICAvLyBjbG9zZWQgYW5kIGRvbid0IGNvbnNpZGVyIHRoZSB2YWx1ZSBhIGxpdGVyYWwuXG5cbiAgLy8gVE9ETyhyamFtZXQpOiBUaGlzIGRvZXNuJ3QgZm9sbG93IGltcG9ydHMsIHdoaWNoIGlzIGEgZmVhdHVyZSB0aGF0IHdlIG5lZWRcbiAgLy8gaW4gYSBmYWlyIGFtb3VudCBvZiBjYXNlcy5cbiAgcmV0dXJuIGdldFZhcmlhYmxlRGVjbGFyYXRpb25zSW5TYW1lRmlsZShpZGVudGlmaWVyLCB0YylcbiAgICAgIC5maWx0ZXIoaXNDb25zdClcbiAgICAgIC5zb21lKGQgPT4gZC5pbml0aWFsaXplciAhPT0gdW5kZWZpbmVkICYmIGlzTGl0ZXJhbCh0YywgZC5pbml0aWFsaXplcikpO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciB0aGlzIHRoaW5nIGlzIGEgbGl0ZXJhbCBiYXNlZCBvbiBUUydzIHVuZGVyc3RhbmRpbmcuIFRoaXMgaXNcbiAqIG9ubHkgbG9va2luZyBhdCB0aGUgbG9jYWwgdHlwZSwgc28gdGhlcmUncyBubyBtYWdpYyBpbiB0aGF0IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBpc0xpdGVyYWxBY2NvcmRpbmdUb0l0c1R5cGUoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vZGVUeXBlID0gdHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24obm9kZSk7XG4gIHJldHVybiAobm9kZVR5cGUuZmxhZ3MgJlxuICAgICAgICAgICh0cy5UeXBlRmxhZ3MuU3RyaW5nTGl0ZXJhbCB8IHRzLlR5cGVGbGFncy5OdW1iZXJMaXRlcmFsIHxcbiAgICAgICAgICAgdHMuVHlwZUZsYWdzLkJvb2xlYW5MaXRlcmFsIHwgdHMuVHlwZUZsYWdzLkVudW1MaXRlcmFsKSkgIT09IDA7XG59XG5cbi8qKlxuICogRm9sbG93cyB0aGUgc3ltYm9sIGJlaGluZCB0aGUgZ2l2ZW4gaWRlbnRpZmllciwgYXNzdW1pbmcgaXQgaXMgYSB2YXJpYWJsZSxcbiAqIGFuZCByZXR1cm4gYWxsIHRoZSB2YXJpYWJsZSBkZWNsYXJhdGlvbnMgd2UgY2FuIGZpbmQgdGhhdCBtYXRjaCBpdCBpbiB0aGVcbiAqIHNhbWUgZmlsZS5cbiAqL1xuZnVuY3Rpb24gZ2V0VmFyaWFibGVEZWNsYXJhdGlvbnNJblNhbWVGaWxlKFxuICAgIG5vZGU6IHRzLklkZW50aWZpZXIsIHRjOiB0cy5UeXBlQ2hlY2tlcik6IHRzLlZhcmlhYmxlRGVjbGFyYXRpb25bXSB7XG4gIGNvbnN0IHN5bWJvbCA9IHRjLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG4gIGlmICghc3ltYm9sKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGNvbnN0IGRlY2xzID0gc3ltYm9sLmdldERlY2xhcmF0aW9ucygpO1xuICBpZiAoIWRlY2xzKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBkZWNscy5maWx0ZXIodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKTtcbn1cblxuLy8gVGVzdHMgd2hldGhlciB0aGUgZ2l2ZW4gdmFyaWFibGUgZGVjbGFyYXRpb24gaXMgQ29uc3QuXG5mdW5jdGlvbiBpc0NvbnN0KHZhckRlY2w6IHRzLlZhcmlhYmxlRGVjbGFyYXRpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIEJvb2xlYW4oXG4gICAgICB2YXJEZWNsICYmIHZhckRlY2wucGFyZW50ICYmXG4gICAgICB0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KHZhckRlY2wucGFyZW50KSAmJlxuICAgICAgdmFyRGVjbC5wYXJlbnQuZmxhZ3MgJiB0cy5Ob2RlRmxhZ3MuQ29uc3QpO1xufVxuIl19