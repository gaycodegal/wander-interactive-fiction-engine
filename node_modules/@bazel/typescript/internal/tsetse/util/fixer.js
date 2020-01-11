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
     * A simple Fixer builder based on a function that looks at a node, and
     * output either nothing, or a replacement. If this is too limiting, implement
     * Fixer instead.
     */
    function buildReplacementFixer(potentialReplacementGenerator) {
        return {
            getFixForFlaggedNode: (n) => {
                const partialFix = potentialReplacementGenerator(n);
                if (!partialFix) {
                    return;
                }
                return {
                    changes: [{
                            sourceFile: n.getSourceFile(),
                            start: n.getStart(),
                            end: n.getEnd(),
                            replacement: partialFix.replaceWith,
                        }],
                };
            }
        };
    }
    exports.buildReplacementFixer = buildReplacementFixer;
    // TODO(rjamet): Both maybeAddNamedImport and maybeAddNamespacedImport are too
    // hard to read to my taste. This could probably be improved upon by being more
    // functionnal, to show the filter passes and get rid of the continues and
    // returns (which are confusing).
    /**
     * Builds an IndividualChange that imports the required symbol from the given
     * file under the given name. This might reimport the same thing twice in some
     * cases, but it will always make it available under the right name (though
     * its name might collide with other imports, as we don't currently check for
     * that).
     */
    function maybeAddNamedImport(source, importWhat, fromFile, importAs, tazeComment) {
        const importStatements = source.statements.filter(ts.isImportDeclaration);
        const importSpecifier = importAs ? `${importWhat} as ${importAs}` : importWhat;
        for (const iDecl of importStatements) {
            const parsedDecl = maybeParseImportNode(iDecl);
            if (!parsedDecl || parsedDecl.fromFile !== fromFile) {
                // Not an import from the right file, or couldn't understand the import.
                continue; // Jump to the next import.
            }
            if (ts.isNamespaceImport(parsedDecl.namedBindings)) {
                ast_tools_1.debugLog(`... but it's a wildcard import`);
                continue; // Jump to the next import.
            }
            // Else, bindings is a NamedImports. We can now search whether the right
            // symbol is there under the right name.
            const foundRightImport = parsedDecl.namedBindings.elements.some(iSpec => iSpec.propertyName ?
                iSpec.name.getText() === importAs && // import {foo as bar}
                    iSpec.propertyName.getText() === importWhat :
                iSpec.name.getText() === importWhat); // import {foo}
            if (foundRightImport) {
                ast_tools_1.debugLog(`"${iDecl.getFullText()}" imports ${importWhat} as we want.`);
                return; // Our request is already imported under the right name.
            }
            // Else, insert our symbol in the list of imports from that file.
            ast_tools_1.debugLog(`No named imports from that file, generating new fix`);
            return {
                start: parsedDecl.namedBindings.elements[0].getStart(),
                end: parsedDecl.namedBindings.elements[0].getStart(),
                sourceFile: source,
                replacement: `${importSpecifier}, `,
            };
        }
        // If we get here, we didn't find anything imported from the wanted file, so
        // we'll need the full import string. Add it after the last import,
        // and let clang-format handle the rest.
        const newImportStatement = `import {${importSpecifier}} from '${fromFile}';` +
            (tazeComment ? `  ${tazeComment}\n` : `\n`);
        const insertionPosition = importStatements.length ?
            importStatements[importStatements.length - 1].getEnd() + 1 :
            0;
        return {
            start: insertionPosition,
            end: insertionPosition,
            sourceFile: source,
            replacement: newImportStatement,
        };
    }
    exports.maybeAddNamedImport = maybeAddNamedImport;
    /**
     * Builds an IndividualChange that imports the required namespace from the given
     * file under the given name. This might reimport the same thing twice in some
     * cases, but it will always make it available under the right name (though
     * its name might collide with other imports, as we don't currently check for
     * that).
     */
    function maybeAddNamespaceImport(source, fromFile, importAs, tazeComment) {
        const importStatements = source.statements.filter(ts.isImportDeclaration);
        const hasTheRightImport = importStatements.some(iDecl => {
            const parsedDecl = maybeParseImportNode(iDecl);
            if (!parsedDecl || parsedDecl.fromFile !== fromFile) {
                // Not an import from the right file, or couldn't understand the import.
                return false;
            }
            ast_tools_1.debugLog(`"${iDecl.getFullText()}" is an import from the right file`);
            if (ts.isNamedImports(parsedDecl.namedBindings)) {
                ast_tools_1.debugLog(`... but it's a named import`);
                return false; // irrelevant to our namespace imports
            }
            // Else, bindings is a NamespaceImport.
            if (parsedDecl.namedBindings.name.getText() !== importAs) {
                ast_tools_1.debugLog(`... but not the right name, we need to reimport`);
                return false;
            }
            ast_tools_1.debugLog(`... and the right name, no need to reimport`);
            return true;
        });
        if (!hasTheRightImport) {
            const insertionPosition = importStatements.length ?
                importStatements[importStatements.length - 1].getEnd() + 1 :
                0;
            return {
                start: insertionPosition,
                end: insertionPosition,
                sourceFile: source,
                replacement: tazeComment ?
                    `import * as ${importAs} from '${fromFile}';  ${tazeComment}\n` :
                    `import * as ${importAs} from '${fromFile}';\n`,
            };
        }
        return;
    }
    exports.maybeAddNamespaceImport = maybeAddNamespaceImport;
    /**
     * This tries to make sense of an ImportDeclaration, and returns the interesting
     * parts, undefined if the import declaration is valid but not understandable by
     * the checker.
     */
    function maybeParseImportNode(iDecl) {
        if (!iDecl.importClause) {
            // something like import "./file";
            ast_tools_1.debugLog(`Ignoring import without imported symbol: ${iDecl.getFullText()}`);
            return;
        }
        if (iDecl.importClause.name || !iDecl.importClause.namedBindings) {
            // Seems to happen in defaults imports like import Foo from 'Bar'.
            // Not much we can do with that when trying to get a hold of some symbols,
            // so just ignore that line (worst case, we'll suggest another import
            // style).
            ast_tools_1.debugLog(`Ignoring import: ${iDecl.getFullText()}`);
            return;
        }
        if (!ts.isStringLiteral(iDecl.moduleSpecifier)) {
            ast_tools_1.debugLog(`Ignoring import whose module specifier is not literal`);
            return;
        }
        return {
            namedBindings: iDecl.importClause.namedBindings,
            fromFile: iDecl.moduleSpecifier.text
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS91dGlsL2ZpeGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsaUNBQWlDO0lBRWpDLDJDQUFxQztJQVlyQzs7OztPQUlHO0lBQ0gsU0FBZ0IscUJBQXFCLENBQ2pDLDZCQUN1QztRQUN6QyxPQUFPO1lBQ0wsb0JBQW9CLEVBQUUsQ0FBQyxDQUFVLEVBQW1CLEVBQUU7Z0JBQ3BELE1BQU0sVUFBVSxHQUFHLDZCQUE2QixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsVUFBVSxFQUFFO29CQUNmLE9BQU87aUJBQ1I7Z0JBQ0QsT0FBTztvQkFDTCxPQUFPLEVBQUUsQ0FBQzs0QkFDUixVQUFVLEVBQUUsQ0FBQyxDQUFDLGFBQWEsRUFBRTs0QkFDN0IsS0FBSyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUU7NEJBQ25CLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFOzRCQUNmLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVzt5QkFDcEMsQ0FBQztpQkFDSCxDQUFDO1lBQ0osQ0FBQztTQUNGLENBQUM7SUFDSixDQUFDO0lBbkJELHNEQW1CQztJQUVELDhFQUE4RTtJQUM5RSwrRUFBK0U7SUFDL0UsMEVBQTBFO0lBQzFFLGlDQUFpQztJQUVqQzs7Ozs7O09BTUc7SUFDSCxTQUFnQixtQkFBbUIsQ0FDL0IsTUFBcUIsRUFBRSxVQUFrQixFQUFFLFFBQWdCLEVBQzNELFFBQWlCLEVBQUUsV0FBb0I7UUFDekMsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUMxRSxNQUFNLGVBQWUsR0FDakIsUUFBUSxDQUFDLENBQUMsQ0FB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QXdDQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQTJCO1FBSXZELElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFO1lBQ3ZCLGtDQUFrQztZQUNsQyxvQkFBUSxDQUFDLDRDQUE0QyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLE9BQU87U0FDUjtRQUNELElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRTtZQUNoRSxrRUFBa0U7WUFDbEUsMEVBQTBFO1lBQzFFLHFFQUFxRTtZQUNyRSxVQUFVO1lBQ1Ysb0JBQVEsQ0FBQyxvQkFBb0IsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRCxPQUFPO1NBQ1I7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDOUMsb0JBQVEsQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1lBQ2xFLE9BQU87U0FDUjtRQUNELE9BQU87WUFDTCxhQUFhLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhO1lBQy9DLFFBQVEsRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUk7U0FDckMsQ0FBQztJQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Rml4LCBJbmRpdmlkdWFsQ2hhbmdlfSBmcm9tICcuLi9mYWlsdXJlJztcbmltcG9ydCB7ZGVidWdMb2d9IGZyb20gJy4vYXN0X3Rvb2xzJztcblxuLyoqXG4gKiBBIEZpeGVyIHR1cm5zIE5vZGVzICh0aGF0IGFyZSBzdXBwb3NlZCB0byBoYXZlIGJlZW4gbWF0Y2hlZCBiZWZvcmUpIGludG8gYVxuICogRml4LiBUaGlzIGlzIG1lYW50IHRvIGJlIGltcGxlbWVudGVkIGJ5IFJ1bGUgaW1wbGVtZW50ZXJzIChvclxuICogYmFuLXByZXNldC1wYXR0ZXJuIHVzZXJzKS4gU2VlIGFsc28gYGJ1aWxkUmVwbGFjZW1lbnRGaXhlcmAgZm9yIGEgc2ltcGxlciB3YXlcbiAqIG9mIGltcGxlbWVudGluZyBhIEZpeGVyLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZpeGVyIHtcbiAgZ2V0Rml4Rm9yRmxhZ2dlZE5vZGUobm9kZTogdHMuTm9kZSk6IEZpeHx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQSBzaW1wbGUgRml4ZXIgYnVpbGRlciBiYXNlZCBvbiBhIGZ1bmN0aW9uIHRoYXQgbG9va3MgYXQgYSBub2RlLCBhbmRcbiAqIG91dHB1dCBlaXRoZXIgbm90aGluZywgb3IgYSByZXBsYWNlbWVudC4gSWYgdGhpcyBpcyB0b28gbGltaXRpbmcsIGltcGxlbWVudFxuICogRml4ZXIgaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVwbGFjZW1lbnRGaXhlcihcbiAgICBwb3RlbnRpYWxSZXBsYWNlbWVudEdlbmVyYXRvcjogKG5vZGU6IHRzLk5vZGUpID0+XG4gICAgICAgICh7cmVwbGFjZVdpdGg6IHN0cmluZ30gfCB1bmRlZmluZWQpKTogRml4ZXIge1xuICByZXR1cm4ge1xuICAgIGdldEZpeEZvckZsYWdnZWROb2RlOiAobjogdHMuTm9kZSk6IEZpeCB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICBjb25zdCBwYXJ0aWFsRml4ID0gcG90ZW50aWFsUmVwbGFjZW1lbnRHZW5lcmF0b3Iobik7XG4gICAgICBpZiAoIXBhcnRpYWxGaXgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhbmdlczogW3tcbiAgICAgICAgICBzb3VyY2VGaWxlOiBuLmdldFNvdXJjZUZpbGUoKSxcbiAgICAgICAgICBzdGFydDogbi5nZXRTdGFydCgpLFxuICAgICAgICAgIGVuZDogbi5nZXRFbmQoKSxcbiAgICAgICAgICByZXBsYWNlbWVudDogcGFydGlhbEZpeC5yZXBsYWNlV2l0aCxcbiAgICAgICAgfV0sXG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn1cblxuLy8gVE9ETyhyamFtZXQpOiBCb3RoIG1heWJlQWRkTmFtZWRJbXBvcnQgYW5kIG1heWJlQWRkTmFtZXNwYWNlZEltcG9ydCBhcmUgdG9vXG4vLyBoYXJkIHRvIHJlYWQgdG8gbXkgdGFzdGUuIFRoaXMgY291bGQgcHJvYmFibHkgYmUgaW1wcm92ZWQgdXBvbiBieSBiZWluZyBtb3JlXG4vLyBmdW5jdGlvbm5hbCwgdG8gc2hvdyB0aGUgZmlsdGVyIHBhc3NlcyBhbmQgZ2V0IHJpZCBvZiB0aGUgY29udGludWVzIGFuZFxuLy8gcmV0dXJucyAod2hpY2ggYXJlIGNvbmZ1c2luZykuXG5cbi8qKlxuICogQnVpbGRzIGFuIEluZGl2aWR1YWxDaGFuZ2UgdGhhdCBpbXBvcnRzIHRoZSByZXF1aXJlZCBzeW1ib2wgZnJvbSB0aGUgZ2l2ZW5cbiAqIGZpbGUgdW5kZXIgdGhlIGdpdmVuIG5hbWUuIFRoaXMgbWlnaHQgcmVpbXBvcnQgdGhlIHNhbWUgdGhpbmcgdHdpY2UgaW4gc29tZVxuICogY2FzZXMsIGJ1dCBpdCB3aWxsIGFsd2F5cyBtYWtlIGl0IGF2YWlsYWJsZSB1bmRlciB0aGUgcmlnaHQgbmFtZSAodGhvdWdoXG4gKiBpdHMgbmFtZSBtaWdodCBjb2xsaWRlIHdpdGggb3RoZXIgaW1wb3J0cywgYXMgd2UgZG9uJ3QgY3VycmVudGx5IGNoZWNrIGZvclxuICogdGhhdCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXliZUFkZE5hbWVkSW1wb3J0KFxuICAgIHNvdXJjZTogdHMuU291cmNlRmlsZSwgaW1wb3J0V2hhdDogc3RyaW5nLCBmcm9tRmlsZTogc3RyaW5nLFxuICAgIGltcG9ydEFzPzogc3RyaW5nLCB0YXplQ29tbWVudD86IHN0cmluZyk6IEluZGl2aWR1YWxDaGFuZ2V8dW5kZWZpbmVkIHtcbiAgY29uc3QgaW1wb3J0U3RhdGVtZW50cyA9IHNvdXJjZS5zdGF0ZW1lbnRzLmZpbHRlcih0cy5pc0ltcG9ydERlY2xhcmF0aW9uKTtcbiAgY29uc3QgaW1wb3J0U3BlY2lmaWVyID1cbiAgICAgIGltcG9ydEFzID8gYCR7aW1wb3J0V2hhdH0gYXMgJHtpbXBvcnRBc31gIDogaW1wb3J0V2hhdDtcblxuICBmb3IgKGNvbnN0IGlEZWNsIG9mIGltcG9ydFN0YXRlbWVudHMpIHtcbiAgICBjb25zdCBwYXJzZWREZWNsID0gbWF5YmVQYXJzZUltcG9ydE5vZGUoaURlY2wpO1xuICAgIGlmICghcGFyc2VkRGVjbCB8fCBwYXJzZWREZWNsLmZyb21GaWxlICE9PSBmcm9tRmlsZSkge1xuICAgICAgLy8gTm90IGFuIGltcG9ydCBmcm9tIHRoZSByaWdodCBmaWxlLCBvciBjb3VsZG4ndCB1bmRlcnN0YW5kIHRoZSBpbXBvcnQuXG4gICAgICBjb250aW51ZTsgIC8vIEp1bXAgdG8gdGhlIG5leHQgaW1wb3J0LlxuICAgIH1cbiAgICBpZiAodHMuaXNOYW1lc3BhY2VJbXBvcnQocGFyc2VkRGVjbC5uYW1lZEJpbmRpbmdzKSkge1xuICAgICAgZGVidWdMb2coYC4uLiBidXQgaXQncyBhIHdpbGRjYXJkIGltcG9ydGApO1xuICAgICAgY29udGludWU7ICAvLyBKdW1wIHRvIHRoZSBuZXh0IGltcG9ydC5cbiAgICB9XG5cbiAgICAvLyBFbHNlLCBiaW5kaW5ncyBpcyBhIE5hbWVkSW1wb3J0cy4gV2UgY2FuIG5vdyBzZWFyY2ggd2hldGhlciB0aGUgcmlnaHRcbiAgICAvLyBzeW1ib2wgaXMgdGhlcmUgdW5kZXIgdGhlIHJpZ2h0IG5hbWUuXG4gICAgY29uc3QgZm91bmRSaWdodEltcG9ydCA9IHBhcnNlZERlY2wubmFtZWRCaW5kaW5ncy5lbGVtZW50cy5zb21lKFxuICAgICAgICBpU3BlYyA9PiBpU3BlYy5wcm9wZXJ0eU5hbWUgP1xuICAgICAgICAgICAgaVNwZWMubmFtZS5nZXRUZXh0KCkgPT09IGltcG9ydEFzICYmICAvLyBpbXBvcnQge2ZvbyBhcyBiYXJ9XG4gICAgICAgICAgICAgICAgaVNwZWMucHJvcGVydHlOYW1lLmdldFRleHQoKSA9PT0gaW1wb3J0V2hhdCA6XG4gICAgICAgICAgICBpU3BlYy5uYW1lLmdldFRleHQoKSA9PT0gaW1wb3J0V2hhdCk7ICAvLyBpbXBvcnQge2Zvb31cblxuICAgIGlmIChmb3VuZFJpZ2h0SW1wb3J0KSB7XG4gICAgICBkZWJ1Z0xvZyhgXCIke2lEZWNsLmdldEZ1bGxUZXh0KCl9XCIgaW1wb3J0cyAke2ltcG9ydFdoYXR9IGFzIHdlIHdhbnQuYCk7XG4gICAgICByZXR1cm47ICAvLyBPdXIgcmVxdWVzdCBpcyBhbHJlYWR5IGltcG9ydGVkIHVuZGVyIHRoZSByaWdodCBuYW1lLlxuICAgIH1cblxuICAgIC8vIEVsc2UsIGluc2VydCBvdXIgc3ltYm9sIGluIHRoZSBsaXN0IG9mIGltcG9ydHMgZnJvbSB0aGF0IGZpbGUuXG4gICAgZGVidWdMb2coYE5vIG5hbWVkIGltcG9ydHMgZnJvbSB0aGF0IGZpbGUsIGdlbmVyYXRpbmcgbmV3IGZpeGApO1xuICAgIHJldHVybiB7XG4gICAgICBzdGFydDogcGFyc2VkRGVjbC5uYW1lZEJpbmRpbmdzLmVsZW1lbnRzWzBdLmdldFN0YXJ0KCksXG4gICAgICBlbmQ6IHBhcnNlZERlY2wubmFtZWRCaW5kaW5ncy5lbGVtZW50c1swXS5nZXRTdGFydCgpLFxuICAgICAgc291cmNlRmlsZTogc291cmNlLFxuICAgICAgcmVwbGFjZW1lbnQ6IGAke2ltcG9ydFNwZWNpZmllcn0sIGAsXG4gICAgfTtcbiAgfVxuXG4gIC8vIElmIHdlIGdldCBoZXJlLCB3ZSBkaWRuJ3QgZmluZCBhbnl0aGluZyBpbXBvcnRlZCBmcm9tIHRoZSB3YW50ZWQgZmlsZSwgc29cbiAgLy8gd2UnbGwgbmVlZCB0aGUgZnVsbCBpbXBvcnQgc3RyaW5nLiBBZGQgaXQgYWZ0ZXIgdGhlIGxhc3QgaW1wb3J0LFxuICAvLyBhbmQgbGV0IGNsYW5nLWZvcm1hdCBoYW5kbGUgdGhlIHJlc3QuXG4gIGNvbnN0IG5ld0ltcG9ydFN0YXRlbWVudCA9IGBpbXBvcnQgeyR7aW1wb3J0U3BlY2lmaWVyfX0gZnJvbSAnJHtmcm9tRmlsZX0nO2AgK1xuICAgICAgKHRhemVDb21tZW50ID8gYCAgJHt0YXplQ29tbWVudH1cXG5gIDogYFxcbmApO1xuICBjb25zdCBpbnNlcnRpb25Qb3NpdGlvbiA9IGltcG9ydFN0YXRlbWVudHMubGVuZ3RoID9cbiAgICAgIGltcG9ydFN0YXRlbWVudHNbaW1wb3J0U3RhdGVtZW50cy5sZW5ndGggLSAxXS5nZXRFbmQoKSArIDEgOlxuICAgICAgMDtcbiAgcmV0dXJuIHtcbiAgICBzdGFydDogaW5zZXJ0aW9uUG9zaXRpb24sXG4gICAgZW5kOiBpbnNlcnRpb25Qb3NpdGlvbixcbiAgICBzb3VyY2VGaWxlOiBzb3VyY2UsXG4gICAgcmVwbGFjZW1lbnQ6IG5ld0ltcG9ydFN0YXRlbWVudCxcbiAgfTtcbn1cblxuLyoqXG4gKiBCdWlsZHMgYW4gSW5kaXZpZHVhbENoYW5nZSB0aGF0IGltcG9ydHMgdGhlIHJlcXVpcmVkIG5hbWVzcGFjZSBmcm9tIHRoZSBnaXZlblxuICogZmlsZSB1bmRlciB0aGUgZ2l2ZW4gbmFtZS4gVGhpcyBtaWdodCByZWltcG9ydCB0aGUgc2FtZSB0aGluZyB0d2ljZSBpbiBzb21lXG4gKiBjYXNlcywgYnV0IGl0IHdpbGwgYWx3YXlzIG1ha2UgaXQgYXZhaWxhYmxlIHVuZGVyIHRoZSByaWdodCBuYW1lICh0aG91Z2hcbiAqIGl0cyBuYW1lIG1pZ2h0IGNvbGxpZGUgd2l0aCBvdGhlciBpbXBvcnRzLCBhcyB3ZSBkb24ndCBjdXJyZW50bHkgY2hlY2sgZm9yXG4gKiB0aGF0KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1heWJlQWRkTmFtZXNwYWNlSW1wb3J0KFxuICAgIHNvdXJjZTogdHMuU291cmNlRmlsZSwgZnJvbUZpbGU6IHN0cmluZywgaW1wb3J0QXM6IHN0cmluZyxcbiAgICB0YXplQ29tbWVudD86IHN0cmluZyk6IEluZGl2aWR1YWxDaGFuZ2V8dW5kZWZpbmVkIHtcbiAgY29uc3QgaW1wb3J0U3RhdGVtZW50cyA9IHNvdXJjZS5zdGF0ZW1lbnRzLmZpbHRlcih0cy5pc0ltcG9ydERlY2xhcmF0aW9uKTtcblxuICBjb25zdCBoYXNUaGVSaWdodEltcG9ydCA9IGltcG9ydFN0YXRlbWVudHMuc29tZShpRGVjbCA9PiB7XG4gICAgY29uc3QgcGFyc2VkRGVjbCA9IG1heWJlUGFyc2VJbXBvcnROb2RlKGlEZWNsKTtcbiAgICBpZiAoIXBhcnNlZERlY2wgfHwgcGFyc2VkRGVjbC5mcm9tRmlsZSAhPT0gZnJvbUZpbGUpIHtcbiAgICAgIC8vIE5vdCBhbiBpbXBvcnQgZnJvbSB0aGUgcmlnaHQgZmlsZSwgb3IgY291bGRuJ3QgdW5kZXJzdGFuZCB0aGUgaW1wb3J0LlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBkZWJ1Z0xvZyhgXCIke2lEZWNsLmdldEZ1bGxUZXh0KCl9XCIgaXMgYW4gaW1wb3J0IGZyb20gdGhlIHJpZ2h0IGZpbGVgKTtcblxuICAgIGlmICh0cy5pc05hbWVkSW1wb3J0cyhwYXJzZWREZWNsLm5hbWVkQmluZGluZ3MpKSB7XG4gICAgICBkZWJ1Z0xvZyhgLi4uIGJ1dCBpdCdzIGEgbmFtZWQgaW1wb3J0YCk7XG4gICAgICByZXR1cm4gZmFsc2U7ICAvLyBpcnJlbGV2YW50IHRvIG91ciBuYW1lc3BhY2UgaW1wb3J0c1xuICAgIH1cbiAgICAvLyBFbHNlLCBiaW5kaW5ncyBpcyBhIE5hbWVzcGFjZUltcG9ydC5cbiAgICBpZiAocGFyc2VkRGVjbC5uYW1lZEJpbmRpbmdzLm5hbWUuZ2V0VGV4dCgpICE9PSBpbXBvcnRBcykge1xuICAgICAgZGVidWdMb2coYC4uLiBidXQgbm90IHRoZSByaWdodCBuYW1lLCB3ZSBuZWVkIHRvIHJlaW1wb3J0YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGRlYnVnTG9nKGAuLi4gYW5kIHRoZSByaWdodCBuYW1lLCBubyBuZWVkIHRvIHJlaW1wb3J0YCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIGlmICghaGFzVGhlUmlnaHRJbXBvcnQpIHtcbiAgICBjb25zdCBpbnNlcnRpb25Qb3NpdGlvbiA9IGltcG9ydFN0YXRlbWVudHMubGVuZ3RoID9cbiAgICAgICAgaW1wb3J0U3RhdGVtZW50c1tpbXBvcnRTdGF0ZW1lbnRzLmxlbmd0aCAtIDFdLmdldEVuZCgpICsgMSA6XG4gICAgICAgIDA7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXJ0OiBpbnNlcnRpb25Qb3NpdGlvbixcbiAgICAgIGVuZDogaW5zZXJ0aW9uUG9zaXRpb24sXG4gICAgICBzb3VyY2VGaWxlOiBzb3VyY2UsXG4gICAgICByZXBsYWNlbWVudDogdGF6ZUNvbW1lbnQgP1xuICAgICAgICAgIGBpbXBvcnQgKiBhcyAke2ltcG9ydEFzfSBmcm9tICcke2Zyb21GaWxlfSc7ICAke3RhemVDb21tZW50fVxcbmAgOlxuICAgICAgICAgIGBpbXBvcnQgKiBhcyAke2ltcG9ydEFzfSBmcm9tICcke2Zyb21GaWxlfSc7XFxuYCxcbiAgICB9O1xuICB9XG4gIHJldHVybjtcbn1cblxuLyoqXG4gKiBUaGlzIHRyaWVzIHRvIG1ha2Ugc2Vuc2Ugb2YgYW4gSW1wb3J0RGVjbGFyYXRpb24sIGFuZCByZXR1cm5zIHRoZSBpbnRlcmVzdGluZ1xuICogcGFydHMsIHVuZGVmaW5lZCBpZiB0aGUgaW1wb3J0IGRlY2xhcmF0aW9uIGlzIHZhbGlkIGJ1dCBub3QgdW5kZXJzdGFuZGFibGUgYnlcbiAqIHRoZSBjaGVja2VyLlxuICovXG5mdW5jdGlvbiBtYXliZVBhcnNlSW1wb3J0Tm9kZShpRGVjbDogdHMuSW1wb3J0RGVjbGFyYXRpb24pOiB7XG4gIG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0QmluZGluZ3N8dHMuTmFtZXNwYWNlSW1wb3J0LFxuICBmcm9tRmlsZTogc3RyaW5nXG59fHVuZGVmaW5lZCB7XG4gIGlmICghaURlY2wuaW1wb3J0Q2xhdXNlKSB7XG4gICAgLy8gc29tZXRoaW5nIGxpa2UgaW1wb3J0IFwiLi9maWxlXCI7XG4gICAgZGVidWdMb2coYElnbm9yaW5nIGltcG9ydCB3aXRob3V0IGltcG9ydGVkIHN5bWJvbDogJHtpRGVjbC5nZXRGdWxsVGV4dCgpfWApO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoaURlY2wuaW1wb3J0Q2xhdXNlLm5hbWUgfHwgIWlEZWNsLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzKSB7XG4gICAgLy8gU2VlbXMgdG8gaGFwcGVuIGluIGRlZmF1bHRzIGltcG9ydHMgbGlrZSBpbXBvcnQgRm9vIGZyb20gJ0JhcicuXG4gICAgLy8gTm90IG11Y2ggd2UgY2FuIGRvIHdpdGggdGhhdCB3aGVuIHRyeWluZyB0byBnZXQgYSBob2xkIG9mIHNvbWUgc3ltYm9scyxcbiAgICAvLyBzbyBqdXN0IGlnbm9yZSB0aGF0IGxpbmUgKHdvcnN0IGNhc2UsIHdlJ2xsIHN1Z2dlc3QgYW5vdGhlciBpbXBvcnRcbiAgICAvLyBzdHlsZSkuXG4gICAgZGVidWdMb2coYElnbm9yaW5nIGltcG9ydDogJHtpRGVjbC5nZXRGdWxsVGV4dCgpfWApO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIXRzLmlzU3RyaW5nTGl0ZXJhbChpRGVjbC5tb2R1bGVTcGVjaWZpZXIpKSB7XG4gICAgZGVidWdMb2coYElnbm9yaW5nIGltcG9ydCB3aG9zZSBtb2R1bGUgc3BlY2lmaWVyIGlzIG5vdCBsaXRlcmFsYCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZWRCaW5kaW5nczogaURlY2wuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MsXG4gICAgZnJvbUZpbGU6IGlEZWNsLm1vZHVsZVNwZWNpZmllci50ZXh0XG4gIH07XG59XG4iXX0=