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
     * The engine for BANNED_CALL_NON_CONSTANT_ARGUMENT.
     *
     * This takes any amount of (functionName, argument) position pairs, separated
     * by a colon. The first part matches symbols that were defined on the global
     * scope, and their fields, without going through a prototype chain.
     *
     * For instance, "URL.createObjectURL:0" will target any createObjectURL-named
     * call on a URL-named object (like the ambient URL declared in lib.dom.d.ts),
     * or "Car.buildFromParts:1" will match any buildFromParts reached from a
     * Car-named symbol, including a hypothetical class with a static member
     * function "buildFromParts" that lives in its own module.
     */
    class CallNonConstantArgumentEngine extends pattern_engine_1.PatternEngine {
        constructor(config, fixer) {
            super(config, fixer);
            this.matchers = [];
            for (const v of config.values) {
                const [matcherSpec, strPosition] = v.split(':', 2);
                if (!matcherSpec || !strPosition.match('^\\d+$')) {
                    throw new Error('Couldn\'t parse values');
                }
                const position = Number(strPosition);
                this.matchers.push([new match_symbol_1.AbsoluteMatcher(matcherSpec), position]);
            }
        }
        register(checker) {
            checker.on(ts.SyntaxKind.CallExpression, this.checkAndFilterResults.bind(this), error_code_1.ErrorCode.CONFORMANCE_PATTERN);
        }
        check(tc, n) {
            if (!ts.isCallExpression(n)) {
                ast_tools_1.debugLog(`Should not happen: node is not a CallExpression`);
                return;
            }
            ast_tools_1.debugLog(`inspecting ${n.getText().trim()}`);
            /**
             * Inspects a particular CallExpression to see if it calls the target
             * function with a non-literal parameter in the target position. Returns
             * that CallExpression if `n` matches the search, undefined otherwise.
             */
            function checkIndividual(n, m) {
                if (!m[0].matches(n.expression, tc)) {
                    ast_tools_1.debugLog(`Wrong symbol, not ${m[0].bannedName}`);
                    return;
                }
                if (n.arguments.length < m[1]) {
                    ast_tools_1.debugLog(`Good symbol, not enough arguments to match (got ${n.arguments.length}, want ${m[1]})`);
                    return;
                }
                if (is_literal_1.isLiteral(tc, n.arguments[m[1]])) {
                    ast_tools_1.debugLog(`Good symbol, argument literal`);
                    return;
                }
                ast_tools_1.debugLog(`Match. Reporting failure (boundaries: ${n.getStart()}, ${n.getEnd()}] on node [${n.getText()}]`);
                return n;
            }
            for (const m of this.matchers) {
                // The first matching matcher will be used.
                const r = checkIndividual(n, m);
                if (r)
                    return r;
            }
            // No match.
            return;
        }
    }
    exports.CallNonConstantArgumentEngine = CallNonConstantArgumentEngine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZV9jYWxsX25vbl9jb25zdGFudF9hcmd1bWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL3V0aWwvcGF0dGVybl9lbmdpbmVzL25hbWVfY2FsbF9ub25fY29uc3RhbnRfYXJndW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQSxpQ0FBaUM7SUFFakMsaURBQTJDO0lBQzNDLDRDQUFzQztJQUV0Qyw4Q0FBd0M7SUFDeEMsa0RBQWdEO0lBRWhELHFEQUErQztJQUUvQzs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxNQUFhLDZCQUE4QixTQUFRLDhCQUFhO1FBRzlELFlBQVksTUFBYyxFQUFFLEtBQWE7WUFDdkMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUhOLGFBQVEsR0FBcUMsRUFBRSxDQUFDO1lBSS9ELEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDN0IsTUFBTSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ2hELE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztpQkFDM0M7Z0JBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksOEJBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ2xFO1FBQ0gsQ0FBQztRQUVELFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixPQUFPLENBQUMsRUFBRSxDQUNOLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ25FLHNCQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsS0FBSyxDQUFDLEVBQWtCLEVBQUUsQ0FBVTtZQUNsQyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMzQixvQkFBUSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7Z0JBQzVELE9BQU87YUFDUjtZQUNELG9CQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTdDOzs7O2VBSUc7WUFDSCxTQUFTLGVBQWUsQ0FDcEIsQ0FBb0IsRUFBRSxDQUE0QjtnQkFFcEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDbkMsb0JBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7b0JBQ2pELE9BQU87aUJBQ1I7Z0JBQ0QsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdCLG9CQUFRLENBQUMsbURBQ0wsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDekMsT0FBTztpQkFDUjtnQkFDRCxJQUFJLHNCQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDcEMsb0JBQVEsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO29CQUMxQyxPQUFPO2lCQUNSO2dCQUNELG9CQUFRLENBQUMseUNBQXlDLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FDMUQsQ0FBQyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzVDLE9BQU8sQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUVELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDN0IsMkNBQTJDO2dCQUMzQyxNQUFNLENBQUMsR0FBRyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLENBQUM7b0JBQUUsT0FBTyxDQUFDLENBQUM7YUFDakI7WUFDRCxZQUFZO1lBQ1osT0FBTztRQUNULENBQUM7S0FDRjtJQTlERCxzRUE4REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Q2hlY2tlcn0gZnJvbSAnLi4vLi4vY2hlY2tlcic7XG5pbXBvcnQge0Vycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JfY29kZSc7XG5pbXBvcnQge2RlYnVnTG9nfSBmcm9tICcuLi9hc3RfdG9vbHMnO1xuaW1wb3J0IHtGaXhlcn0gZnJvbSAnLi4vZml4ZXInO1xuaW1wb3J0IHtpc0xpdGVyYWx9IGZyb20gJy4uL2lzX2xpdGVyYWwnO1xuaW1wb3J0IHtBYnNvbHV0ZU1hdGNoZXJ9IGZyb20gJy4uL21hdGNoX3N5bWJvbCc7XG5pbXBvcnQge0NvbmZpZ30gZnJvbSAnLi4vcGF0dGVybl9jb25maWcnO1xuaW1wb3J0IHtQYXR0ZXJuRW5naW5lfSBmcm9tICcuL3BhdHRlcm5fZW5naW5lJztcblxuLyoqXG4gKiBUaGUgZW5naW5lIGZvciBCQU5ORURfQ0FMTF9OT05fQ09OU1RBTlRfQVJHVU1FTlQuXG4gKlxuICogVGhpcyB0YWtlcyBhbnkgYW1vdW50IG9mIChmdW5jdGlvbk5hbWUsIGFyZ3VtZW50KSBwb3NpdGlvbiBwYWlycywgc2VwYXJhdGVkXG4gKiBieSBhIGNvbG9uLiBUaGUgZmlyc3QgcGFydCBtYXRjaGVzIHN5bWJvbHMgdGhhdCB3ZXJlIGRlZmluZWQgb24gdGhlIGdsb2JhbFxuICogc2NvcGUsIGFuZCB0aGVpciBmaWVsZHMsIHdpdGhvdXQgZ29pbmcgdGhyb3VnaCBhIHByb3RvdHlwZSBjaGFpbi5cbiAqXG4gKiBGb3IgaW5zdGFuY2UsIFwiVVJMLmNyZWF0ZU9iamVjdFVSTDowXCIgd2lsbCB0YXJnZXQgYW55IGNyZWF0ZU9iamVjdFVSTC1uYW1lZFxuICogY2FsbCBvbiBhIFVSTC1uYW1lZCBvYmplY3QgKGxpa2UgdGhlIGFtYmllbnQgVVJMIGRlY2xhcmVkIGluIGxpYi5kb20uZC50cyksXG4gKiBvciBcIkNhci5idWlsZEZyb21QYXJ0czoxXCIgd2lsbCBtYXRjaCBhbnkgYnVpbGRGcm9tUGFydHMgcmVhY2hlZCBmcm9tIGFcbiAqIENhci1uYW1lZCBzeW1ib2wsIGluY2x1ZGluZyBhIGh5cG90aGV0aWNhbCBjbGFzcyB3aXRoIGEgc3RhdGljIG1lbWJlclxuICogZnVuY3Rpb24gXCJidWlsZEZyb21QYXJ0c1wiIHRoYXQgbGl2ZXMgaW4gaXRzIG93biBtb2R1bGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWxsTm9uQ29uc3RhbnRBcmd1bWVudEVuZ2luZSBleHRlbmRzIFBhdHRlcm5FbmdpbmUge1xuICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoZXJzOiBBcnJheTxbQWJzb2x1dGVNYXRjaGVyLCBudW1iZXJdPiA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29uZmlnLCBmaXhlcj86IEZpeGVyKSB7XG4gICAgc3VwZXIoY29uZmlnLCBmaXhlcik7XG4gICAgZm9yIChjb25zdCB2IG9mIGNvbmZpZy52YWx1ZXMpIHtcbiAgICAgIGNvbnN0IFttYXRjaGVyU3BlYywgc3RyUG9zaXRpb25dID0gdi5zcGxpdCgnOicsIDIpO1xuICAgICAgaWYgKCFtYXRjaGVyU3BlYyB8fCAhc3RyUG9zaXRpb24ubWF0Y2goJ15cXFxcZCskJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZG5cXCd0IHBhcnNlIHZhbHVlcycpO1xuICAgICAgfVxuICAgICAgY29uc3QgcG9zaXRpb24gPSBOdW1iZXIoc3RyUG9zaXRpb24pO1xuICAgICAgdGhpcy5tYXRjaGVycy5wdXNoKFtuZXcgQWJzb2x1dGVNYXRjaGVyKG1hdGNoZXJTcGVjKSwgcG9zaXRpb25dKTtcbiAgICB9XG4gIH1cblxuICByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgY2hlY2tlci5vbihcbiAgICAgICAgdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbiwgdGhpcy5jaGVja0FuZEZpbHRlclJlc3VsdHMuYmluZCh0aGlzKSxcbiAgICAgICAgRXJyb3JDb2RlLkNPTkZPUk1BTkNFX1BBVFRFUk4pO1xuICB9XG5cbiAgY2hlY2sodGM6IHRzLlR5cGVDaGVja2VyLCBuOiB0cy5Ob2RlKTogdHMuTm9kZXx1bmRlZmluZWQge1xuICAgIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihuKSkge1xuICAgICAgZGVidWdMb2coYFNob3VsZCBub3QgaGFwcGVuOiBub2RlIGlzIG5vdCBhIENhbGxFeHByZXNzaW9uYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlYnVnTG9nKGBpbnNwZWN0aW5nICR7bi5nZXRUZXh0KCkudHJpbSgpfWApO1xuXG4gICAgLyoqXG4gICAgICogSW5zcGVjdHMgYSBwYXJ0aWN1bGFyIENhbGxFeHByZXNzaW9uIHRvIHNlZSBpZiBpdCBjYWxscyB0aGUgdGFyZ2V0XG4gICAgICogZnVuY3Rpb24gd2l0aCBhIG5vbi1saXRlcmFsIHBhcmFtZXRlciBpbiB0aGUgdGFyZ2V0IHBvc2l0aW9uLiBSZXR1cm5zXG4gICAgICogdGhhdCBDYWxsRXhwcmVzc2lvbiBpZiBgbmAgbWF0Y2hlcyB0aGUgc2VhcmNoLCB1bmRlZmluZWQgb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNoZWNrSW5kaXZpZHVhbChcbiAgICAgICAgbjogdHMuQ2FsbEV4cHJlc3Npb24sIG06IFtBYnNvbHV0ZU1hdGNoZXIsIG51bWJlcl0pOiB0cy5DYWxsRXhwcmVzc2lvbnxcbiAgICAgICAgdW5kZWZpbmVkIHtcbiAgICAgIGlmICghbVswXS5tYXRjaGVzKG4uZXhwcmVzc2lvbiwgdGMpKSB7XG4gICAgICAgIGRlYnVnTG9nKGBXcm9uZyBzeW1ib2wsIG5vdCAke21bMF0uYmFubmVkTmFtZX1gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG4uYXJndW1lbnRzLmxlbmd0aCA8IG1bMV0pIHtcbiAgICAgICAgZGVidWdMb2coYEdvb2Qgc3ltYm9sLCBub3QgZW5vdWdoIGFyZ3VtZW50cyB0byBtYXRjaCAoZ290ICR7XG4gICAgICAgICAgICBuLmFyZ3VtZW50cy5sZW5ndGh9LCB3YW50ICR7bVsxXX0pYCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChpc0xpdGVyYWwodGMsIG4uYXJndW1lbnRzW21bMV1dKSkge1xuICAgICAgICBkZWJ1Z0xvZyhgR29vZCBzeW1ib2wsIGFyZ3VtZW50IGxpdGVyYWxgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGVidWdMb2coYE1hdGNoLiBSZXBvcnRpbmcgZmFpbHVyZSAoYm91bmRhcmllczogJHtuLmdldFN0YXJ0KCl9LCAke1xuICAgICAgICAgIG4uZ2V0RW5kKCl9XSBvbiBub2RlIFske24uZ2V0VGV4dCgpfV1gKTtcbiAgICAgIHJldHVybiBuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbSBvZiB0aGlzLm1hdGNoZXJzKSB7XG4gICAgICAvLyBUaGUgZmlyc3QgbWF0Y2hpbmcgbWF0Y2hlciB3aWxsIGJlIHVzZWQuXG4gICAgICBjb25zdCByID0gY2hlY2tJbmRpdmlkdWFsKG4sIG0pO1xuICAgICAgaWYgKHIpIHJldHVybiByO1xuICAgIH1cbiAgICAvLyBObyBtYXRjaC5cbiAgICByZXR1cm47XG4gIH1cbn1cbiJdfQ==