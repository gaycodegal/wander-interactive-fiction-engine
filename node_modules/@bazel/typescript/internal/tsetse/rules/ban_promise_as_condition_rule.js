/**
 * @fileoverview Bans using a promise as a condition. Promises are always
 * truthy, and this pattern is likely to be a bug where the developer meant
 * if(await returnsPromise()) {} and forgot the await.
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
            this.ruleName = 'ban-promise-as-condition';
            this.code = error_code_1.ErrorCode.BAN_PROMISE_AS_CONDITION;
        }
        register(checker) {
            checker.on(ts.SyntaxKind.ConditionalExpression, checkConditional, this.code);
            checker.on(ts.SyntaxKind.BinaryExpression, checkBinaryExpression, this.code);
            checker.on(ts.SyntaxKind.WhileStatement, checkWhileStatement, this.code);
            checker.on(ts.SyntaxKind.IfStatement, checkIfStatement, this.code);
        }
    }
    exports.Rule = Rule;
    /** Error message to display. */
    function thenableText(nodeType, isVariable) {
        return `Found a thenable ${isVariable ? 'variable' : 'return value'} being` +
            ` used as ${nodeType}. Promises are always truthy, await the value to get` +
            ' a boolean value.';
    }
    function thenableVariableText(nodeType) {
        return thenableText(nodeType, true);
    }
    function thenableReturnText(nodeType) {
        return thenableText(nodeType, false);
    }
    /** Ternary: prom ? y : z */
    function checkConditional(checker, node) {
        addFailureIfThenableCallExpression(checker, node.condition, thenableReturnText('a conditional'));
        addFailureIfThenableIdentifier(checker, node.condition, thenableVariableText('a conditional'));
    }
    /**
     *  Binary expression: prom || y or prom && y. Only check left side because
     *  myThing && myThing.prom seems legitimate.
     */
    function checkBinaryExpression(checker, node) {
        if (node.operatorToken.kind !== ts.SyntaxKind.BarBarToken &&
            node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) {
            return;
        }
        addFailureIfThenableCallExpression(checker, node.left, thenableReturnText('a binary expression'));
        addFailureIfThenableIdentifier(checker, node.left, thenableVariableText('a binary expression'));
    }
    /** While statement: while (prom) {} */
    function checkWhileStatement(checker, node) {
        addFailureIfThenableCallExpression(checker, node.expression, thenableReturnText('a while statement'));
        addFailureIfThenableIdentifier(checker, node.expression, thenableVariableText('a while  statement'));
    }
    /** If statement: if (prom) {} */
    function checkIfStatement(checker, node) {
        addFailureIfThenableCallExpression(checker, node.expression, thenableReturnText('an if statement'));
        addFailureIfThenableIdentifier(checker, node.expression, thenableVariableText('an if statement'));
    }
    /** Helper methods */
    function addFailureIfThenableCallExpression(checker, callExpression, errorMessage) {
        if (!tsutils.isCallExpression(callExpression)) {
            return;
        }
        const typeChecker = checker.typeChecker;
        const signature = typeChecker.getResolvedSignature(callExpression);
        // Return value of getResolvedSignature is `Signature | undefined` in ts 3.1
        // so we must check if the return value is valid to compile with ts 3.1.
        if (!signature) {
            throw new Error('Unexpected undefined signature for call expression');
        }
        const returnType = typeChecker.getReturnTypeOfSignature(signature);
        if (isNonFalsyThenableType(typeChecker, callExpression, returnType)) {
            checker.addFailureAtNode(callExpression, errorMessage);
        }
    }
    function addFailureIfThenableIdentifier(checker, identifier, errorMessage) {
        if (!tsutils.isIdentifier(identifier)) {
            return;
        }
        if (isNonFalsyThenableType(checker.typeChecker, identifier)) {
            checker.addFailureAtNode(identifier, errorMessage);
        }
    }
    /**
     * If the type is a union type and has a falsy part it may be legitimate to use
     * it as a condition, so allow those through. (e.g. Promise<boolean> | boolean)
     * Otherwise, check if it's thenable. If so it should be awaited.
     */
    function isNonFalsyThenableType(typeChecker, node, type = typeChecker.getTypeAtLocation(node)) {
        if (hasFalsyParts(typeChecker.getTypeAtLocation(node))) {
            return false;
        }
        return tsutils.isThenableType(typeChecker, node, type);
    }
    function hasFalsyParts(type) {
        const typeParts = tsutils.unionTypeParts(type);
        const hasFalsyParts = typeParts.filter((part) => tsutils.isFalsyType(part)).length > 0;
        return hasFalsyParts;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFuX3Byb21pc2VfYXNfY29uZGl0aW9uX3J1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS9ydWxlcy9iYW5fcHJvbWlzZV9hc19jb25kaXRpb25fcnVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHOzs7Ozs7Ozs7Ozs7SUFFSCxtQ0FBbUM7SUFDbkMsaUNBQWlDO0lBR2pDLDhDQUF3QztJQUN4QyxrQ0FBcUM7SUFFckMsTUFBYSxJQUFLLFNBQVEsbUJBQVk7UUFBdEM7O1lBQ1csYUFBUSxHQUFHLDBCQUEwQixDQUFDO1lBQ3RDLFNBQUksR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDO1FBVXJELENBQUM7UUFSQyxRQUFRLENBQUMsT0FBZ0I7WUFDdkIsT0FBTyxDQUFDLEVBQUUsQ0FDTixFQUFFLENBQUMsVUFBVSxDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RSxPQUFPLENBQUMsRUFBRSxDQUNOLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JFLENBQUM7S0FDRjtJQVpELG9CQVlDO0lBRUQsZ0NBQWdDO0lBQ2hDLFNBQVMsWUFBWSxDQUFDLFFBQWdCLEVBQUUsVUFBbUI7UUFDekQsT0FBTyxvQkFB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QWdCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQ3hEO0lBQ0gsQ0FBQztJQUVELFNBQVMsOEJBQThCLENBQ25DLE9BQWdCLEVBQUUsVUFBeUIsRUFBRSxZQUFvQjtRQUNuRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNyQyxPQUFPO1NBQ1I7UUFFRCxJQUFJLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDM0QsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNwRDtJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyxzQkFBc0IsQ0FDM0IsV0FBMkIsRUFBRSxJQUFtQixFQUNoRCxJQUFJLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztRQUM1QyxJQUFJLGFBQWEsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUN0RCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLElBQWE7UUFDbEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxNQUFNLGFBQWEsR0FDZixTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNyRSxPQUFPLGFBQWEsQ0FBQztJQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEJhbnMgdXNpbmcgYSBwcm9taXNlIGFzIGEgY29uZGl0aW9uLiBQcm9taXNlcyBhcmUgYWx3YXlzXG4gKiB0cnV0aHksIGFuZCB0aGlzIHBhdHRlcm4gaXMgbGlrZWx5IHRvIGJlIGEgYnVnIHdoZXJlIHRoZSBkZXZlbG9wZXIgbWVhbnRcbiAqIGlmKGF3YWl0IHJldHVybnNQcm9taXNlKCkpIHt9IGFuZCBmb3Jnb3QgdGhlIGF3YWl0LlxuICovXG5cbmltcG9ydCAqIGFzIHRzdXRpbHMgZnJvbSAndHN1dGlscyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDaGVja2VyfSBmcm9tICcuLi9jaGVja2VyJztcbmltcG9ydCB7RXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcl9jb2RlJztcbmltcG9ydCB7QWJzdHJhY3RSdWxlfSBmcm9tICcuLi9ydWxlJztcblxuZXhwb3J0IGNsYXNzIFJ1bGUgZXh0ZW5kcyBBYnN0cmFjdFJ1bGUge1xuICByZWFkb25seSBydWxlTmFtZSA9ICdiYW4tcHJvbWlzZS1hcy1jb25kaXRpb24nO1xuICByZWFkb25seSBjb2RlID0gRXJyb3JDb2RlLkJBTl9QUk9NSVNFX0FTX0NPTkRJVElPTjtcblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5Db25kaXRpb25hbEV4cHJlc3Npb24sIGNoZWNrQ29uZGl0aW9uYWwsIHRoaXMuY29kZSk7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5CaW5hcnlFeHByZXNzaW9uLCBjaGVja0JpbmFyeUV4cHJlc3Npb24sIHRoaXMuY29kZSk7XG4gICAgY2hlY2tlci5vbih0cy5TeW50YXhLaW5kLldoaWxlU3RhdGVtZW50LCBjaGVja1doaWxlU3RhdGVtZW50LCB0aGlzLmNvZGUpO1xuICAgIGNoZWNrZXIub24odHMuU3ludGF4S2luZC5JZlN0YXRlbWVudCwgY2hlY2tJZlN0YXRlbWVudCwgdGhpcy5jb2RlKTtcbiAgfVxufVxuXG4vKiogRXJyb3IgbWVzc2FnZSB0byBkaXNwbGF5LiAqL1xuZnVuY3Rpb24gdGhlbmFibGVUZXh0KG5vZGVUeXBlOiBzdHJpbmcsIGlzVmFyaWFibGU6IGJvb2xlYW4pIHtcbiAgcmV0dXJuIGBGb3VuZCBhIHRoZW5hYmxlICR7aXNWYXJpYWJsZSA/ICd2YXJpYWJsZScgOiAncmV0dXJuIHZhbHVlJ30gYmVpbmdgICtcbiAgICAgIGAgdXNlZCBhcyAke1xuICAgICAgICAgICAgIG5vZGVUeXBlfS4gUHJvbWlzZXMgYXJlIGFsd2F5cyB0cnV0aHksIGF3YWl0IHRoZSB2YWx1ZSB0byBnZXRgICtcbiAgICAgICcgYSBib29sZWFuIHZhbHVlLic7XG59XG5cbmZ1bmN0aW9uIHRoZW5hYmxlVmFyaWFibGVUZXh0KG5vZGVUeXBlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHRoZW5hYmxlVGV4dChub2RlVHlwZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHRoZW5hYmxlUmV0dXJuVGV4dChub2RlVHlwZTogc3RyaW5nKSB7XG4gIHJldHVybiB0aGVuYWJsZVRleHQobm9kZVR5cGUsIGZhbHNlKTtcbn1cblxuLyoqIFRlcm5hcnk6IHByb20gPyB5IDogeiAqL1xuZnVuY3Rpb24gY2hlY2tDb25kaXRpb25hbChjaGVja2VyOiBDaGVja2VyLCBub2RlOiB0cy5Db25kaXRpb25hbEV4cHJlc3Npb24pIHtcbiAgYWRkRmFpbHVyZUlmVGhlbmFibGVDYWxsRXhwcmVzc2lvbihcbiAgICAgIGNoZWNrZXIsIG5vZGUuY29uZGl0aW9uLCB0aGVuYWJsZVJldHVyblRleHQoJ2EgY29uZGl0aW9uYWwnKSk7XG5cbiAgYWRkRmFpbHVyZUlmVGhlbmFibGVJZGVudGlmaWVyKFxuICAgICAgY2hlY2tlciwgbm9kZS5jb25kaXRpb24sIHRoZW5hYmxlVmFyaWFibGVUZXh0KCdhIGNvbmRpdGlvbmFsJykpO1xufVxuXG4vKipcbiAqICBCaW5hcnkgZXhwcmVzc2lvbjogcHJvbSB8fCB5IG9yIHByb20gJiYgeS4gT25seSBjaGVjayBsZWZ0IHNpZGUgYmVjYXVzZVxuICogIG15VGhpbmcgJiYgbXlUaGluZy5wcm9tIHNlZW1zIGxlZ2l0aW1hdGUuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQmluYXJ5RXhwcmVzc2lvbihjaGVja2VyOiBDaGVja2VyLCBub2RlOiB0cy5CaW5hcnlFeHByZXNzaW9uKSB7XG4gIGlmIChub2RlLm9wZXJhdG9yVG9rZW4ua2luZCAhPT0gdHMuU3ludGF4S2luZC5CYXJCYXJUb2tlbiAmJlxuICAgICAgbm9kZS5vcGVyYXRvclRva2VuLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQW1wZXJzYW5kQW1wZXJzYW5kVG9rZW4pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBhZGRGYWlsdXJlSWZUaGVuYWJsZUNhbGxFeHByZXNzaW9uKFxuICAgICAgY2hlY2tlciwgbm9kZS5sZWZ0LCB0aGVuYWJsZVJldHVyblRleHQoJ2EgYmluYXJ5IGV4cHJlc3Npb24nKSk7XG5cbiAgYWRkRmFpbHVyZUlmVGhlbmFibGVJZGVudGlmaWVyKFxuICAgICAgY2hlY2tlciwgbm9kZS5sZWZ0LCB0aGVuYWJsZVZhcmlhYmxlVGV4dCgnYSBiaW5hcnkgZXhwcmVzc2lvbicpKTtcbn1cblxuLyoqIFdoaWxlIHN0YXRlbWVudDogd2hpbGUgKHByb20pIHt9ICovXG5mdW5jdGlvbiBjaGVja1doaWxlU3RhdGVtZW50KGNoZWNrZXI6IENoZWNrZXIsIG5vZGU6IHRzLldoaWxlU3RhdGVtZW50KSB7XG4gIGFkZEZhaWx1cmVJZlRoZW5hYmxlQ2FsbEV4cHJlc3Npb24oXG4gICAgICBjaGVja2VyLCBub2RlLmV4cHJlc3Npb24sIHRoZW5hYmxlUmV0dXJuVGV4dCgnYSB3aGlsZSBzdGF0ZW1lbnQnKSk7XG5cbiAgYWRkRmFpbHVyZUlmVGhlbmFibGVJZGVudGlmaWVyKFxuICAgICAgY2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCB0aGVuYWJsZVZhcmlhYmxlVGV4dCgnYSB3aGlsZSAgc3RhdGVtZW50JykpO1xufVxuXG4vKiogSWYgc3RhdGVtZW50OiBpZiAocHJvbSkge30gKi9cbmZ1bmN0aW9uIGNoZWNrSWZTdGF0ZW1lbnQoY2hlY2tlcjogQ2hlY2tlciwgbm9kZTogdHMuSWZTdGF0ZW1lbnQpIHtcbiAgYWRkRmFpbHVyZUlmVGhlbmFibGVDYWxsRXhwcmVzc2lvbihcbiAgICAgIGNoZWNrZXIsIG5vZGUuZXhwcmVzc2lvbiwgdGhlbmFibGVSZXR1cm5UZXh0KCdhbiBpZiBzdGF0ZW1lbnQnKSk7XG5cbiAgYWRkRmFpbHVyZUlmVGhlbmFibGVJZGVudGlmaWVyKFxuICAgICAgY2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCB0aGVuYWJsZVZhcmlhYmxlVGV4dCgnYW4gaWYgc3RhdGVtZW50JykpO1xufVxuXG4vKiogSGVscGVyIG1ldGhvZHMgKi9cblxuZnVuY3Rpb24gYWRkRmFpbHVyZUlmVGhlbmFibGVDYWxsRXhwcmVzc2lvbihcbiAgICBjaGVja2VyOiBDaGVja2VyLCBjYWxsRXhwcmVzc2lvbjogdHMuRXhwcmVzc2lvbiwgZXJyb3JNZXNzYWdlOiBzdHJpbmcpIHtcbiAgaWYgKCF0c3V0aWxzLmlzQ2FsbEV4cHJlc3Npb24oY2FsbEV4cHJlc3Npb24pKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBjaGVja2VyLnR5cGVDaGVja2VyO1xuICBjb25zdCBzaWduYXR1cmUgPSB0eXBlQ2hlY2tlci5nZXRSZXNvbHZlZFNpZ25hdHVyZShjYWxsRXhwcmVzc2lvbik7XG5cbiAgLy8gUmV0dXJuIHZhbHVlIG9mIGdldFJlc29sdmVkU2lnbmF0dXJlIGlzIGBTaWduYXR1cmUgfCB1bmRlZmluZWRgIGluIHRzIDMuMVxuICAvLyBzbyB3ZSBtdXN0IGNoZWNrIGlmIHRoZSByZXR1cm4gdmFsdWUgaXMgdmFsaWQgdG8gY29tcGlsZSB3aXRoIHRzIDMuMS5cbiAgaWYgKCFzaWduYXR1cmUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgdW5kZWZpbmVkIHNpZ25hdHVyZSBmb3IgY2FsbCBleHByZXNzaW9uJyk7XG4gIH1cblxuICBjb25zdCByZXR1cm5UeXBlID0gdHlwZUNoZWNrZXIuZ2V0UmV0dXJuVHlwZU9mU2lnbmF0dXJlKHNpZ25hdHVyZSk7XG5cbiAgaWYgKGlzTm9uRmFsc3lUaGVuYWJsZVR5cGUodHlwZUNoZWNrZXIsIGNhbGxFeHByZXNzaW9uLCByZXR1cm5UeXBlKSkge1xuICAgIGNoZWNrZXIuYWRkRmFpbHVyZUF0Tm9kZShjYWxsRXhwcmVzc2lvbiwgZXJyb3JNZXNzYWdlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRGYWlsdXJlSWZUaGVuYWJsZUlkZW50aWZpZXIoXG4gICAgY2hlY2tlcjogQ2hlY2tlciwgaWRlbnRpZmllcjogdHMuRXhwcmVzc2lvbiwgZXJyb3JNZXNzYWdlOiBzdHJpbmcpIHtcbiAgaWYgKCF0c3V0aWxzLmlzSWRlbnRpZmllcihpZGVudGlmaWVyKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpc05vbkZhbHN5VGhlbmFibGVUeXBlKGNoZWNrZXIudHlwZUNoZWNrZXIsIGlkZW50aWZpZXIpKSB7XG4gICAgY2hlY2tlci5hZGRGYWlsdXJlQXROb2RlKGlkZW50aWZpZXIsIGVycm9yTWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJZiB0aGUgdHlwZSBpcyBhIHVuaW9uIHR5cGUgYW5kIGhhcyBhIGZhbHN5IHBhcnQgaXQgbWF5IGJlIGxlZ2l0aW1hdGUgdG8gdXNlXG4gKiBpdCBhcyBhIGNvbmRpdGlvbiwgc28gYWxsb3cgdGhvc2UgdGhyb3VnaC4gKGUuZy4gUHJvbWlzZTxib29sZWFuPiB8IGJvb2xlYW4pXG4gKiBPdGhlcndpc2UsIGNoZWNrIGlmIGl0J3MgdGhlbmFibGUuIElmIHNvIGl0IHNob3VsZCBiZSBhd2FpdGVkLlxuICovXG5mdW5jdGlvbiBpc05vbkZhbHN5VGhlbmFibGVUeXBlKFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbm9kZTogdHMuRXhwcmVzc2lvbixcbiAgICB0eXBlID0gdHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24obm9kZSkpIHtcbiAgaWYgKGhhc0ZhbHN5UGFydHModHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24obm9kZSkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRzdXRpbHMuaXNUaGVuYWJsZVR5cGUodHlwZUNoZWNrZXIsIG5vZGUsIHR5cGUpO1xufVxuXG5mdW5jdGlvbiBoYXNGYWxzeVBhcnRzKHR5cGU6IHRzLlR5cGUpIHtcbiAgY29uc3QgdHlwZVBhcnRzID0gdHN1dGlscy51bmlvblR5cGVQYXJ0cyh0eXBlKTtcbiAgY29uc3QgaGFzRmFsc3lQYXJ0cyA9XG4gICAgICB0eXBlUGFydHMuZmlsdGVyKChwYXJ0KSA9PiB0c3V0aWxzLmlzRmFsc3lUeXBlKHBhcnQpKS5sZW5ndGggPiAwO1xuICByZXR1cm4gaGFzRmFsc3lQYXJ0cztcbn1cbiJdfQ==