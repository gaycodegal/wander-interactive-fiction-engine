(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "../error_code", "../rule"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const error_code_1 = require("../error_code");
    const rule_1 = require("../rule");
    /**
     * A Tsetse rule that checks for some potential unsafe property renaming
     * patterns.
     *
     * Note: This rule can have false positives.
     */
    class Rule extends rule_1.AbstractRule {
        constructor() {
            super(...arguments);
            this.ruleName = 'property-renaming-safe';
            this.code = error_code_1.ErrorCode.PROPERTY_RENAMING_SAFE;
        }
        register(checker) {
            checker.on(ts.SyntaxKind.PropertyAccessExpression, checkIndexSignAccessedWithPropAccess, this.code);
        }
    }
    exports.Rule = Rule;
    // Copied from tsickle/src/quoting_transformer.ts, with the intention of
    // removing it from there and only keeping a tsetse rule about this.
    function checkIndexSignAccessedWithPropAccess(checker, pae) {
        // Reject dotted accesses to types that have an index type declared to quoted
        // accesses, to avoid Closure renaming one access but not the other. This can
        // happen because TS allows dotted access to string index types.
        const typeChecker = checker.typeChecker;
        const t = typeChecker.getTypeAtLocation(pae.expression);
        if (!t.getStringIndexType())
            return;
        // Types can have string index signatures and declared properties (of the
        // matching type). These properties have a symbol, as opposed to pure string
        // index types.
        const propSym = typeChecker.getSymbolAtLocation(pae.name);
        // The decision to return below is a judgement call. Presumably, in most
        // situations, dotted access to a property is correct, and should not be
        // turned into quoted access even if there is a string index on the type.
        // However it is possible to construct programs where this is incorrect, e.g.
        // where user code assigns into a property through the index access in another
        // location.
        if (propSym)
            return;
        checker.addFailureAtNode(pae.name, `Property ${pae.name.text} is not declared on Type ` +
            `${typeChecker.typeToString(t)}. The type has a string index ` +
            `signature, but it is being accessed using a dotted property ` +
            `access.
See http://tsetse.info/property-renaming-safe.`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfcmVuYW1pbmdfc2FmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL3J1bGVzL3Byb3BlcnR5X3JlbmFtaW5nX3NhZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFDQSxpQ0FBaUM7SUFHakMsOENBQXdDO0lBQ3hDLGtDQUFxQztJQUVyQzs7Ozs7T0FLRztJQUNILE1BQWEsSUFBSyxTQUFRLG1CQUFZO1FBQXRDOztZQUNXLGFBQVEsR0FBRyx3QkFBd0IsQ0FBQztZQUNwQyxTQUFJLEdBQUcsc0JBQVMsQ0FBQyxzQkFBc0IsQ0FBQztRQU9uRCxDQUFDO1FBTEMsUUFBUSxDQUFDLE9BQWdCO1lBQ3ZCLE9BQU8sQ0FBQyxFQUFFLENBQ04sRUFBRSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsRUFDdEMsb0NBQW9DLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZELENBQUM7S0FDRjtJQVRELG9CQVNDO0lBRUQsd0VBQXdFO0lBQ3hFLG9FQUFvRTtJQUNwRSxTQUFTLG9DQUFvQyxDQUN6QyxPQUFnQixFQUFFLEdBQWdDO1FBQ3BELDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsZ0VBQWdFO1FBQ2hFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDeEMsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixFQUFFO1lBQUUsT0FBTztRQUNwQyx5RUFBeUU7UUFDekUsNEVBQTRFO1FBQzVFLGVBQWU7UUFDZixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFELHdFQUF3RTtRQUN4RSx3RUFBd0U7UUFDeEUseUVBQXlFO1FBQ3pFLDZFQUE2RTtRQUM3RSw4RUFBOEU7UUFDOUUsWUFBWTtRQUNaLElBQUksT0FBTztZQUFFLE9BQU87UUFFcEIsT0FBTyxDQUFDLGdCQUFnQixDQUNwQixHQUFHLENBQUMsSUFBSSxFQUNSLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLDJCQUEyQjtZQUNoRCxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGdDQUFnQztZQUM5RCw4REFBOEQ7WUFDOUQ7K0NBQ3FDLENBQUMsQ0FBQztJQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDaGVja2VyfSBmcm9tICcuLi9jaGVja2VyJztcbmltcG9ydCB7RXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcl9jb2RlJztcbmltcG9ydCB7QWJzdHJhY3RSdWxlfSBmcm9tICcuLi9ydWxlJztcblxuLyoqXG4gKiBBIFRzZXRzZSBydWxlIHRoYXQgY2hlY2tzIGZvciBzb21lIHBvdGVudGlhbCB1bnNhZmUgcHJvcGVydHkgcmVuYW1pbmdcbiAqIHBhdHRlcm5zLlxuICpcbiAqIE5vdGU6IFRoaXMgcnVsZSBjYW4gaGF2ZSBmYWxzZSBwb3NpdGl2ZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSdWxlIGV4dGVuZHMgQWJzdHJhY3RSdWxlIHtcbiAgcmVhZG9ubHkgcnVsZU5hbWUgPSAncHJvcGVydHktcmVuYW1pbmctc2FmZSc7XG4gIHJlYWRvbmx5IGNvZGUgPSBFcnJvckNvZGUuUFJPUEVSVFlfUkVOQU1JTkdfU0FGRTtcblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24sXG4gICAgICAgIGNoZWNrSW5kZXhTaWduQWNjZXNzZWRXaXRoUHJvcEFjY2VzcywgdGhpcy5jb2RlKTtcbiAgfVxufVxuXG4vLyBDb3BpZWQgZnJvbSB0c2lja2xlL3NyYy9xdW90aW5nX3RyYW5zZm9ybWVyLnRzLCB3aXRoIHRoZSBpbnRlbnRpb24gb2Zcbi8vIHJlbW92aW5nIGl0IGZyb20gdGhlcmUgYW5kIG9ubHkga2VlcGluZyBhIHRzZXRzZSBydWxlIGFib3V0IHRoaXMuXG5mdW5jdGlvbiBjaGVja0luZGV4U2lnbkFjY2Vzc2VkV2l0aFByb3BBY2Nlc3MoXG4gICAgY2hlY2tlcjogQ2hlY2tlciwgcGFlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgLy8gUmVqZWN0IGRvdHRlZCBhY2Nlc3NlcyB0byB0eXBlcyB0aGF0IGhhdmUgYW4gaW5kZXggdHlwZSBkZWNsYXJlZCB0byBxdW90ZWRcbiAgLy8gYWNjZXNzZXMsIHRvIGF2b2lkIENsb3N1cmUgcmVuYW1pbmcgb25lIGFjY2VzcyBidXQgbm90IHRoZSBvdGhlci4gVGhpcyBjYW5cbiAgLy8gaGFwcGVuIGJlY2F1c2UgVFMgYWxsb3dzIGRvdHRlZCBhY2Nlc3MgdG8gc3RyaW5nIGluZGV4IHR5cGVzLlxuICBjb25zdCB0eXBlQ2hlY2tlciA9IGNoZWNrZXIudHlwZUNoZWNrZXI7XG4gIGNvbnN0IHQgPSB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihwYWUuZXhwcmVzc2lvbik7XG4gIGlmICghdC5nZXRTdHJpbmdJbmRleFR5cGUoKSkgcmV0dXJuO1xuICAvLyBUeXBlcyBjYW4gaGF2ZSBzdHJpbmcgaW5kZXggc2lnbmF0dXJlcyBhbmQgZGVjbGFyZWQgcHJvcGVydGllcyAob2YgdGhlXG4gIC8vIG1hdGNoaW5nIHR5cGUpLiBUaGVzZSBwcm9wZXJ0aWVzIGhhdmUgYSBzeW1ib2wsIGFzIG9wcG9zZWQgdG8gcHVyZSBzdHJpbmdcbiAgLy8gaW5kZXggdHlwZXMuXG4gIGNvbnN0IHByb3BTeW0gPSB0eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKHBhZS5uYW1lKTtcbiAgLy8gVGhlIGRlY2lzaW9uIHRvIHJldHVybiBiZWxvdyBpcyBhIGp1ZGdlbWVudCBjYWxsLiBQcmVzdW1hYmx5LCBpbiBtb3N0XG4gIC8vIHNpdHVhdGlvbnMsIGRvdHRlZCBhY2Nlc3MgdG8gYSBwcm9wZXJ0eSBpcyBjb3JyZWN0LCBhbmQgc2hvdWxkIG5vdCBiZVxuICAvLyB0dXJuZWQgaW50byBxdW90ZWQgYWNjZXNzIGV2ZW4gaWYgdGhlcmUgaXMgYSBzdHJpbmcgaW5kZXggb24gdGhlIHR5cGUuXG4gIC8vIEhvd2V2ZXIgaXQgaXMgcG9zc2libGUgdG8gY29uc3RydWN0IHByb2dyYW1zIHdoZXJlIHRoaXMgaXMgaW5jb3JyZWN0LCBlLmcuXG4gIC8vIHdoZXJlIHVzZXIgY29kZSBhc3NpZ25zIGludG8gYSBwcm9wZXJ0eSB0aHJvdWdoIHRoZSBpbmRleCBhY2Nlc3MgaW4gYW5vdGhlclxuICAvLyBsb2NhdGlvbi5cbiAgaWYgKHByb3BTeW0pIHJldHVybjtcblxuICBjaGVja2VyLmFkZEZhaWx1cmVBdE5vZGUoXG4gICAgICBwYWUubmFtZSxcbiAgICAgIGBQcm9wZXJ0eSAke3BhZS5uYW1lLnRleHR9IGlzIG5vdCBkZWNsYXJlZCBvbiBUeXBlIGAgK1xuICAgICAgICAgIGAke3R5cGVDaGVja2VyLnR5cGVUb1N0cmluZyh0KX0uIFRoZSB0eXBlIGhhcyBhIHN0cmluZyBpbmRleCBgICtcbiAgICAgICAgICBgc2lnbmF0dXJlLCBidXQgaXQgaXMgYmVpbmcgYWNjZXNzZWQgdXNpbmcgYSBkb3R0ZWQgcHJvcGVydHkgYCArXG4gICAgICAgICAgYGFjY2Vzcy5cblNlZSBodHRwOi8vdHNldHNlLmluZm8vcHJvcGVydHktcmVuYW1pbmctc2FmZS5gKTtcbn1cbiJdfQ==