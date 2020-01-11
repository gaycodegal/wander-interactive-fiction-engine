/**
 * @fileoverview A Tsetse rule that checks the return value of certain functions
 * must be used.
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
    const FAILURE_STRING = 'return value is unused.'
        + '\n\tSee http://tsetse.info/check-return-value';
    // A list of well-known functions that the return value must be used. If unused
    // then the function call is either a no-op (e.g. 'foo.trim()' foo is unchanged)
    // or can be replaced by another (Array.map() should be replaced with a loop or
    // Array.forEach() if the return value is unused).
    const METHODS_TO_CHECK = new Set([
        ['Array', 'concat'],
        ['Array', 'filter'],
        ['Array', 'map'],
        ['Array', 'slice'],
        ['Function', 'bind'],
        ['Object', 'create'],
        ['string', 'concat'],
        ['string', 'normalize'],
        ['string', 'padStart'],
        ['string', 'padEnd'],
        ['string', 'repeat'],
        ['string', 'slice'],
        ['string', 'split'],
        ['string', 'substr'],
        ['string', 'substring'],
        ['string', 'toLocaleLowerCase'],
        ['string', 'toLocaleUpperCase'],
        ['string', 'toLowerCase'],
        ['string', 'toUpperCase'],
        ['string', 'trim'],
    ].map(list => list.join('#')));
    class Rule extends rule_1.AbstractRule {
        constructor() {
            super(...arguments);
            this.ruleName = 'check-return-value';
            this.code = error_code_1.ErrorCode.CHECK_RETURN_VALUE;
        }
        // registers checkCallExpression() function on ts.CallExpression node.
        // TypeScript conformance will traverse the AST of each source file and run
        // checkCallExpression() every time it encounters a ts.CallExpression node.
        register(checker) {
            checker.on(ts.SyntaxKind.CallExpression, checkCallExpression, this.code);
        }
    }
    exports.Rule = Rule;
    function checkCallExpression(checker, node) {
        // Short-circuit before using the typechecker if possible, as its expensive.
        // Workaround for https://github.com/Microsoft/TypeScript/issues/27997
        if (tsutils.isExpressionValueUsed(node)) {
            return;
        }
        // Check if this CallExpression is one of the well-known functions and returns
        // a non-void value that is unused.
        const signature = checker.typeChecker.getResolvedSignature(node);
        if (signature !== undefined) {
            const returnType = checker.typeChecker.getReturnTypeOfSignature(signature);
            if (!!(returnType.flags & ts.TypeFlags.Void)) {
                return;
            }
            // Although hasCheckReturnValueJsDoc() is faster than isBlackListed(), it
            // returns false most of the time and thus isBlackListed() would have to run
            // anyway. Therefore we short-circuit hasCheckReturnValueJsDoc().
            if (!isBlackListed(node, checker.typeChecker) &&
                !hasCheckReturnValueJsDoc(node, checker.typeChecker)) {
                return;
            }
            checker.addFailureAtNode(node, FAILURE_STRING);
        }
    }
    function isBlackListed(node, tc) {
        switch (node.expression.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
                // Example: foo.bar() or foo[bar]()
                // expressionNode is foo
                const nodeExpression = node.expression.expression;
                const nodeExpressionString = nodeExpression.getText();
                const nodeType = tc.getTypeAtLocation(nodeExpression);
                // nodeTypeString is the string representation of the type of foo
                let nodeTypeString = tc.typeToString(nodeType);
                if (nodeTypeString.endsWith('[]')) {
                    nodeTypeString = 'Array';
                }
                if (nodeTypeString === 'ObjectConstructor') {
                    nodeTypeString = 'Object';
                }
                if (tsutils.isTypeFlagSet(nodeType, ts.TypeFlags.StringLiteral)) {
                    nodeTypeString = 'string';
                }
                // nodeFunction is bar
                let nodeFunction = '';
                if (tsutils.isPropertyAccessExpression(node.expression)) {
                    nodeFunction = node.expression.name.getText();
                }
                if (tsutils.isElementAccessExpression(node.expression)) {
                    const argument = node.expression.argumentExpression;
                    if (argument !== undefined) {
                        nodeFunction = argument.getText();
                    }
                }
                // Check if 'foo#bar' or `${typeof foo}#bar` is in the blacklist.
                if (METHODS_TO_CHECK.has(`${nodeTypeString}#${nodeFunction}`) ||
                    METHODS_TO_CHECK.has(`${nodeExpressionString}#${nodeFunction}`)) {
                    return true;
                }
                // For 'str.replace(regexp|substr, newSubstr|function)' only check when
                // the second parameter is 'newSubstr'.
                if ((`${nodeTypeString}#${nodeFunction}` === 'string#replace') ||
                    (`${nodeExpressionString}#${nodeFunction}` === 'string#replace')) {
                    return node.arguments.length === 2 &&
                        !tsutils.isFunctionWithBody(node.arguments[1]);
                }
                break;
            case ts.SyntaxKind.Identifier:
                // Example: foo()
                // We currently don't have functions of this kind in blacklist.
                const identifier = node.expression;
                if (METHODS_TO_CHECK.has(identifier.text)) {
                    return true;
                }
                break;
            default:
                break;
        }
        return false;
    }
    function hasCheckReturnValueJsDoc(node, tc) {
        let symbol = tc.getSymbolAtLocation(node.expression);
        if (symbol === undefined) {
            return false;
        }
        if (tsutils.isSymbolFlagSet(symbol, ts.SymbolFlags.Alias)) {
            symbol = tc.getAliasedSymbol(symbol);
        }
        for (const jsDocTagInfo of symbol.getJsDocTags()) {
            if (jsDocTagInfo.name === 'checkReturnValue') {
                return true;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tfcmV0dXJuX3ZhbHVlX3J1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS9ydWxlcy9jaGVja19yZXR1cm5fdmFsdWVfcnVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0dBR0c7Ozs7Ozs7Ozs7OztJQUVILG1DQUFtQztJQUNuQyxpQ0FBaUM7SUFHakMsOENBQXdDO0lBQ3hDLGtDQUFxQztJQUVyQyxNQUFNLGNBQWMsR0FBRyx5QkFBeUI7VUFDMUMsK0NBQStDLENBQUM7SUFFdEQsK0VBQStFO0lBQy9FLGdGQUFnRjtJQUNoRiwrRUFBK0U7SUFDL0Usa0RBQWtEO0lBQ2xELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQVM7UUFDdkMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDO1FBQ25CLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUNuQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7UUFDaEIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQ2xCLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQztRQUNwQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7UUFDcEIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQ3BCLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQztRQUN2QixDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUM7UUFDdEIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQ3BCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztRQUNwQixDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUM7UUFDbkIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDO1FBQ25CLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztRQUNwQixDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUM7UUFDdkIsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUM7UUFDL0IsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUM7UUFDL0IsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDO1FBQ3pCLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQztRQUN6QixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7S0FDbkIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUvQixNQUFhLElBQUssU0FBUSxtQkFBWTtRQUF0Qzs7WUFDVyxhQUFRLEdBQUcsb0JBQW9CLENBQUM7WUFDaEMsU0FBSSxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUM7UUFRL0MsQ0FBQztRQU5DLHNFQUFzRTtRQUN0RSwyRUFBMkU7UUFDM0UsMkVBQTJFO1FBQzNFLFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRSxDQUFDO0tBQ0Y7SUFWRCxvQkFVQztJQUVELFNBQVMsbUJBQW1CLENBQUMsT0FBZ0IsRUFBRSxJQUF1QjtRQUNwRSw0RUFBNEU7UUFDNUUsc0VBQXNFO1FBQ3RFLElBQUksT0FBTyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZDLE9BQU87U0FDUjtRQUVELDhFQUE4RTtRQUM5RSxtQ0FBbUM7UUFDbkMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDNUMsT0FBTzthQUNSO1lBQ0QseUVBQXlFO1lBQ3pFLDRFQUE0RTtZQUM1RSxpRUFBaUU7WUFDakUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQztnQkFDekMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUN4RCxPQUFPO2FBQ1I7WUFFRCxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQ2hEO0lBQ0gsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLElBQXVCLEVBQUUsRUFBa0I7UUFHaEUsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRTtZQUM1QixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUM7WUFDNUMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLHVCQUF1QjtnQkFDeEMsbUNBQW1DO2dCQUNuQyx3QkFBd0I7Z0JBQ3hCLE1BQU0sY0FBYyxHQUFJLElBQUksQ0FBQyxVQUErQixDQUFDLFVBQVUsQ0FBQztnQkFDeEUsTUFBTSxvQkFBb0IsR0FBRyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3RELE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFFdEQsaUVBQWlFO2dCQUNqRSxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2pDLGNBQWMsR0FBRyxPQUFPLENBQUM7aUJBQzFCO2dCQUNELElBQUksY0FBYyxLQUFLLG1CQUFtQixFQUFFO29CQUMxQyxjQUFjLEdBQUcsUUFBUSxDQUFDO2lCQUMzQjtnQkFDRCxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQUU7b0JBQy9ELGNBQWMsR0FBRyxRQUFRLENBQUM7aUJBQzNCO2dCQUVELHNCQUFzQjtnQkFDdEIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO2dCQUN0QixJQUFJLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3ZELFlBQVksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDL0M7Z0JBQ0QsSUFBSSxPQUFPLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUN0RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDO29CQUNwRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7d0JBQzFCLFlBQVksR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7cUJBQ25DO2lCQUNGO2dCQUVELGlFQUFpRTtnQkFDakUsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxjQUFjLElBQUksWUFBWSxFQUFFLENBQUM7b0JBQ3pELGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxHQUFHLG9CQUFvQixJQUFJLFlBQVksRUFBRSxDQUFDLEVBQUU7b0JBQ25FLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELHVFQUF1RTtnQkFDdkUsdUNBQXVDO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxjQUFjLElBQUksWUFBWSxFQUFFLEtBQUssZ0JBQWdCLENBQUM7b0JBQzFELENBQUMsR0FBRyxvQkFBb0IsSUFBSSxZQUFZLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUFFO29CQUNwRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzlCLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDcEQ7Z0JBQ0QsTUFBTTtZQUNSLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVO2dCQUMzQixpQkFBaUI7Z0JBQ2pCLCtEQUErRDtnQkFDL0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQTJCLENBQUM7Z0JBQ3BELElBQUksZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDekMsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBQ0QsTUFBTTtZQUNSO2dCQUNFLE1BQU07U0FDVDtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsd0JBQXdCLENBQUMsSUFBdUIsRUFBRSxFQUFrQjtRQUMzRSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUN4QixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3pELE1BQU0sR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDdEM7UUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRTtZQUNoRCxJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssa0JBQWtCLEVBQUU7Z0JBQzVDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBBIFRzZXRzZSBydWxlIHRoYXQgY2hlY2tzIHRoZSByZXR1cm4gdmFsdWUgb2YgY2VydGFpbiBmdW5jdGlvbnNcbiAqIG11c3QgYmUgdXNlZC5cbiAqL1xuXG5pbXBvcnQgKiBhcyB0c3V0aWxzIGZyb20gJ3RzdXRpbHMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q2hlY2tlcn0gZnJvbSAnLi4vY2hlY2tlcic7XG5pbXBvcnQge0Vycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JfY29kZSc7XG5pbXBvcnQge0Fic3RyYWN0UnVsZX0gZnJvbSAnLi4vcnVsZSc7XG5cbmNvbnN0IEZBSUxVUkVfU1RSSU5HID0gJ3JldHVybiB2YWx1ZSBpcyB1bnVzZWQuJ1xuICAgICsgJ1xcblxcdFNlZSBodHRwOi8vdHNldHNlLmluZm8vY2hlY2stcmV0dXJuLXZhbHVlJztcblxuLy8gQSBsaXN0IG9mIHdlbGwta25vd24gZnVuY3Rpb25zIHRoYXQgdGhlIHJldHVybiB2YWx1ZSBtdXN0IGJlIHVzZWQuIElmIHVudXNlZFxuLy8gdGhlbiB0aGUgZnVuY3Rpb24gY2FsbCBpcyBlaXRoZXIgYSBuby1vcCAoZS5nLiAnZm9vLnRyaW0oKScgZm9vIGlzIHVuY2hhbmdlZClcbi8vIG9yIGNhbiBiZSByZXBsYWNlZCBieSBhbm90aGVyIChBcnJheS5tYXAoKSBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBhIGxvb3Agb3Jcbi8vIEFycmF5LmZvckVhY2goKSBpZiB0aGUgcmV0dXJuIHZhbHVlIGlzIHVudXNlZCkuXG5jb25zdCBNRVRIT0RTX1RPX0NIRUNLID0gbmV3IFNldDxzdHJpbmc+KFtcbiAgWydBcnJheScsICdjb25jYXQnXSxcbiAgWydBcnJheScsICdmaWx0ZXInXSxcbiAgWydBcnJheScsICdtYXAnXSxcbiAgWydBcnJheScsICdzbGljZSddLFxuICBbJ0Z1bmN0aW9uJywgJ2JpbmQnXSxcbiAgWydPYmplY3QnLCAnY3JlYXRlJ10sXG4gIFsnc3RyaW5nJywgJ2NvbmNhdCddLFxuICBbJ3N0cmluZycsICdub3JtYWxpemUnXSxcbiAgWydzdHJpbmcnLCAncGFkU3RhcnQnXSxcbiAgWydzdHJpbmcnLCAncGFkRW5kJ10sXG4gIFsnc3RyaW5nJywgJ3JlcGVhdCddLFxuICBbJ3N0cmluZycsICdzbGljZSddLFxuICBbJ3N0cmluZycsICdzcGxpdCddLFxuICBbJ3N0cmluZycsICdzdWJzdHInXSxcbiAgWydzdHJpbmcnLCAnc3Vic3RyaW5nJ10sXG4gIFsnc3RyaW5nJywgJ3RvTG9jYWxlTG93ZXJDYXNlJ10sXG4gIFsnc3RyaW5nJywgJ3RvTG9jYWxlVXBwZXJDYXNlJ10sXG4gIFsnc3RyaW5nJywgJ3RvTG93ZXJDYXNlJ10sXG4gIFsnc3RyaW5nJywgJ3RvVXBwZXJDYXNlJ10sXG4gIFsnc3RyaW5nJywgJ3RyaW0nXSxcbl0ubWFwKGxpc3QgPT4gbGlzdC5qb2luKCcjJykpKTtcblxuZXhwb3J0IGNsYXNzIFJ1bGUgZXh0ZW5kcyBBYnN0cmFjdFJ1bGUge1xuICByZWFkb25seSBydWxlTmFtZSA9ICdjaGVjay1yZXR1cm4tdmFsdWUnO1xuICByZWFkb25seSBjb2RlID0gRXJyb3JDb2RlLkNIRUNLX1JFVFVSTl9WQUxVRTtcblxuICAvLyByZWdpc3RlcnMgY2hlY2tDYWxsRXhwcmVzc2lvbigpIGZ1bmN0aW9uIG9uIHRzLkNhbGxFeHByZXNzaW9uIG5vZGUuXG4gIC8vIFR5cGVTY3JpcHQgY29uZm9ybWFuY2Ugd2lsbCB0cmF2ZXJzZSB0aGUgQVNUIG9mIGVhY2ggc291cmNlIGZpbGUgYW5kIHJ1blxuICAvLyBjaGVja0NhbGxFeHByZXNzaW9uKCkgZXZlcnkgdGltZSBpdCBlbmNvdW50ZXJzIGEgdHMuQ2FsbEV4cHJlc3Npb24gbm9kZS5cbiAgcmVnaXN0ZXIoY2hlY2tlcjogQ2hlY2tlcikge1xuICAgIGNoZWNrZXIub24odHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbiwgY2hlY2tDYWxsRXhwcmVzc2lvbiwgdGhpcy5jb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja0NhbGxFeHByZXNzaW9uKGNoZWNrZXI6IENoZWNrZXIsIG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uKSB7XG4gIC8vIFNob3J0LWNpcmN1aXQgYmVmb3JlIHVzaW5nIHRoZSB0eXBlY2hlY2tlciBpZiBwb3NzaWJsZSwgYXMgaXRzIGV4cGVuc2l2ZS5cbiAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8yNzk5N1xuICBpZiAodHN1dGlscy5pc0V4cHJlc3Npb25WYWx1ZVVzZWQobm9kZSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBDaGVjayBpZiB0aGlzIENhbGxFeHByZXNzaW9uIGlzIG9uZSBvZiB0aGUgd2VsbC1rbm93biBmdW5jdGlvbnMgYW5kIHJldHVybnNcbiAgLy8gYSBub24tdm9pZCB2YWx1ZSB0aGF0IGlzIHVudXNlZC5cbiAgY29uc3Qgc2lnbmF0dXJlID0gY2hlY2tlci50eXBlQ2hlY2tlci5nZXRSZXNvbHZlZFNpZ25hdHVyZShub2RlKTtcbiAgaWYgKHNpZ25hdHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgcmV0dXJuVHlwZSA9IGNoZWNrZXIudHlwZUNoZWNrZXIuZ2V0UmV0dXJuVHlwZU9mU2lnbmF0dXJlKHNpZ25hdHVyZSk7XG4gICAgaWYgKCEhKHJldHVyblR5cGUuZmxhZ3MgJiB0cy5UeXBlRmxhZ3MuVm9pZCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQWx0aG91Z2ggaGFzQ2hlY2tSZXR1cm5WYWx1ZUpzRG9jKCkgaXMgZmFzdGVyIHRoYW4gaXNCbGFja0xpc3RlZCgpLCBpdFxuICAgIC8vIHJldHVybnMgZmFsc2UgbW9zdCBvZiB0aGUgdGltZSBhbmQgdGh1cyBpc0JsYWNrTGlzdGVkKCkgd291bGQgaGF2ZSB0byBydW5cbiAgICAvLyBhbnl3YXkuIFRoZXJlZm9yZSB3ZSBzaG9ydC1jaXJjdWl0IGhhc0NoZWNrUmV0dXJuVmFsdWVKc0RvYygpLlxuICAgIGlmICghaXNCbGFja0xpc3RlZChub2RlLCBjaGVja2VyLnR5cGVDaGVja2VyKSAmJlxuICAgICAgICAhaGFzQ2hlY2tSZXR1cm5WYWx1ZUpzRG9jKG5vZGUsIGNoZWNrZXIudHlwZUNoZWNrZXIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2hlY2tlci5hZGRGYWlsdXJlQXROb2RlKG5vZGUsIEZBSUxVUkVfU1RSSU5HKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0JsYWNrTGlzdGVkKG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uLCB0YzogdHMuVHlwZUNoZWNrZXIpOiBib29sZWFuIHtcbiAgdHlwZSBBY2Nlc3NFeHByZXNzaW9uID1cbiAgICAgIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbnx0cy5FbGVtZW50QWNjZXNzRXhwcmVzc2lvbjtcbiAgc3dpdGNoIChub2RlLmV4cHJlc3Npb24ua2luZCkge1xuICAgIGNhc2UgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb246XG4gICAgY2FzZSB0cy5TeW50YXhLaW5kLkVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uOlxuICAgICAgLy8gRXhhbXBsZTogZm9vLmJhcigpIG9yIGZvb1tiYXJdKClcbiAgICAgIC8vIGV4cHJlc3Npb25Ob2RlIGlzIGZvb1xuICAgICAgY29uc3Qgbm9kZUV4cHJlc3Npb24gPSAobm9kZS5leHByZXNzaW9uIGFzIEFjY2Vzc0V4cHJlc3Npb24pLmV4cHJlc3Npb247XG4gICAgICBjb25zdCBub2RlRXhwcmVzc2lvblN0cmluZyA9IG5vZGVFeHByZXNzaW9uLmdldFRleHQoKTtcbiAgICAgIGNvbnN0IG5vZGVUeXBlID0gdGMuZ2V0VHlwZUF0TG9jYXRpb24obm9kZUV4cHJlc3Npb24pO1xuXG4gICAgICAvLyBub2RlVHlwZVN0cmluZyBpcyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0eXBlIG9mIGZvb1xuICAgICAgbGV0IG5vZGVUeXBlU3RyaW5nID0gdGMudHlwZVRvU3RyaW5nKG5vZGVUeXBlKTtcbiAgICAgIGlmIChub2RlVHlwZVN0cmluZy5lbmRzV2l0aCgnW10nKSkge1xuICAgICAgICBub2RlVHlwZVN0cmluZyA9ICdBcnJheSc7XG4gICAgICB9XG4gICAgICBpZiAobm9kZVR5cGVTdHJpbmcgPT09ICdPYmplY3RDb25zdHJ1Y3RvcicpIHtcbiAgICAgICAgbm9kZVR5cGVTdHJpbmcgPSAnT2JqZWN0JztcbiAgICAgIH1cbiAgICAgIGlmICh0c3V0aWxzLmlzVHlwZUZsYWdTZXQobm9kZVR5cGUsIHRzLlR5cGVGbGFncy5TdHJpbmdMaXRlcmFsKSkge1xuICAgICAgICBub2RlVHlwZVN0cmluZyA9ICdzdHJpbmcnO1xuICAgICAgfVxuXG4gICAgICAvLyBub2RlRnVuY3Rpb24gaXMgYmFyXG4gICAgICBsZXQgbm9kZUZ1bmN0aW9uID0gJyc7XG4gICAgICBpZiAodHN1dGlscy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pKSB7XG4gICAgICAgIG5vZGVGdW5jdGlvbiA9IG5vZGUuZXhwcmVzc2lvbi5uYW1lLmdldFRleHQoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0c3V0aWxzLmlzRWxlbWVudEFjY2Vzc0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSkge1xuICAgICAgICBjb25zdCBhcmd1bWVudCA9IG5vZGUuZXhwcmVzc2lvbi5hcmd1bWVudEV4cHJlc3Npb247XG4gICAgICAgIGlmIChhcmd1bWVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbm9kZUZ1bmN0aW9uID0gYXJndW1lbnQuZ2V0VGV4dCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmICdmb28jYmFyJyBvciBgJHt0eXBlb2YgZm9vfSNiYXJgIGlzIGluIHRoZSBibGFja2xpc3QuXG4gICAgICBpZiAoTUVUSE9EU19UT19DSEVDSy5oYXMoYCR7bm9kZVR5cGVTdHJpbmd9IyR7bm9kZUZ1bmN0aW9ufWApIHx8XG4gICAgICAgICAgTUVUSE9EU19UT19DSEVDSy5oYXMoYCR7bm9kZUV4cHJlc3Npb25TdHJpbmd9IyR7bm9kZUZ1bmN0aW9ufWApKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgJ3N0ci5yZXBsYWNlKHJlZ2V4cHxzdWJzdHIsIG5ld1N1YnN0cnxmdW5jdGlvbiknIG9ubHkgY2hlY2sgd2hlblxuICAgICAgLy8gdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgJ25ld1N1YnN0cicuXG4gICAgICBpZiAoKGAke25vZGVUeXBlU3RyaW5nfSMke25vZGVGdW5jdGlvbn1gID09PSAnc3RyaW5nI3JlcGxhY2UnKSB8fFxuICAgICAgICAgIChgJHtub2RlRXhwcmVzc2lvblN0cmluZ30jJHtub2RlRnVuY3Rpb259YCA9PT0gJ3N0cmluZyNyZXBsYWNlJykpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJlxuICAgICAgICAgICAgIXRzdXRpbHMuaXNGdW5jdGlvbldpdGhCb2R5KG5vZGUuYXJndW1lbnRzWzFdKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgdHMuU3ludGF4S2luZC5JZGVudGlmaWVyOlxuICAgICAgLy8gRXhhbXBsZTogZm9vKClcbiAgICAgIC8vIFdlIGN1cnJlbnRseSBkb24ndCBoYXZlIGZ1bmN0aW9ucyBvZiB0aGlzIGtpbmQgaW4gYmxhY2tsaXN0LlxuICAgICAgY29uc3QgaWRlbnRpZmllciA9IG5vZGUuZXhwcmVzc2lvbiBhcyB0cy5JZGVudGlmaWVyO1xuICAgICAgaWYgKE1FVEhPRFNfVE9fQ0hFQ0suaGFzKGlkZW50aWZpZXIudGV4dCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBoYXNDaGVja1JldHVyblZhbHVlSnNEb2Mobm9kZTogdHMuQ2FsbEV4cHJlc3Npb24sIHRjOiB0cy5UeXBlQ2hlY2tlcikge1xuICBsZXQgc3ltYm9sID0gdGMuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlLmV4cHJlc3Npb24pO1xuICBpZiAoc3ltYm9sID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAodHN1dGlscy5pc1N5bWJvbEZsYWdTZXQoc3ltYm9sLCB0cy5TeW1ib2xGbGFncy5BbGlhcykpIHtcbiAgICBzeW1ib2wgPSB0Yy5nZXRBbGlhc2VkU3ltYm9sKHN5bWJvbCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IGpzRG9jVGFnSW5mbyBvZiBzeW1ib2wuZ2V0SnNEb2NUYWdzKCkpIHtcbiAgICBpZiAoanNEb2NUYWdJbmZvLm5hbWUgPT09ICdjaGVja1JldHVyblZhbHVlJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==