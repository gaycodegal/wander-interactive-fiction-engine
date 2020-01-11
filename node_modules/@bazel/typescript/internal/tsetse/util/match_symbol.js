(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./ast_tools"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ast_tools_1 = require("./ast_tools");
    const JS_IDENTIFIER_FORMAT = '[\\w\\d_-]+';
    const FQN_FORMAT = `(${JS_IDENTIFIER_FORMAT}\.)*${JS_IDENTIFIER_FORMAT}`;
    // A fqn made out of a dot-separated chain of JS identifiers.
    const ABSOLUTE_RE = new RegExp(`^${FQN_FORMAT}$`);
    /**
     * This class matches symbols given a "foo.bar.baz" name, where none of the
     * steps are instances of classes.
     *
     * Note that this isn't smart about subclasses and types: to write a check, we
     * strongly suggest finding the expected symbol in externs to find the object
     * name on which the symbol was initially defined.
     *
     * TODO(rjamet): add a file-based optional filter, since FQNs tell you where
     * your imported symbols were initially defined. That would let us be more
     * specific in matches (say, you want to ban the fromLiteral in foo.ts but not
     * the one from bar.ts).
     */
    class AbsoluteMatcher {
        /**
         * From a "path/to/file.ts:foo.bar.baz" or "foo.bar.baz" matcher
         * specification, builds a Matcher.
         */
        constructor(bannedName) {
            this.bannedName = bannedName;
            if (!bannedName.match(ABSOLUTE_RE)) {
                throw new Error('Malformed matcher selector.');
            }
            // JSConformance used to use a Foo.prototype.bar syntax for bar on
            // instances of Foo. TS doesn't surface the prototype part in the FQN, and
            // so you can't tell static `bar` on `foo` from the `bar` property/method
            // on `foo`. To avoid any confusion, throw there if we see `prototype` in
            // the spec: that way, it's obvious that you're not trying to match
            // properties.
            if (this.bannedName.match('.prototype.')) {
                throw new Error('Your pattern includes a .prototype, but the AbsoluteMatcher is ' +
                    'meant for non-object matches. Use the PropertyMatcher instead, or ' +
                    'the Property-based PatternKinds.');
            }
        }
        matches(n, tc) {
            // Get the symbol (or the one at the other end of this alias) that we're
            // looking at.
            const s = ast_tools_1.dealias(tc.getSymbolAtLocation(n), tc);
            if (!s) {
                ast_tools_1.debugLog(`cannot get symbol`);
                return false;
            }
            // The TS-provided FQN tells us the full identifier, and the origin file
            // in some circumstances.
            const fqn = tc.getFullyQualifiedName(s);
            ast_tools_1.debugLog(`got FQN ${fqn}`);
            // Name-based check
            if (!(fqn.endsWith('.' + this.bannedName) || fqn === this.bannedName)) {
                ast_tools_1.debugLog(`FQN ${fqn} doesn't match name ${this.bannedName}`);
                return false; // not a use of the symbols we want
            }
            // Check if it's part of a declaration or import. The check is cheap. If
            // we're looking for the uses of a symbol, we don't alert on the imports, to
            // avoid flooding users with warnings (as the actual use will be alerted)
            // and bad fixes.
            const p = n.parent;
            if (p && (ast_tools_1.isDeclaration(p) || ast_tools_1.isPartOfImportStatement(p))) {
                ast_tools_1.debugLog(`We don't flag symbol declarations`);
                return false;
            }
            // No file info in the FQN means it's not explicitly imported.
            // That must therefore be a local variable, or an ambient symbol
            // (and we only care about ambients here). Those could come from
            // either a declare somewhere, or one of the core libraries that
            // are loaded by default.
            if (!fqn.startsWith('"')) {
                // We need to trace things back, so get declarations of the symbol.
                const declarations = s.getDeclarations();
                if (!declarations) {
                    ast_tools_1.debugLog(`Symbol never declared?`);
                    return false;
                }
                if (!declarations.some(ast_tools_1.isAmbientDeclaration) &&
                    !declarations.some(ast_tools_1.isInStockLibraries)) {
                    ast_tools_1.debugLog(`Symbol neither ambient nor from the stock libraries`);
                    return false;
                }
            }
            ast_tools_1.debugLog(`all clear, report finding`);
            return true;
        }
    }
    exports.AbsoluteMatcher = AbsoluteMatcher;
    // TODO: Export the matched node kinds here.
    /**
     * This class matches a property access node, based on a property holder type
     * (through its name), i.e. a class, and a property name.
     *
     * The logic is voluntarily simple: if a matcher for `a.b` tests a `x.y` node,
     * it will return true if:
     * - `x` is of type `a` either directly (name-based) or through inheritance
     *   (ditto),
     * - and, textually, `y` === `b`.
     *
     * Note that the logic is different from TS's type system: this matcher doesn't
     * have any knowledge of structural typing.
     */
    class PropertyMatcher {
        constructor(bannedType, bannedProperty) {
            this.bannedType = bannedType;
            this.bannedProperty = bannedProperty;
        }
        static fromSpec(spec) {
            if (spec.indexOf('.prototype.') === -1) {
                throw new Error(`BANNED_PROPERTY expects a .prototype in your query.`);
            }
            const requestParser = /^([\w\d_.-]+)\.prototype\.([\w\d_.-]+)$/;
            const matches = requestParser.exec(spec);
            if (!matches) {
                throw new Error('Cannot understand the BannedProperty spec' + spec);
            }
            const [bannedType, bannedProperty] = matches.slice(1);
            return new PropertyMatcher(bannedType, bannedProperty);
        }
        /**
         * @param n The PropertyAccessExpression we're looking at.
         */
        matches(n, tc) {
            return n.name.text === this.bannedProperty &&
                this.typeMatches(tc.getTypeAtLocation(n.expression));
        }
        exactTypeMatches(inspectedType) {
            const typeSymbol = inspectedType.getSymbol() || false;
            return typeSymbol && typeSymbol.getName() === this.bannedType;
        }
        // TODO: Account for unknown types/ '?', and 'loose type matches', i.e. if the
        // actual type is a supertype of the prohibited type.
        typeMatches(inspectedType) {
            if (this.exactTypeMatches(inspectedType)) {
                return true;
            }
            const baseTypes = inspectedType.getBaseTypes() || [];
            return baseTypes.some(base => this.exactTypeMatches(base));
        }
    }
    exports.PropertyMatcher = PropertyMatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hfc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvdXRpbC9tYXRjaF9zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFDQSwyQ0FBZ0k7SUFFaEksTUFBTSxvQkFBb0IsR0FBRyxhQUFhLENBQUM7SUFDM0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBb0IsT0FBTyxvQkFBb0IsRUFBRSxDQUFDO0lBQ3pFLDZEQUE2RDtJQUM3RCxNQUFNLFdBQVcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFFbEQ7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsTUFBYSxlQUFlO1FBQzFCOzs7V0FHRztRQUNILFlBQXFCLFVBQWtCO1lBQWxCLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQzthQUNoRDtZQUVELGtFQUFrRTtZQUNsRSwwRUFBMEU7WUFDMUUseUVBQXlFO1lBQ3pFLHlFQUF5RTtZQUN6RSxtRUFBbUU7WUFDbkUsY0FBYztZQUNkLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUU7Z0JBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQ1gsaUVBQWlFO29CQUNqRSxvRUFBb0U7b0JBQ3BFLGtDQUFrQyxDQUFDLENBQUM7YUFDekM7UUFDSCxDQUFDO1FBRUQsT0FBTyxDQUFDLENBQVUsRUFBRSxFQUFrQjtZQUNwQyx3RUFBd0U7WUFDeEUsY0FBYztZQUNkLE1BQU0sQ0FBQyxHQUFHLG1CQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMs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Q3pELENBQUM7UUFJRDs7V0FFRztRQUNILE9BQU8sQ0FBQyxDQUE4QixFQUFFLEVBQWtCO1lBQ3hELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLGNBQWM7Z0JBQ3RDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxhQUFzQjtZQUM3QyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksS0FBSyxDQUFDO1lBQ3RELE9BQU8sVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2hFLENBQUM7UUFFRCw4RUFBOEU7UUFDOUUscURBQXFEO1FBQzdDLFdBQVcsQ0FBQyxhQUFzQjtZQUN4QyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDeEMsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDckQsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUNGO0lBdENELDBDQXNDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtkZWFsaWFzLCBkZWJ1Z0xvZywgaXNBbWJpZW50RGVjbGFyYXRpb24sIGlzRGVjbGFyYXRpb24sIGlzSW5TdG9ja0xpYnJhcmllcywgaXNQYXJ0T2ZJbXBvcnRTdGF0ZW1lbnR9IGZyb20gJy4vYXN0X3Rvb2xzJztcblxuY29uc3QgSlNfSURFTlRJRklFUl9GT1JNQVQgPSAnW1xcXFx3XFxcXGRfLV0rJztcbmNvbnN0IEZRTl9GT1JNQVQgPSBgKCR7SlNfSURFTlRJRklFUl9GT1JNQVR9XFwuKSoke0pTX0lERU5USUZJRVJfRk9STUFUfWA7XG4vLyBBIGZxbiBtYWRlIG91dCBvZiBhIGRvdC1zZXBhcmF0ZWQgY2hhaW4gb2YgSlMgaWRlbnRpZmllcnMuXG5jb25zdCBBQlNPTFVURV9SRSA9IG5ldyBSZWdFeHAoYF4ke0ZRTl9GT1JNQVR9JGApO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgbWF0Y2hlcyBzeW1ib2xzIGdpdmVuIGEgXCJmb28uYmFyLmJhelwiIG5hbWUsIHdoZXJlIG5vbmUgb2YgdGhlXG4gKiBzdGVwcyBhcmUgaW5zdGFuY2VzIG9mIGNsYXNzZXMuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXNuJ3Qgc21hcnQgYWJvdXQgc3ViY2xhc3NlcyBhbmQgdHlwZXM6IHRvIHdyaXRlIGEgY2hlY2ssIHdlXG4gKiBzdHJvbmdseSBzdWdnZXN0IGZpbmRpbmcgdGhlIGV4cGVjdGVkIHN5bWJvbCBpbiBleHRlcm5zIHRvIGZpbmQgdGhlIG9iamVjdFxuICogbmFtZSBvbiB3aGljaCB0aGUgc3ltYm9sIHdhcyBpbml0aWFsbHkgZGVmaW5lZC5cbiAqXG4gKiBUT0RPKHJqYW1ldCk6IGFkZCBhIGZpbGUtYmFzZWQgb3B0aW9uYWwgZmlsdGVyLCBzaW5jZSBGUU5zIHRlbGwgeW91IHdoZXJlXG4gKiB5b3VyIGltcG9ydGVkIHN5bWJvbHMgd2VyZSBpbml0aWFsbHkgZGVmaW5lZC4gVGhhdCB3b3VsZCBsZXQgdXMgYmUgbW9yZVxuICogc3BlY2lmaWMgaW4gbWF0Y2hlcyAoc2F5LCB5b3Ugd2FudCB0byBiYW4gdGhlIGZyb21MaXRlcmFsIGluIGZvby50cyBidXQgbm90XG4gKiB0aGUgb25lIGZyb20gYmFyLnRzKS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFic29sdXRlTWF0Y2hlciB7XG4gIC8qKlxuICAgKiBGcm9tIGEgXCJwYXRoL3RvL2ZpbGUudHM6Zm9vLmJhci5iYXpcIiBvciBcImZvby5iYXIuYmF6XCIgbWF0Y2hlclxuICAgKiBzcGVjaWZpY2F0aW9uLCBidWlsZHMgYSBNYXRjaGVyLlxuICAgKi9cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgYmFubmVkTmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKCFiYW5uZWROYW1lLm1hdGNoKEFCU09MVVRFX1JFKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYWxmb3JtZWQgbWF0Y2hlciBzZWxlY3Rvci4nKTtcbiAgICB9XG5cbiAgICAvLyBKU0NvbmZvcm1hbmNlIHVzZWQgdG8gdXNlIGEgRm9vLnByb3RvdHlwZS5iYXIgc3ludGF4IGZvciBiYXIgb25cbiAgICAvLyBpbnN0YW5jZXMgb2YgRm9vLiBUUyBkb2Vzbid0IHN1cmZhY2UgdGhlIHByb3RvdHlwZSBwYXJ0IGluIHRoZSBGUU4sIGFuZFxuICAgIC8vIHNvIHlvdSBjYW4ndCB0ZWxsIHN0YXRpYyBgYmFyYCBvbiBgZm9vYCBmcm9tIHRoZSBgYmFyYCBwcm9wZXJ0eS9tZXRob2RcbiAgICAvLyBvbiBgZm9vYC4gVG8gYXZvaWQgYW55IGNvbmZ1c2lvbiwgdGhyb3cgdGhlcmUgaWYgd2Ugc2VlIGBwcm90b3R5cGVgIGluXG4gICAgLy8gdGhlIHNwZWM6IHRoYXQgd2F5LCBpdCdzIG9idmlvdXMgdGhhdCB5b3UncmUgbm90IHRyeWluZyB0byBtYXRjaFxuICAgIC8vIHByb3BlcnRpZXMuXG4gICAgaWYgKHRoaXMuYmFubmVkTmFtZS5tYXRjaCgnLnByb3RvdHlwZS4nKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdZb3VyIHBhdHRlcm4gaW5jbHVkZXMgYSAucHJvdG90eXBlLCBidXQgdGhlIEFic29sdXRlTWF0Y2hlciBpcyAnICtcbiAgICAgICAgICAnbWVhbnQgZm9yIG5vbi1vYmplY3QgbWF0Y2hlcy4gVXNlIHRoZSBQcm9wZXJ0eU1hdGNoZXIgaW5zdGVhZCwgb3IgJyArXG4gICAgICAgICAgJ3RoZSBQcm9wZXJ0eS1iYXNlZCBQYXR0ZXJuS2luZHMuJyk7XG4gICAgfVxuICB9XG5cbiAgbWF0Y2hlcyhuOiB0cy5Ob2RlLCB0YzogdHMuVHlwZUNoZWNrZXIpOiBib29sZWFuIHtcbiAgICAvLyBHZXQgdGhlIHN5bWJvbCAob3IgdGhlIG9uZSBhdCB0aGUgb3RoZXIgZW5kIG9mIHRoaXMgYWxpYXMpIHRoYXQgd2UncmVcbiAgICAvLyBsb29raW5nIGF0LlxuICAgIGNvbnN0IHMgPSBkZWFsaWFzKHRjLmdldFN5bWJvbEF0TG9jYXRpb24obiksIHRjKTtcbiAgICBpZiAoIXMpIHtcbiAgICAgIGRlYnVnTG9nKGBjYW5ub3QgZ2V0IHN5bWJvbGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoZSBUUy1wcm92aWRlZCBGUU4gdGVsbHMgdXMgdGhlIGZ1bGwgaWRlbnRpZmllciwgYW5kIHRoZSBvcmlnaW4gZmlsZVxuICAgIC8vIGluIHNvbWUgY2lyY3Vtc3RhbmNlcy5cbiAgICBjb25zdCBmcW4gPSB0Yy5nZXRGdWxseVF1YWxpZmllZE5hbWUocyk7XG4gICAgZGVidWdMb2coYGdvdCBGUU4gJHtmcW59YCk7XG5cbiAgICAvLyBOYW1lLWJhc2VkIGNoZWNrXG4gICAgaWYgKCEoZnFuLmVuZHNXaXRoKCcuJyArIHRoaXMuYmFubmVkTmFtZSkgfHwgZnFuID09PSB0aGlzLmJhbm5lZE5hbWUpKSB7XG4gICAgICBkZWJ1Z0xvZyhgRlFOICR7ZnFufSBkb2Vzbid0IG1hdGNoIG5hbWUgJHt0aGlzLmJhbm5lZE5hbWV9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7ICAvLyBub3QgYSB1c2Ugb2YgdGhlIHN5bWJvbHMgd2Ugd2FudFxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGl0J3MgcGFydCBvZiBhIGRlY2xhcmF0aW9uIG9yIGltcG9ydC4gVGhlIGNoZWNrIGlzIGNoZWFwLiBJZlxuICAgIC8vIHdlJ3JlIGxvb2tpbmcgZm9yIHRoZSB1c2VzIG9mIGEgc3ltYm9sLCB3ZSBkb24ndCBhbGVydCBvbiB0aGUgaW1wb3J0cywgdG9cbiAgICAvLyBhdm9pZCBmbG9vZGluZyB1c2VycyB3aXRoIHdhcm5pbmdzIChhcyB0aGUgYWN0dWFsIHVzZSB3aWxsIGJlIGFsZXJ0ZWQpXG4gICAgLy8gYW5kIGJhZCBmaXhlcy5cbiAgICBjb25zdCBwID0gbi5wYXJlbnQ7XG4gICAgaWYgKHAgJiYgKGlzRGVjbGFyYXRpb24ocCkgfHwgaXNQYXJ0T2ZJbXBvcnRTdGF0ZW1lbnQocCkpKSB7XG4gICAgICBkZWJ1Z0xvZyhgV2UgZG9uJ3QgZmxhZyBzeW1ib2wgZGVjbGFyYXRpb25zYCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gTm8gZmlsZSBpbmZvIGluIHRoZSBGUU4gbWVhbnMgaXQncyBub3QgZXhwbGljaXRseSBpbXBvcnRlZC5cbiAgICAvLyBUaGF0IG11c3QgdGhlcmVmb3JlIGJlIGEgbG9jYWwgdmFyaWFibGUsIG9yIGFuIGFtYmllbnQgc3ltYm9sXG4gICAgLy8gKGFuZCB3ZSBvbmx5IGNhcmUgYWJvdXQgYW1iaWVudHMgaGVyZSkuIFRob3NlIGNvdWxkIGNvbWUgZnJvbVxuICAgIC8vIGVpdGhlciBhIGRlY2xhcmUgc29tZXdoZXJlLCBvciBvbmUgb2YgdGhlIGNvcmUgbGlicmFyaWVzIHRoYXRcbiAgICAvLyBhcmUgbG9hZGVkIGJ5IGRlZmF1bHQuXG4gICAgaWYgKCFmcW4uc3RhcnRzV2l0aCgnXCInKSkge1xuICAgICAgLy8gV2UgbmVlZCB0byB0cmFjZSB0aGluZ3MgYmFjaywgc28gZ2V0IGRlY2xhcmF0aW9ucyBvZiB0aGUgc3ltYm9sLlxuICAgICAgY29uc3QgZGVjbGFyYXRpb25zID0gcy5nZXREZWNsYXJhdGlvbnMoKTtcbiAgICAgIGlmICghZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIGRlYnVnTG9nKGBTeW1ib2wgbmV2ZXIgZGVjbGFyZWQ/YCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghZGVjbGFyYXRpb25zLnNvbWUoaXNBbWJpZW50RGVjbGFyYXRpb24pICYmXG4gICAgICAgICAgIWRlY2xhcmF0aW9ucy5zb21lKGlzSW5TdG9ja0xpYnJhcmllcykpIHtcbiAgICAgICAgZGVidWdMb2coYFN5bWJvbCBuZWl0aGVyIGFtYmllbnQgbm9yIGZyb20gdGhlIHN0b2NrIGxpYnJhcmllc2ApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVidWdMb2coYGFsbCBjbGVhciwgcmVwb3J0IGZpbmRpbmdgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vLyBUT0RPOiBFeHBvcnQgdGhlIG1hdGNoZWQgbm9kZSBraW5kcyBoZXJlLlxuLyoqXG4gKiBUaGlzIGNsYXNzIG1hdGNoZXMgYSBwcm9wZXJ0eSBhY2Nlc3Mgbm9kZSwgYmFzZWQgb24gYSBwcm9wZXJ0eSBob2xkZXIgdHlwZVxuICogKHRocm91Z2ggaXRzIG5hbWUpLCBpLmUuIGEgY2xhc3MsIGFuZCBhIHByb3BlcnR5IG5hbWUuXG4gKlxuICogVGhlIGxvZ2ljIGlzIHZvbHVudGFyaWx5IHNpbXBsZTogaWYgYSBtYXRjaGVyIGZvciBgYS5iYCB0ZXN0cyBhIGB4LnlgIG5vZGUsXG4gKiBpdCB3aWxsIHJldHVybiB0cnVlIGlmOlxuICogLSBgeGAgaXMgb2YgdHlwZSBgYWAgZWl0aGVyIGRpcmVjdGx5IChuYW1lLWJhc2VkKSBvciB0aHJvdWdoIGluaGVyaXRhbmNlXG4gKiAgIChkaXR0byksXG4gKiAtIGFuZCwgdGV4dHVhbGx5LCBgeWAgPT09IGBiYC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGxvZ2ljIGlzIGRpZmZlcmVudCBmcm9tIFRTJ3MgdHlwZSBzeXN0ZW06IHRoaXMgbWF0Y2hlciBkb2Vzbid0XG4gKiBoYXZlIGFueSBrbm93bGVkZ2Ugb2Ygc3RydWN0dXJhbCB0eXBpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eU1hdGNoZXIge1xuICBzdGF0aWMgZnJvbVNwZWMoc3BlYzogc3RyaW5nKTogUHJvcGVydHlNYXRjaGVyIHtcbiAgICBpZiAoc3BlYy5pbmRleE9mKCcucHJvdG90eXBlLicpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBCQU5ORURfUFJPUEVSVFkgZXhwZWN0cyBhIC5wcm90b3R5cGUgaW4geW91ciBxdWVyeS5gKTtcbiAgICB9XG4gICAgY29uc3QgcmVxdWVzdFBhcnNlciA9IC9eKFtcXHdcXGRfLi1dKylcXC5wcm90b3R5cGVcXC4oW1xcd1xcZF8uLV0rKSQvO1xuICAgIGNvbnN0IG1hdGNoZXMgPSByZXF1ZXN0UGFyc2VyLmV4ZWMoc3BlYyk7XG4gICAgaWYgKCFtYXRjaGVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1bmRlcnN0YW5kIHRoZSBCYW5uZWRQcm9wZXJ0eSBzcGVjJyArIHNwZWMpO1xuICAgIH1cbiAgICBjb25zdCBbYmFubmVkVHlwZSwgYmFubmVkUHJvcGVydHldID0gbWF0Y2hlcy5zbGljZSgxKTtcbiAgICByZXR1cm4gbmV3IFByb3BlcnR5TWF0Y2hlcihiYW5uZWRUeXBlLCBiYW5uZWRQcm9wZXJ0eSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSBiYW5uZWRUeXBlOiBzdHJpbmcsIHJlYWRvbmx5IGJhbm5lZFByb3BlcnR5OiBzdHJpbmcpIHt9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBuIFRoZSBQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24gd2UncmUgbG9va2luZyBhdC5cbiAgICovXG4gIG1hdGNoZXMobjogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLCB0YzogdHMuVHlwZUNoZWNrZXIpIHtcbiAgICByZXR1cm4gbi5uYW1lLnRleHQgPT09IHRoaXMuYmFubmVkUHJvcGVydHkgJiZcbiAgICAgICAgdGhpcy50eXBlTWF0Y2hlcyh0Yy5nZXRUeXBlQXRMb2NhdGlvbihuLmV4cHJlc3Npb24pKTtcbiAgfVxuXG4gIHByaXZhdGUgZXhhY3RUeXBlTWF0Y2hlcyhpbnNwZWN0ZWRUeXBlOiB0cy5UeXBlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdHlwZVN5bWJvbCA9IGluc3BlY3RlZFR5cGUuZ2V0U3ltYm9sKCkgfHwgZmFsc2U7XG4gICAgcmV0dXJuIHR5cGVTeW1ib2wgJiYgdHlwZVN5bWJvbC5nZXROYW1lKCkgPT09IHRoaXMuYmFubmVkVHlwZTtcbiAgfVxuXG4gIC8vIFRPRE86IEFjY291bnQgZm9yIHVua25vd24gdHlwZXMvICc/JywgYW5kICdsb29zZSB0eXBlIG1hdGNoZXMnLCBpLmUuIGlmIHRoZVxuICAvLyBhY3R1YWwgdHlwZSBpcyBhIHN1cGVydHlwZSBvZiB0aGUgcHJvaGliaXRlZCB0eXBlLlxuICBwcml2YXRlIHR5cGVNYXRjaGVzKGluc3BlY3RlZFR5cGU6IHRzLlR5cGUpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5leGFjdFR5cGVNYXRjaGVzKGluc3BlY3RlZFR5cGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgYmFzZVR5cGVzID0gaW5zcGVjdGVkVHlwZS5nZXRCYXNlVHlwZXMoKSB8fCBbXTtcbiAgICByZXR1cm4gYmFzZVR5cGVzLnNvbWUoYmFzZSA9PiB0aGlzLmV4YWN0VHlwZU1hdGNoZXMoYmFzZSkpO1xuICB9XG59XG4iXX0=