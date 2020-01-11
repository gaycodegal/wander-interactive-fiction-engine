(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "../../error_code", "../ast_tools", "../match_symbol", "../pattern_engines/pattern_engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const error_code_1 = require("../../error_code");
    const ast_tools_1 = require("../ast_tools");
    const match_symbol_1 = require("../match_symbol");
    const pattern_engine_1 = require("../pattern_engines/pattern_engine");
    /**
     * The engine for BANNED_PROPERTY_WRITE.
     */
    class PropertyWriteEngine extends pattern_engine_1.PatternEngine {
        constructor(config, fixer) {
            super(config, fixer);
            // TODO: Support more than one single value here, or even build a
            // multi-pattern engine. This would help for performance.
            if (this.config.values.length !== 1) {
                throw new Error(`BANNED_PROPERTY_WRITE expects one value, got(${this.config.values.join(',')})`);
            }
            this.matcher = match_symbol_1.PropertyMatcher.fromSpec(this.config.values[0]);
        }
        register(checker) {
            checker.on(ts.SyntaxKind.BinaryExpression, this.checkAndFilterResults.bind(this), error_code_1.ErrorCode.CONFORMANCE_PATTERN);
        }
        check(tc, n) {
            if (!ast_tools_1.isPropertyWriteExpression(n)) {
                return;
            }
            ast_tools_1.debugLog(`inspecting ${n.getText().trim()}`);
            if (!this.matcher.matches(n.left, tc)) {
                return;
            }
            ast_tools_1.debugLog(`Match. Reporting failure (boundaries: ${n.getStart()}, ${n.getEnd()}] on node [${n.getText()}]`);
            return n;
        }
    }
    exports.PropertyWriteEngine = PropertyWriteEngine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfd3JpdGVfZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvdXRpbC9wYXR0ZXJuX2VuZ2luZXMvcHJvcGVydHlfd3JpdGVfZW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsaUNBQWlDO0lBRWpDLGlEQUEyQztJQUMzQyw0Q0FBaUU7SUFFakUsa0RBQWdEO0lBRWhELHNFQUFnRTtJQUVoRTs7T0FFRztJQUNILE1BQWEsbUJBQW9CLFNBQVEsOEJBQWE7UUFFcEQsWUFBWSxNQUFjLEVBQUUsS0FBYTtZQUN2QyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLGlFQUFpRTtZQUNqRSx5REFBeUQ7WUFDekQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLGdEQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDdEM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLDhCQUFlLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUNOLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDckUsc0JBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxLQUFLLENBQUMsRUFBa0IsRUFBRSxDQUFVO1lBQ2xDLElBQUksQ0FBQyxxQ0FBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakMsT0FBTzthQUNSO1lBQ0Qsb0JBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3JDLE9BQU87YUFDUjtZQUNELG9CQUFRLENBQUMseUNBQXlDLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FDMUQsQ0FBQyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUMsT0FBTyxDQUFDLENBQUM7UUFDWCxDQUFDO0tBQ0Y7SUEvQkQsa0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0NoZWNrZXJ9IGZyb20gJy4uLy4uL2NoZWNrZXInO1xuaW1wb3J0IHtFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9yX2NvZGUnO1xuaW1wb3J0IHtkZWJ1Z0xvZywgaXNQcm9wZXJ0eVdyaXRlRXhwcmVzc2lvbn0gZnJvbSAnLi4vYXN0X3Rvb2xzJztcbmltcG9ydCB7Rml4ZXJ9IGZyb20gJy4uL2ZpeGVyJztcbmltcG9ydCB7UHJvcGVydHlNYXRjaGVyfSBmcm9tICcuLi9tYXRjaF9zeW1ib2wnO1xuaW1wb3J0IHtDb25maWd9IGZyb20gJy4uL3BhdHRlcm5fY29uZmlnJztcbmltcG9ydCB7UGF0dGVybkVuZ2luZX0gZnJvbSAnLi4vcGF0dGVybl9lbmdpbmVzL3BhdHRlcm5fZW5naW5lJztcblxuLyoqXG4gKiBUaGUgZW5naW5lIGZvciBCQU5ORURfUFJPUEVSVFlfV1JJVEUuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eVdyaXRlRW5naW5lIGV4dGVuZHMgUGF0dGVybkVuZ2luZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbWF0Y2hlcjogUHJvcGVydHlNYXRjaGVyO1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZywgZml4ZXI/OiBGaXhlcikge1xuICAgIHN1cGVyKGNvbmZpZywgZml4ZXIpO1xuICAgIC8vIFRPRE86IFN1cHBvcnQgbW9yZSB0aGFuIG9uZSBzaW5nbGUgdmFsdWUgaGVyZSwgb3IgZXZlbiBidWlsZCBhXG4gICAgLy8gbXVsdGktcGF0dGVybiBlbmdpbmUuIFRoaXMgd291bGQgaGVscCBmb3IgcGVyZm9ybWFuY2UuXG4gICAgaWYgKHRoaXMuY29uZmlnLnZhbHVlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQkFOTkVEX1BST1BFUlRZX1dSSVRFIGV4cGVjdHMgb25lIHZhbHVlLCBnb3QoJHtcbiAgICAgICAgICB0aGlzLmNvbmZpZy52YWx1ZXMuam9pbignLCcpfSlgKTtcbiAgICB9XG4gICAgdGhpcy5tYXRjaGVyID0gUHJvcGVydHlNYXRjaGVyLmZyb21TcGVjKHRoaXMuY29uZmlnLnZhbHVlc1swXSk7XG4gIH1cblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uLCB0aGlzLmNoZWNrQW5kRmlsdGVyUmVzdWx0cy5iaW5kKHRoaXMpLFxuICAgICAgICBFcnJvckNvZGUuQ09ORk9STUFOQ0VfUEFUVEVSTik7XG4gIH1cblxuICBjaGVjayh0YzogdHMuVHlwZUNoZWNrZXIsIG46IHRzLk5vZGUpOiB0cy5Ob2RlfHVuZGVmaW5lZCB7XG4gICAgaWYgKCFpc1Byb3BlcnR5V3JpdGVFeHByZXNzaW9uKG4pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlYnVnTG9nKGBpbnNwZWN0aW5nICR7bi5nZXRUZXh0KCkudHJpbSgpfWApO1xuICAgIGlmICghdGhpcy5tYXRjaGVyLm1hdGNoZXMobi5sZWZ0LCB0YykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVidWdMb2coYE1hdGNoLiBSZXBvcnRpbmcgZmFpbHVyZSAoYm91bmRhcmllczogJHtuLmdldFN0YXJ0KCl9LCAke1xuICAgICAgICBuLmdldEVuZCgpfV0gb24gbm9kZSBbJHtuLmdldFRleHQoKX1dYCk7XG4gICAgcmV0dXJuIG47XG4gIH1cbn1cbiJdfQ==