/**
 * @fileoverview A Tsetse rule that checks that all promises in async function
 * blocks are awaited or used.
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
    const FAILURE_STRING = 'All Promises in async functions must either be awaited or used in an expression.' +
        '\n\tSee http://tsetse.info/must-use-promises';
    class Rule extends rule_1.AbstractRule {
        constructor() {
            super(...arguments);
            this.ruleName = 'must-use-promises';
            this.code = error_code_1.ErrorCode.MUST_USE_PROMISES;
        }
        register(checker) {
            checker.on(ts.SyntaxKind.CallExpression, checkCallExpression, this.code);
        }
    }
    exports.Rule = Rule;
    function checkCallExpression(checker, node) {
        // Short-circuit before using the typechecker if possible, as its expensive.
        // Workaround for https://github.com/Microsoft/TypeScript/issues/27997
        if (tsutils.isExpressionValueUsed(node) || !inAsyncFunction(node)) {
            return;
        }
        if (tsutils.isThenableType(checker.typeChecker, node)) {
            checker.addFailureAtNode(node, FAILURE_STRING);
        }
    }
    function inAsyncFunction(node) {
        for (let inode = node.parent; inode !== undefined; inode = inode.parent) {
            switch (inode.kind) {
                case ts.SyntaxKind.ArrowFunction:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.FunctionExpression:
                case ts.SyntaxKind.MethodDeclaration:
                    // Potentially async
                    return tsutils.hasModifier(inode.modifiers, ts.SyntaxKind.AsyncKeyword);
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                    // These cannot be async
                    return false;
                default:
                    // Loop and check parent
                    break;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVzdF91c2VfcHJvbWlzZXNfcnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL3J1bGVzL211c3RfdXNlX3Byb21pc2VzX3J1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7SUFFSCxtQ0FBbUM7SUFDbkMsaUNBQWlDO0lBR2pDLDhDQUF3QztJQUN4QyxrQ0FBcUM7SUFFckMsTUFBTSxjQUFjLEdBQ2hCLGtGQUFrRjtRQUNsRiw4Q0FBOEMsQ0FBQztJQUVuRCxNQUFhLElBQUssU0FBUSxtQkFBWTtRQUF0Qzs7WUFDVyxhQUFRLEdBQUcsbUJBQW1CLENBQUM7WUFDL0IsU0FBSSxHQUFHLHNCQUFTLENBQUMsaUJBQWlCLENBQUM7UUFLOUMsQ0FBQztRQUhDLFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRSxDQUFDO0tBQ0Y7SUFQRCxvQkFPQztJQUVELFNBQVMsbUJBQW1CLENBQUMsT0FBZ0IsRUFBRSxJQUF1QjtRQUNwRSw0RUFBNEU7UUFDNUUsc0VBQXNFO1FBQ3RFLElBQUksT0FBTyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2pFLE9BQU87U0FDUjtRQUVELElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3JELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDaEQ7SUFDSCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsSUFBYTtRQUNwQyxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxLQUFLLFNBQVMsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUN2RSxRQUFRLEtBQUssQ0FBQyxJQUFJLEVBQUU7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7Z0JBQ2pDLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDdkMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDO2dCQUN0QyxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCO29CQUNsQyxvQkFBb0I7b0JBQ3BCLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzFFLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7Z0JBQy9CLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXO29CQUM1Qix3QkFBd0I7b0JBQ3hCLE9BQU8sS0FBSyxDQUFDO2dCQUNmO29CQUNFLHdCQUF3QjtvQkFDeEIsTUFBTTthQUNUO1NBQ0Y7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBUc2V0c2UgcnVsZSB0aGF0IGNoZWNrcyB0aGF0IGFsbCBwcm9taXNlcyBpbiBhc3luYyBmdW5jdGlvblxuICogYmxvY2tzIGFyZSBhd2FpdGVkIG9yIHVzZWQuXG4gKi9cblxuaW1wb3J0ICogYXMgdHN1dGlscyBmcm9tICd0c3V0aWxzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NoZWNrZXJ9IGZyb20gJy4uL2NoZWNrZXInO1xuaW1wb3J0IHtFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9yX2NvZGUnO1xuaW1wb3J0IHtBYnN0cmFjdFJ1bGV9IGZyb20gJy4uL3J1bGUnO1xuXG5jb25zdCBGQUlMVVJFX1NUUklORyA9XG4gICAgJ0FsbCBQcm9taXNlcyBpbiBhc3luYyBmdW5jdGlvbnMgbXVzdCBlaXRoZXIgYmUgYXdhaXRlZCBvciB1c2VkIGluIGFuIGV4cHJlc3Npb24uJyArXG4gICAgJ1xcblxcdFNlZSBodHRwOi8vdHNldHNlLmluZm8vbXVzdC11c2UtcHJvbWlzZXMnO1xuXG5leHBvcnQgY2xhc3MgUnVsZSBleHRlbmRzIEFic3RyYWN0UnVsZSB7XG4gIHJlYWRvbmx5IHJ1bGVOYW1lID0gJ211c3QtdXNlLXByb21pc2VzJztcbiAgcmVhZG9ubHkgY29kZSA9IEVycm9yQ29kZS5NVVNUX1VTRV9QUk9NSVNFUztcblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbih0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uLCBjaGVja0NhbGxFeHByZXNzaW9uLCB0aGlzLmNvZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrQ2FsbEV4cHJlc3Npb24oY2hlY2tlcjogQ2hlY2tlciwgbm9kZTogdHMuQ2FsbEV4cHJlc3Npb24pIHtcbiAgLy8gU2hvcnQtY2lyY3VpdCBiZWZvcmUgdXNpbmcgdGhlIHR5cGVjaGVja2VyIGlmIHBvc3NpYmxlLCBhcyBpdHMgZXhwZW5zaXZlLlxuICAvLyBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzI3OTk3XG4gIGlmICh0c3V0aWxzLmlzRXhwcmVzc2lvblZhbHVlVXNlZChub2RlKSB8fCAhaW5Bc3luY0Z1bmN0aW9uKG5vZGUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHRzdXRpbHMuaXNUaGVuYWJsZVR5cGUoY2hlY2tlci50eXBlQ2hlY2tlciwgbm9kZSkpIHtcbiAgICBjaGVja2VyLmFkZEZhaWx1cmVBdE5vZGUobm9kZSwgRkFJTFVSRV9TVFJJTkcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluQXN5bmNGdW5jdGlvbihub2RlOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGlub2RlID0gbm9kZS5wYXJlbnQ7IGlub2RlICE9PSB1bmRlZmluZWQ7IGlub2RlID0gaW5vZGUucGFyZW50KSB7XG4gICAgc3dpdGNoIChpbm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQXJyb3dGdW5jdGlvbjpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5GdW5jdGlvbkRlY2xhcmF0aW9uOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZ1bmN0aW9uRXhwcmVzc2lvbjpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5NZXRob2REZWNsYXJhdGlvbjpcbiAgICAgICAgLy8gUG90ZW50aWFsbHkgYXN5bmNcbiAgICAgICAgcmV0dXJuIHRzdXRpbHMuaGFzTW9kaWZpZXIoaW5vZGUubW9kaWZpZXJzLCB0cy5TeW50YXhLaW5kLkFzeW5jS2V5d29yZCk7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuR2V0QWNjZXNzb3I6XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU2V0QWNjZXNzb3I6XG4gICAgICAgIC8vIFRoZXNlIGNhbm5vdCBiZSBhc3luY1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBMb29wIGFuZCBjaGVjayBwYXJlbnRcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19