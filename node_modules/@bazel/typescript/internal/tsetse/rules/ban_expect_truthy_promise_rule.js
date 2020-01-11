/**
 * @fileoverview Bans expect(returnsPromise()).toBeTruthy(). Promises are always
 * truthy, and this pattern is likely to be a bug where the developer meant
 * expect(await returnsPromise()).toBeTruthy() and forgot the await.
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tsutils", "typescript", "../error_code", "../rule"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tsutils = require("tsutils");
    const ts = require("typescript");
    const error_code_1 = require("../error_code");
    const rule_1 = require("../rule");
    class Rule extends rule_1.AbstractRule {
        constructor() {
            super(...arguments);
            this.ruleName = 'ban-expect-truthy-promise';
            this.code = error_code_1.ErrorCode.BAN_EXPECT_TRUTHY_PROMISE;
        }
        register(checker) {
            checker.on(ts.SyntaxKind.PropertyAccessExpression, checkForTruthy, this.code);
        }
    }
    exports.Rule = Rule;
    function checkForTruthy(checker, node) {
        if (node.name.text !== 'toBeTruthy') {
            return;
        }
        const expectCallNode = getLeftmostNode(node);
        if (!ts.isCallExpression(expectCallNode)) {
            return;
        }
        if (!ts.isIdentifier(expectCallNode.expression) || expectCallNode.expression.text !== 'expect') {
            return;
        }
        if (expectCallNode.arguments.length === 0 || ts.isAwaitExpression(expectCallNode.arguments[0])) {
            return;
        }
        const tc = checker.typeChecker;
        const signature = tc.getResolvedSignature(expectCallNode);
        if (signature === undefined) {
            return;
        }
        const symbol = tc.getReturnTypeOfSignature(signature).getSymbol();
        if (symbol === undefined) {
            return;
        }
        // Only look for methods named expect that return a Matchers
        if (symbol.name !== 'Matchers') {
            return;
        }
        const argType = tc.getTypeAtLocation(expectCallNode.arguments[0]);
        if (!tsutils.isThenableType(tc, expectCallNode.arguments[0], argType)) {
            return;
        }
        checker.addFailureAtNode(node, `Value passed to expect() is of type ${tc.typeToString(argType)}, which` +
            ` is thenable. Promises are always truthy. Either use toBe(true) or` +
            ` await the value.` +
            `\n\tSee http://tsetse.info/ban-expect-truthy-promise`);
    }
    function getLeftmostNode(node) {
        let current = node;
        while (ts.isPropertyAccessExpression(current)) {
            current = current.expression;
        }
        return current;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFuX2V4cGVjdF90cnV0aHlfcHJvbWlzZV9ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvcnVsZXMvYmFuX2V4cGVjdF90cnV0aHlfcHJvbWlzZV9ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7OztJQUVILG1DQUFtQztJQUNuQyxpQ0FBaUM7SUFHakMsOENBQXdDO0lBQ3hDLGtDQUFxQztJQUVyQyxNQUFhLElBQUssU0FBUSxtQkFBWTtRQUF0Qzs7WUFDVyxhQUFRLEdBQUcsMkJBQTJCLENBQUM7WUFDdkMsU0FBSSxHQUFHLHNCQUFTLENBQUMseUJBQXlCLENBQUM7UUFNdEQsQ0FBQztRQUpDLFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUNOLEVBQUUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RSxDQUFDO0tBQ0Y7SUFSRCxvQkFRQztJQUVELFNBQVMsY0FBYyxDQUFDLE9BQWdCLEVBQUUsSUFBaUM7UUFDekUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7WUFDbkMsT0FBTztTQUNSO1FBRUQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDeEMsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUM5RixPQUFPO1NBQ1I7UUFFRCxJQUFJLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzlGLE9BQU87U0FDUjtRQUVELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFFL0IsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPO1NBQ1I7UUFFRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsd0JBQXdCLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbEUsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ3hCLE9BQU87U0FDUjtRQUVELDREQUE0RDtRQUM1RCxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO1lBQzlCLE9BQU87U0FDUjtRQUVELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDckUsT0FBTztTQUNSO1FBRUQsT0FBTyxDQUFDLGdCQUFnQixDQUNwQixJQUFJLEVBQ0osdUNBQXVDLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVM7WUFDcEUsb0VBQW9FO1lBQ3BFLG1CQUFtQjtZQUNuQixzREFBc0QsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFpQztRQUN4RCxJQUFJLE9BQU8sR0FBd0MsSUFBSSxDQUFDO1FBQ3hELE9BQU8sRUFBRSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzdDLE9BQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1NBQzlCO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBCYW5zIGV4cGVjdChyZXR1cm5zUHJvbWlzZSgpKS50b0JlVHJ1dGh5KCkuIFByb21pc2VzIGFyZSBhbHdheXNcbiAqIHRydXRoeSwgYW5kIHRoaXMgcGF0dGVybiBpcyBsaWtlbHkgdG8gYmUgYSBidWcgd2hlcmUgdGhlIGRldmVsb3BlciBtZWFudFxuICogZXhwZWN0KGF3YWl0IHJldHVybnNQcm9taXNlKCkpLnRvQmVUcnV0aHkoKSBhbmQgZm9yZ290IHRoZSBhd2FpdC5cbiAqL1xuXG5pbXBvcnQgKiBhcyB0c3V0aWxzIGZyb20gJ3RzdXRpbHMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q2hlY2tlcn0gZnJvbSAnLi4vY2hlY2tlcic7XG5pbXBvcnQge0Vycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JfY29kZSc7XG5pbXBvcnQge0Fic3RyYWN0UnVsZX0gZnJvbSAnLi4vcnVsZSc7XG5cbmV4cG9ydCBjbGFzcyBSdWxlIGV4dGVuZHMgQWJzdHJhY3RSdWxlIHtcbiAgcmVhZG9ubHkgcnVsZU5hbWUgPSAnYmFuLWV4cGVjdC10cnV0aHktcHJvbWlzZSc7XG4gIHJlYWRvbmx5IGNvZGUgPSBFcnJvckNvZGUuQkFOX0VYUEVDVF9UUlVUSFlfUFJPTUlTRTtcblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24sIGNoZWNrRm9yVHJ1dGh5LCB0aGlzLmNvZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrRm9yVHJ1dGh5KGNoZWNrZXI6IENoZWNrZXIsIG5vZGU6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbikge1xuICBpZiAobm9kZS5uYW1lLnRleHQgIT09ICd0b0JlVHJ1dGh5Jykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGV4cGVjdENhbGxOb2RlID0gZ2V0TGVmdG1vc3ROb2RlKG5vZGUpO1xuICBpZiAoIXRzLmlzQ2FsbEV4cHJlc3Npb24oZXhwZWN0Q2FsbE5vZGUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCF0cy5pc0lkZW50aWZpZXIoZXhwZWN0Q2FsbE5vZGUuZXhwcmVzc2lvbikgfHwgZXhwZWN0Q2FsbE5vZGUuZXhwcmVzc2lvbi50ZXh0ICE9PSAnZXhwZWN0Jykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChleHBlY3RDYWxsTm9kZS5hcmd1bWVudHMubGVuZ3RoID09PSAwIHx8IHRzLmlzQXdhaXRFeHByZXNzaW9uKGV4cGVjdENhbGxOb2RlLmFyZ3VtZW50c1swXSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB0YyA9IGNoZWNrZXIudHlwZUNoZWNrZXI7XG5cbiAgY29uc3Qgc2lnbmF0dXJlID0gdGMuZ2V0UmVzb2x2ZWRTaWduYXR1cmUoZXhwZWN0Q2FsbE5vZGUpO1xuICBpZiAoc2lnbmF0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzeW1ib2wgPSB0Yy5nZXRSZXR1cm5UeXBlT2ZTaWduYXR1cmUoc2lnbmF0dXJlKS5nZXRTeW1ib2woKTtcbiAgaWYgKHN5bWJvbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gT25seSBsb29rIGZvciBtZXRob2RzIG5hbWVkIGV4cGVjdCB0aGF0IHJldHVybiBhIE1hdGNoZXJzXG4gIGlmIChzeW1ib2wubmFtZSAhPT0gJ01hdGNoZXJzJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGFyZ1R5cGUgPSB0Yy5nZXRUeXBlQXRMb2NhdGlvbihleHBlY3RDYWxsTm9kZS5hcmd1bWVudHNbMF0pO1xuICBpZiAoIXRzdXRpbHMuaXNUaGVuYWJsZVR5cGUodGMsIGV4cGVjdENhbGxOb2RlLmFyZ3VtZW50c1swXSwgYXJnVHlwZSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjaGVja2VyLmFkZEZhaWx1cmVBdE5vZGUoXG4gICAgICBub2RlLFxuICAgICAgYFZhbHVlIHBhc3NlZCB0byBleHBlY3QoKSBpcyBvZiB0eXBlICR7dGMudHlwZVRvU3RyaW5nKGFyZ1R5cGUpfSwgd2hpY2hgICtcbiAgICAgICAgICBgIGlzIHRoZW5hYmxlLiBQcm9taXNlcyBhcmUgYWx3YXlzIHRydXRoeS4gRWl0aGVyIHVzZSB0b0JlKHRydWUpIG9yYCArXG4gICAgICAgICAgYCBhd2FpdCB0aGUgdmFsdWUuYCArXG4gICAgICAgICAgYFxcblxcdFNlZSBodHRwOi8vdHNldHNlLmluZm8vYmFuLWV4cGVjdC10cnV0aHktcHJvbWlzZWApO1xufVxuXG5mdW5jdGlvbiBnZXRMZWZ0bW9zdE5vZGUobm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKSB7XG4gIGxldCBjdXJyZW50OiB0cy5MZWZ0SGFuZFNpZGVFeHByZXNzaW9ufHVuZGVmaW5lZCA9IG5vZGU7XG4gIHdoaWxlICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihjdXJyZW50KSkge1xuICAgIGN1cnJlbnQgPSBjdXJyZW50LmV4cHJlc3Npb247XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnQ7XG59XG4iXX0=