/**
 * @fileoverview Runner is the entry point of running Tsetse checks in compiler.
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./checker", "./rules/ban_expect_truthy_promise_rule", "./rules/ban_promise_as_condition_rule", "./rules/check_return_value_rule", "./rules/equals_nan_rule", "./rules/must_use_promises_rule"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const checker_1 = require("./checker");
    const ban_expect_truthy_promise_rule_1 = require("./rules/ban_expect_truthy_promise_rule");
    const ban_promise_as_condition_rule_1 = require("./rules/ban_promise_as_condition_rule");
    const check_return_value_rule_1 = require("./rules/check_return_value_rule");
    const equals_nan_rule_1 = require("./rules/equals_nan_rule");
    const must_use_promises_rule_1 = require("./rules/must_use_promises_rule");
    /**
     * List of Tsetse rules. Shared between the program plugin and the language
     * service plugin.
     */
    const ENABLED_RULES = [
        new check_return_value_rule_1.Rule(),
        new equals_nan_rule_1.Rule(),
        new ban_expect_truthy_promise_rule_1.Rule(),
        new must_use_promises_rule_1.Rule(),
        new ban_promise_as_condition_rule_1.Rule(),
    ];
    /**
     * The Tsetse check plugin performs compile-time static analysis for TypeScript
     * code.
     */
    class Plugin {
        constructor(program, disabledTsetseRules = []) {
            this.name = 'tsetse';
            this.checker = new checker_1.Checker(program);
            registerRules(this.checker, disabledTsetseRules);
        }
        getDiagnostics(sourceFile) {
            // Tsetse, in its plugin form, outputs ts.Diagnostic that don't make use
            // of the potential suggested fixes Tsetse generates. These diagnostics are
            // however displayed in context: we can therefore stringify any potential
            // suggested fixes in the error message, so they don't go to waste.
            return this.checker.execute(sourceFile)
                .map(failure => failure.toDiagnosticWithStringifiedFix());
        }
    }
    exports.Plugin = Plugin;
    function registerRules(checker, disabledTsetseRules) {
        for (const rule of ENABLED_RULES) {
            if (disabledTsetseRules.indexOf(rule.ruleName) === -1) {
                rule.register(checker);
            }
        }
    }
    exports.registerRules = registerRules;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvcnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHOzs7Ozs7Ozs7Ozs7SUFPSCx1Q0FBa0M7SUFFbEMsMkZBQTBGO0lBQzFGLHlGQUF3RjtJQUN4Riw2RUFBNkU7SUFDN0UsNkRBQThEO0lBQzlELDJFQUEyRTtJQUUzRTs7O09BR0c7SUFDSCxNQUFNLGFBQWEsR0FBbUI7UUFDcEMsSUFBSSw4QkFBb0IsRUFBRTtRQUMxQixJQUFJLHNCQUFhLEVBQUU7UUFDbkIsSUFBSSxxQ0FBMEIsRUFBRTtRQUNoQyxJQUFJLDZCQUFtQixFQUFFO1FBQ3pCLElBQUksb0NBQXlCLEVBQUU7S0FDaEMsQ0FBQztJQUVGOzs7T0FHRztJQUNILE1BQWEsTUFBTTtRQUdqQixZQUFZLE9BQW1CLEVBQUUsc0JBQWdDLEVBQUU7WUFGMUQsU0FBSSxHQUFHLFFBQVEsQ0FBQztZQUd2QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksaUJBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxjQUFjLENBQUMsVUFBeUI7WUFDdEMsd0VBQXdFO1lBQ3hFLDJFQUEyRTtZQUMzRSx5RUFBeUU7WUFDekUsbUVBQW1FO1lBQ25FLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO2lCQUNsQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7S0FDRjtJQWhCRCx3QkFnQkM7SUFFRCxTQUFnQixhQUFhLENBQUMsT0FBZ0IsRUFBRSxtQkFBNkI7UUFDM0UsS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUU7WUFDaEMsSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNyRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3hCO1NBQ0Y7SUFDSCxDQUFDO0lBTkQsc0NBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgUnVubmVyIGlzIHRoZSBlbnRyeSBwb2ludCBvZiBydW5uaW5nIFRzZXRzZSBjaGVja3MgaW4gY29tcGlsZXIuXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCAqIGFzIHBlcmZUcmFjZSBmcm9tICcuLi90c2Nfd3JhcHBlZC9wZXJmX3RyYWNlJztcbmltcG9ydCAqIGFzIHBsdWdpbkFwaSBmcm9tICcuLi90c2Nfd3JhcHBlZC9wbHVnaW5fYXBpJztcblxuaW1wb3J0IHtDaGVja2VyfSBmcm9tICcuL2NoZWNrZXInO1xuaW1wb3J0IHtBYnN0cmFjdFJ1bGV9IGZyb20gJy4vcnVsZSc7XG5pbXBvcnQge1J1bGUgYXMgQmFuRXhwZWN0VHJ1dGh5UHJvbWlzZVJ1bGV9IGZyb20gJy4vcnVsZXMvYmFuX2V4cGVjdF90cnV0aHlfcHJvbWlzZV9ydWxlJztcbmltcG9ydCB7UnVsZSBhcyBCYW5Qcm9taXNlQXNDb25kaXRpb25SdWxlfSBmcm9tICcuL3J1bGVzL2Jhbl9wcm9taXNlX2FzX2NvbmRpdGlvbl9ydWxlJztcbmltcG9ydCB7UnVsZSBhcyBDaGVja1JldHVyblZhbHVlUnVsZX0gZnJvbSAnLi9ydWxlcy9jaGVja19yZXR1cm5fdmFsdWVfcnVsZSc7XG5pbXBvcnQge1J1bGUgYXMgRXF1YWxzTmFuUnVsZX0gZnJvbSAnLi9ydWxlcy9lcXVhbHNfbmFuX3J1bGUnO1xuaW1wb3J0IHtSdWxlIGFzIE11c3RVc2VQcm9taXNlc1J1bGV9IGZyb20gJy4vcnVsZXMvbXVzdF91c2VfcHJvbWlzZXNfcnVsZSc7XG5cbi8qKlxuICogTGlzdCBvZiBUc2V0c2UgcnVsZXMuIFNoYXJlZCBiZXR3ZWVuIHRoZSBwcm9ncmFtIHBsdWdpbiBhbmQgdGhlIGxhbmd1YWdlXG4gKiBzZXJ2aWNlIHBsdWdpbi5cbiAqL1xuY29uc3QgRU5BQkxFRF9SVUxFUzogQWJzdHJhY3RSdWxlW10gPSBbXG4gIG5ldyBDaGVja1JldHVyblZhbHVlUnVsZSgpLFxuICBuZXcgRXF1YWxzTmFuUnVsZSgpLFxuICBuZXcgQmFuRXhwZWN0VHJ1dGh5UHJvbWlzZVJ1bGUoKSxcbiAgbmV3IE11c3RVc2VQcm9taXNlc1J1bGUoKSxcbiAgbmV3IEJhblByb21pc2VBc0NvbmRpdGlvblJ1bGUoKSxcbl07XG5cbi8qKlxuICogVGhlIFRzZXRzZSBjaGVjayBwbHVnaW4gcGVyZm9ybXMgY29tcGlsZS10aW1lIHN0YXRpYyBhbmFseXNpcyBmb3IgVHlwZVNjcmlwdFxuICogY29kZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFBsdWdpbiBpbXBsZW1lbnRzIHBsdWdpbkFwaS5EaWFnbm9zdGljUGx1Z2luIHtcbiAgcmVhZG9ubHkgbmFtZSA9ICd0c2V0c2UnO1xuICBwcml2YXRlIHJlYWRvbmx5IGNoZWNrZXI6IENoZWNrZXI7XG4gIGNvbnN0cnVjdG9yKHByb2dyYW06IHRzLlByb2dyYW0sIGRpc2FibGVkVHNldHNlUnVsZXM6IHN0cmluZ1tdID0gW10pIHtcbiAgICB0aGlzLmNoZWNrZXIgPSBuZXcgQ2hlY2tlcihwcm9ncmFtKTtcbiAgICByZWdpc3RlclJ1bGVzKHRoaXMuY2hlY2tlciwgZGlzYWJsZWRUc2V0c2VSdWxlcyk7XG4gIH1cblxuICBnZXREaWFnbm9zdGljcyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gICAgLy8gVHNldHNlLCBpbiBpdHMgcGx1Z2luIGZvcm0sIG91dHB1dHMgdHMuRGlhZ25vc3RpYyB0aGF0IGRvbid0IG1ha2UgdXNlXG4gICAgLy8gb2YgdGhlIHBvdGVudGlhbCBzdWdnZXN0ZWQgZml4ZXMgVHNldHNlIGdlbmVyYXRlcy4gVGhlc2UgZGlhZ25vc3RpY3MgYXJlXG4gICAgLy8gaG93ZXZlciBkaXNwbGF5ZWQgaW4gY29udGV4dDogd2UgY2FuIHRoZXJlZm9yZSBzdHJpbmdpZnkgYW55IHBvdGVudGlhbFxuICAgIC8vIHN1Z2dlc3RlZCBmaXhlcyBpbiB0aGUgZXJyb3IgbWVzc2FnZSwgc28gdGhleSBkb24ndCBnbyB0byB3YXN0ZS5cbiAgICByZXR1cm4gdGhpcy5jaGVja2VyLmV4ZWN1dGUoc291cmNlRmlsZSlcbiAgICAgICAgLm1hcChmYWlsdXJlID0+IGZhaWx1cmUudG9EaWFnbm9zdGljV2l0aFN0cmluZ2lmaWVkRml4KCkpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclJ1bGVzKGNoZWNrZXI6IENoZWNrZXIsIGRpc2FibGVkVHNldHNlUnVsZXM6IHN0cmluZ1tdKSB7XG4gIGZvciAoY29uc3QgcnVsZSBvZiBFTkFCTEVEX1JVTEVTKSB7XG4gICAgaWYgKGRpc2FibGVkVHNldHNlUnVsZXMuaW5kZXhPZihydWxlLnJ1bGVOYW1lKSA9PT0gLTEpIHtcbiAgICAgIHJ1bGUucmVnaXN0ZXIoY2hlY2tlcik7XG4gICAgfVxuICB9XG59XG4iXX0=