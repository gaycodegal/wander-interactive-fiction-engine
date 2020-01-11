(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "../../error_code", "../ast_tools", "../is_literal", "../match_symbol", "./pattern_engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const error_code_1 = require("../../error_code");
    const ast_tools_1 = require("../ast_tools");
    const is_literal_1 = require("../is_literal");
    const match_symbol_1 = require("../match_symbol");
    const pattern_engine_1 = require("./pattern_engine");
    /**
     * The engine for BANNED_PROPERTY_NON_CONSTANT_WRITE.
     */
    class PropertyNonConstantWriteEngine extends pattern_engine_1.PatternEngine {
        constructor(config, fixer) {
            super(config, fixer);
            // TODO: Support more than one single value here, or even build a
            // multi-pattern engine. This would help for performance.
            if (this.config.values.length !== 1) {
                throw new Error(`BANNED_PROPERTY_NON_CONSTANT_WRITE expects one value, got(${this.config.values.join(',')})`);
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
            ast_tools_1.debugLog(`inspecting ${n.getFullText().trim()}`);
            if (!this.matcher.matches(n.left, tc)) {
                ast_tools_1.debugLog('Not an assignment to the right property');
                return;
            }
            if (is_literal_1.isLiteral(tc, n.right)) {
                ast_tools_1.debugLog(`Assigned value (${n.right.getFullText()}) is a compile-time constant.`);
                return;
            }
            return n;
        }
    }
    exports.PropertyNonConstantWriteEngine = PropertyNonConstantWriteEngine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfbm9uX2NvbnN0YW50X3dyaXRlX2VuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL3V0aWwvcGF0dGVybl9lbmdpbmVzL3Byb3BlcnR5X25vbl9jb25zdGFudF93cml0ZV9lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQSxpQ0FBaUM7SUFFakMsaURBQTJDO0lBQzNDLDRDQUFpRTtJQUVqRSw4Q0FBd0M7SUFDeEMsa0RBQWdEO0lBRWhELHFEQUErQztJQUUvQzs7T0FFRztJQUNILE1BQWEsOEJBQStCLFNBQVEsOEJBQWE7UUFFL0QsWUFBWSxNQUFjLEVBQUUsS0FBYTtZQUN2QyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLGlFQUFpRTtZQUNqRSx5REFBeUQ7WUFDekQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNuQyxNQUFNLElBQUksS0FBSyxDQUNYLDZEQUNJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDMUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLDhCQUFlLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUNOLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDckUsc0JBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxLQUFLLENBQUMsRUFBa0IsRUFBRSxDQUFVO1lBQ2xDLElBQUksQ0FBQyxxQ0FBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakMsT0FBTzthQUNSO1lBQ0Qsb0JBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3JDLG9CQUFRLENBQUMseUNBQXlDLENBQUMsQ0FBQztnQkFDcEQsT0FBTzthQUNSO1lBQ0QsSUFBSSxzQkFBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzFCLG9CQUFRLENBQUMsbUJBQ0wsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsK0JBQStCLENBQUMsQ0FBQztnQkFDMUQsT0FBTzthQUNSO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDWCxDQUFDO0tBQ0Y7SUFwQ0Qsd0VBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0NoZWNrZXJ9IGZyb20gJy4uLy4uL2NoZWNrZXInO1xuaW1wb3J0IHtFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9yX2NvZGUnO1xuaW1wb3J0IHtkZWJ1Z0xvZywgaXNQcm9wZXJ0eVdyaXRlRXhwcmVzc2lvbn0gZnJvbSAnLi4vYXN0X3Rvb2xzJztcbmltcG9ydCB7Rml4ZXJ9IGZyb20gJy4uL2ZpeGVyJztcbmltcG9ydCB7aXNMaXRlcmFsfSBmcm9tICcuLi9pc19saXRlcmFsJztcbmltcG9ydCB7UHJvcGVydHlNYXRjaGVyfSBmcm9tICcuLi9tYXRjaF9zeW1ib2wnO1xuaW1wb3J0IHtDb25maWd9IGZyb20gJy4uL3BhdHRlcm5fY29uZmlnJztcbmltcG9ydCB7UGF0dGVybkVuZ2luZX0gZnJvbSAnLi9wYXR0ZXJuX2VuZ2luZSc7XG5cbi8qKlxuICogVGhlIGVuZ2luZSBmb3IgQkFOTkVEX1BST1BFUlRZX05PTl9DT05TVEFOVF9XUklURS5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5Tm9uQ29uc3RhbnRXcml0ZUVuZ2luZSBleHRlbmRzIFBhdHRlcm5FbmdpbmUge1xuICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoZXI6IFByb3BlcnR5TWF0Y2hlcjtcbiAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWcsIGZpeGVyPzogRml4ZXIpIHtcbiAgICBzdXBlcihjb25maWcsIGZpeGVyKTtcbiAgICAvLyBUT0RPOiBTdXBwb3J0IG1vcmUgdGhhbiBvbmUgc2luZ2xlIHZhbHVlIGhlcmUsIG9yIGV2ZW4gYnVpbGQgYVxuICAgIC8vIG11bHRpLXBhdHRlcm4gZW5naW5lLiBUaGlzIHdvdWxkIGhlbHAgZm9yIHBlcmZvcm1hbmNlLlxuICAgIGlmICh0aGlzLmNvbmZpZy52YWx1ZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEJBTk5FRF9QUk9QRVJUWV9OT05fQ09OU1RBTlRfV1JJVEUgZXhwZWN0cyBvbmUgdmFsdWUsIGdvdCgke1xuICAgICAgICAgICAgICB0aGlzLmNvbmZpZy52YWx1ZXMuam9pbignLCcpfSlgKTtcbiAgICB9XG4gICAgdGhpcy5tYXRjaGVyID0gUHJvcGVydHlNYXRjaGVyLmZyb21TcGVjKHRoaXMuY29uZmlnLnZhbHVlc1swXSk7XG4gIH1cblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uLCB0aGlzLmNoZWNrQW5kRmlsdGVyUmVzdWx0cy5iaW5kKHRoaXMpLFxuICAgICAgICBFcnJvckNvZGUuQ09ORk9STUFOQ0VfUEFUVEVSTik7XG4gIH1cblxuICBjaGVjayh0YzogdHMuVHlwZUNoZWNrZXIsIG46IHRzLk5vZGUpOiB0cy5Ob2RlfHVuZGVmaW5lZCB7XG4gICAgaWYgKCFpc1Byb3BlcnR5V3JpdGVFeHByZXNzaW9uKG4pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlYnVnTG9nKGBpbnNwZWN0aW5nICR7bi5nZXRGdWxsVGV4dCgpLnRyaW0oKX1gKTtcbiAgICBpZiAoIXRoaXMubWF0Y2hlci5tYXRjaGVzKG4ubGVmdCwgdGMpKSB7XG4gICAgICBkZWJ1Z0xvZygnTm90IGFuIGFzc2lnbm1lbnQgdG8gdGhlIHJpZ2h0IHByb3BlcnR5Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChpc0xpdGVyYWwodGMsIG4ucmlnaHQpKSB7XG4gICAgICBkZWJ1Z0xvZyhgQXNzaWduZWQgdmFsdWUgKCR7XG4gICAgICAgICAgbi5yaWdodC5nZXRGdWxsVGV4dCgpfSkgaXMgYSBjb21waWxlLXRpbWUgY29uc3RhbnQuYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBuO1xuICB9XG59XG4iXX0=