/**
 * @fileoverview Bans `== NaN`, `=== NaN`, `!= NaN`, and `!== NaN` in TypeScript
 * code, since no value (including NaN) is equal to NaN.
 */
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
    class Rule extends rule_1.AbstractRule {
        constructor() {
            super(...arguments);
            this.ruleName = 'equals-nan';
            this.code = error_code_1.ErrorCode.EQUALS_NAN;
        }
        register(checker) {
            checker.on(ts.SyntaxKind.BinaryExpression, checkBinaryExpression, this.code);
        }
    }
    exports.Rule = Rule;
    function checkBinaryExpression(checker, node) {
        const isLeftNaN = ts.isIdentifier(node.left) && node.left.text === 'NaN';
        const isRightNaN = ts.isIdentifier(node.right) && node.right.text === 'NaN';
        if (!isLeftNaN && !isRightNaN) {
            return;
        }
        // We avoid calling getText() on the node.operatorToken because it's slow.
        // Instead, manually map back from the kind to the string form of the operator
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.EqualsEqualsToken:
                checker.addFailureAtNode(node, `x == NaN is always false; use isNaN(x) instead`);
                break;
            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                checker.addFailureAtNode(node, `x === NaN is always false; use isNaN(x) instead`);
                break;
            case ts.SyntaxKind.ExclamationEqualsToken:
                checker.addFailureAtNode(node, `x != NaN is always true; use !isNaN(x) instead`);
                break;
            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                checker.addFailureAtNode(node, `x !== NaN is always true; use !isNaN(x) instead`);
                break;
            default:
                // We don't care about other operators acting on NaN
                break;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXF1YWxzX25hbl9ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvcnVsZXMvZXF1YWxzX25hbl9ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBR2pDLDhDQUF3QztJQUN4QyxrQ0FBcUM7SUFFckMsTUFBYSxJQUFLLFNBQVEsbUJBQVk7UUFBdEM7O1lBQ1csYUFBUSxHQUFHLFlBQVksQ0FBQztZQUN4QixTQUFJLEdBQUcsc0JBQVMsQ0FBQyxVQUFVLENBQUM7UUFNdkMsQ0FBQztRQUpDLFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUNOLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hFLENBQUM7S0FDRjtJQVJELG9CQVFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBQyxPQUFnQixFQUFFLElBQXlCO1FBQ3hFLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQztRQUN6RSxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUM7UUFDNUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUM3QixPQUFPO1NBQ1I7UUFFRCwwRUFBMEU7UUFDMUUsOEVBQThFO1FBQzlFLFFBQVEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7WUFDL0IsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGlCQUFpQjtnQkFDbEMsT0FBTyxDQUFDLGdCQUFnQixDQUN0QixJQUFJLEVBQ0osZ0RBQWdELENBQ2pELENBQUM7Z0JBQ0YsTUFBTTtZQUNSLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUI7Z0JBQ3hDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FDdEIsSUFBSSxFQUNKLGlEQUFpRCxDQUNsRCxDQUFDO2dCQUNGLE1BQU07WUFDUixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCO2dCQUN2QyxPQUFPLENBQUMsZ0JBQWdCLENBQ3RCLElBQUksRUFDSixnREFBZ0QsQ0FDakQsQ0FBQztnQkFDRixNQUFNO1lBQ1IsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLDRCQUE0QjtnQkFDN0MsT0FBTyxDQUFDLGdCQUFnQixDQUN0QixJQUFJLEVBQ0osaURBQWlELENBQ2xELENBQUM7Z0JBQ0YsTUFBTTtZQUNSO2dCQUNFLG9EQUFvRDtnQkFDcEQsTUFBTTtTQUNUO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBCYW5zIGA9PSBOYU5gLCBgPT09IE5hTmAsIGAhPSBOYU5gLCBhbmQgYCE9PSBOYU5gIGluIFR5cGVTY3JpcHRcbiAqIGNvZGUsIHNpbmNlIG5vIHZhbHVlIChpbmNsdWRpbmcgTmFOKSBpcyBlcXVhbCB0byBOYU4uXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q2hlY2tlcn0gZnJvbSAnLi4vY2hlY2tlcic7XG5pbXBvcnQge0Vycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JfY29kZSc7XG5pbXBvcnQge0Fic3RyYWN0UnVsZX0gZnJvbSAnLi4vcnVsZSc7XG5cbmV4cG9ydCBjbGFzcyBSdWxlIGV4dGVuZHMgQWJzdHJhY3RSdWxlIHtcbiAgcmVhZG9ubHkgcnVsZU5hbWUgPSAnZXF1YWxzLW5hbic7XG4gIHJlYWRvbmx5IGNvZGUgPSBFcnJvckNvZGUuRVFVQUxTX05BTjtcblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uLCBjaGVja0JpbmFyeUV4cHJlc3Npb24sIHRoaXMuY29kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tCaW5hcnlFeHByZXNzaW9uKGNoZWNrZXI6IENoZWNrZXIsIG5vZGU6IHRzLkJpbmFyeUV4cHJlc3Npb24pIHtcbiAgY29uc3QgaXNMZWZ0TmFOID0gdHMuaXNJZGVudGlmaWVyKG5vZGUubGVmdCkgJiYgbm9kZS5sZWZ0LnRleHQgPT09ICdOYU4nO1xuICBjb25zdCBpc1JpZ2h0TmFOID0gdHMuaXNJZGVudGlmaWVyKG5vZGUucmlnaHQpICYmIG5vZGUucmlnaHQudGV4dCA9PT0gJ05hTic7XG4gIGlmICghaXNMZWZ0TmFOICYmICFpc1JpZ2h0TmFOKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gV2UgYXZvaWQgY2FsbGluZyBnZXRUZXh0KCkgb24gdGhlIG5vZGUub3BlcmF0b3JUb2tlbiBiZWNhdXNlIGl0J3Mgc2xvdy5cbiAgLy8gSW5zdGVhZCwgbWFudWFsbHkgbWFwIGJhY2sgZnJvbSB0aGUga2luZCB0byB0aGUgc3RyaW5nIGZvcm0gb2YgdGhlIG9wZXJhdG9yXG4gIHN3aXRjaCAobm9kZS5vcGVyYXRvclRva2VuLmtpbmQpIHtcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuRXF1YWxzRXF1YWxzVG9rZW46XG4gICAgICBjaGVja2VyLmFkZEZhaWx1cmVBdE5vZGUoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIGB4ID09IE5hTiBpcyBhbHdheXMgZmFsc2U7IHVzZSBpc05hTih4KSBpbnN0ZWFkYCxcbiAgICAgICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuRXF1YWxzRXF1YWxzRXF1YWxzVG9rZW46XG4gICAgICBjaGVja2VyLmFkZEZhaWx1cmVBdE5vZGUoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIGB4ID09PSBOYU4gaXMgYWx3YXlzIGZhbHNlOyB1c2UgaXNOYU4oeCkgaW5zdGVhZGAsXG4gICAgICApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSB0cy5TeW50YXhLaW5kLkV4Y2xhbWF0aW9uRXF1YWxzVG9rZW46XG4gICAgICBjaGVja2VyLmFkZEZhaWx1cmVBdE5vZGUoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIGB4ICE9IE5hTiBpcyBhbHdheXMgdHJ1ZTsgdXNlICFpc05hTih4KSBpbnN0ZWFkYCxcbiAgICAgICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuRXhjbGFtYXRpb25FcXVhbHNFcXVhbHNUb2tlbjpcbiAgICAgIGNoZWNrZXIuYWRkRmFpbHVyZUF0Tm9kZShcbiAgICAgICAgbm9kZSxcbiAgICAgICAgYHggIT09IE5hTiBpcyBhbHdheXMgdHJ1ZTsgdXNlICFpc05hTih4KSBpbnN0ZWFkYCxcbiAgICAgICk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gV2UgZG9uJ3QgY2FyZSBhYm91dCBvdGhlciBvcGVyYXRvcnMgYWN0aW5nIG9uIE5hTlxuICAgICAgYnJlYWs7XG4gIH1cbn1cbiJdfQ==