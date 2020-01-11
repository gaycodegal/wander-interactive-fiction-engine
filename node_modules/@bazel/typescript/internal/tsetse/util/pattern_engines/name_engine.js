(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "../../error_code", "../ast_tools", "../match_symbol", "./pattern_engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const error_code_1 = require("../../error_code");
    const ast_tools_1 = require("../ast_tools");
    const match_symbol_1 = require("../match_symbol");
    const pattern_engine_1 = require("./pattern_engine");
    class NameEngine extends pattern_engine_1.PatternEngine {
        constructor(config, fixer) {
            super(config, fixer);
            // TODO: Support more than one single value here, or even build a
            // multi-pattern engine. This would help for performance.
            if (this.config.values.length !== 1) {
                throw new Error(`BANNED_NAME expects one value, got(${this.config.values.join(',')})`);
            }
            this.matcher = new match_symbol_1.AbsoluteMatcher(this.config.values[0]);
        }
        register(checker) {
            checker.on(ts.SyntaxKind.Identifier, this.checkAndFilterResults.bind(this), error_code_1.ErrorCode.CONFORMANCE_PATTERN);
        }
        check(tc, n) {
            if (!ast_tools_1.shouldExamineNode(n) || n.getSourceFile().isDeclarationFile) {
                return;
            }
            ast_tools_1.debugLog(`inspecting ${n.getText().trim()}`);
            if (!this.matcher.matches(n, tc)) {
                ast_tools_1.debugLog('Not the right global name.');
                return;
            }
            return n;
        }
    }
    exports.NameEngine = NameEngine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZV9lbmdpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS91dGlsL3BhdHRlcm5fZW5naW5lcy9uYW1lX2VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLGlDQUFpQztJQUVqQyxpREFBMkM7SUFDM0MsNENBQXlEO0lBRXpELGtEQUFnRDtJQUVoRCxxREFBK0M7SUFFL0MsTUFBYSxVQUFXLFNBQVEsOEJBQWE7UUFFM0MsWUFBWSxNQUFjLEVBQUUsS0FBYTtZQUN2QyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLGlFQUFpRTtZQUNqRSx5REFBeUQ7WUFDekQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLHNDQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDdEM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksOEJBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxRQUFRLENBQUMsT0FBZ0I7WUFDdkIsT0FBTyxDQUFDLEVBQUUsQ0FDTixFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUMvRCxzQkFBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELEtBQUssQ0FBQyxFQUFrQixFQUFFLENBQVU7WUFDbEMsSUFBSSxDQUFDLDZCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtnQkFDaEUsT0FBTzthQUNSO1lBQ0Qsb0JBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDaEMsb0JBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUN2QyxPQUFPO2FBQ1I7WUFDRCxPQUFPLENBQUMsQ0FBQztRQUNYLENBQUM7S0FDRjtJQTlCRCxnQ0E4QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Q2hlY2tlcn0gZnJvbSAnLi4vLi4vY2hlY2tlcic7XG5pbXBvcnQge0Vycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JfY29kZSc7XG5pbXBvcnQge2RlYnVnTG9nLCBzaG91bGRFeGFtaW5lTm9kZX0gZnJvbSAnLi4vYXN0X3Rvb2xzJztcbmltcG9ydCB7Rml4ZXJ9IGZyb20gJy4uL2ZpeGVyJztcbmltcG9ydCB7QWJzb2x1dGVNYXRjaGVyfSBmcm9tICcuLi9tYXRjaF9zeW1ib2wnO1xuaW1wb3J0IHtDb25maWd9IGZyb20gJy4uL3BhdHRlcm5fY29uZmlnJztcbmltcG9ydCB7UGF0dGVybkVuZ2luZX0gZnJvbSAnLi9wYXR0ZXJuX2VuZ2luZSc7XG5cbmV4cG9ydCBjbGFzcyBOYW1lRW5naW5lIGV4dGVuZHMgUGF0dGVybkVuZ2luZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbWF0Y2hlcjogQWJzb2x1dGVNYXRjaGVyO1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZywgZml4ZXI/OiBGaXhlcikge1xuICAgIHN1cGVyKGNvbmZpZywgZml4ZXIpO1xuICAgIC8vIFRPRE86IFN1cHBvcnQgbW9yZSB0aGFuIG9uZSBzaW5nbGUgdmFsdWUgaGVyZSwgb3IgZXZlbiBidWlsZCBhXG4gICAgLy8gbXVsdGktcGF0dGVybiBlbmdpbmUuIFRoaXMgd291bGQgaGVscCBmb3IgcGVyZm9ybWFuY2UuXG4gICAgaWYgKHRoaXMuY29uZmlnLnZhbHVlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQkFOTkVEX05BTUUgZXhwZWN0cyBvbmUgdmFsdWUsIGdvdCgke1xuICAgICAgICAgIHRoaXMuY29uZmlnLnZhbHVlcy5qb2luKCcsJyl9KWApO1xuICAgIH1cbiAgICB0aGlzLm1hdGNoZXIgPSBuZXcgQWJzb2x1dGVNYXRjaGVyKHRoaXMuY29uZmlnLnZhbHVlc1swXSk7XG4gIH1cblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5JZGVudGlmaWVyLCB0aGlzLmNoZWNrQW5kRmlsdGVyUmVzdWx0cy5iaW5kKHRoaXMpLFxuICAgICAgICBFcnJvckNvZGUuQ09ORk9STUFOQ0VfUEFUVEVSTik7XG4gIH1cblxuICBjaGVjayh0YzogdHMuVHlwZUNoZWNrZXIsIG46IHRzLk5vZGUpOiB0cy5Ob2RlfHVuZGVmaW5lZCB7XG4gICAgaWYgKCFzaG91bGRFeGFtaW5lTm9kZShuKSB8fCBuLmdldFNvdXJjZUZpbGUoKS5pc0RlY2xhcmF0aW9uRmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWJ1Z0xvZyhgaW5zcGVjdGluZyAke24uZ2V0VGV4dCgpLnRyaW0oKX1gKTtcbiAgICBpZiAoIXRoaXMubWF0Y2hlci5tYXRjaGVzKG4sIHRjKSkge1xuICAgICAgZGVidWdMb2coJ05vdCB0aGUgcmlnaHQgZ2xvYmFsIG5hbWUuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBuO1xuICB9XG59XG4iXX0=