(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../tsc_wrapped/plugin_api", "./checker", "./runner"], factory);
    }
})(function (require, exports) {
    "use strict";
    const pluginApi = require("../tsc_wrapped/plugin_api");
    const checker_1 = require("./checker");
    const runner_1 = require("./runner");
    // Installs the Tsetse language server plugin, which checks Tsetse rules in your
    // editor and shows issues as semantic errors (red squiggly underline).
    function init() {
        return {
            create(info) {
                const oldService = info.languageService;
                const program = oldService.getProgram();
                // Signature of `getProgram` is `getProgram(): Program | undefined;` in
                // ts 3.1 so we must check if the return value is valid to compile with
                // ts 3.1.
                if (!program) {
                    throw new Error('Failed to initialize tsetse language_service_plugin: program is undefined');
                }
                const checker = new checker_1.Checker(program);
                // Add disabledRules to tsconfig to disable specific rules
                // "plugins": [
                //   {"name": "...", "disabledRules": ["equals-nan"]}
                // ]
                runner_1.registerRules(checker, info.config.disabledRules || []);
                const proxy = pluginApi.createProxy(oldService);
                proxy.getSemanticDiagnostics = (fileName) => {
                    const result = [...oldService.getSemanticDiagnostics(fileName)];
                    // Note that this ignores suggested fixes.
                    result.push(...checker.execute(program.getSourceFile(fileName))
                        .map(failure => failure.toDiagnostic()));
                    return result;
                };
                return proxy;
            }
        };
    }
    return init;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2Vfc2VydmljZV9wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS9sYW5ndWFnZV9zZXJ2aWNlX3BsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0lBQ0EsdURBQXVEO0lBQ3ZELHVDQUFrQztJQUNsQyxxQ0FBdUM7SUFFdkMsZ0ZBQWdGO0lBQ2hGLHVFQUF1RTtJQUV2RSxTQUFTLElBQUk7UUFDWCxPQUFPO1lBQ0wsTUFBTSxDQUFDLElBQWdDO2dCQUNyQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUN4QyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRXhDLHVFQUF1RTtnQkFDdkUsdUVBQXVFO2dCQUN2RSxVQUFVO2dCQUNWLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FDWCwyRUFBMkUsQ0FBQyxDQUFDO2lCQUNsRjtnQkFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRXJDLDBEQUEwRDtnQkFDMUQsZUFBZTtnQkFDZixxREFBcUQ7Z0JBQ3JELElBQUk7Z0JBQ0osc0JBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBRXhELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2hELEtBQUssQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRTtvQkFDbEQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUNoRSwwQ0FBMEM7b0JBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFFLENBQUM7eUJBQy9DLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3pELE9BQU8sTUFBTSxDQUFDO2dCQUNoQixDQUFDLENBQUM7Z0JBQ0YsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFFRCxPQUFTLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQvbGliL3Rzc2VydmVybGlicmFyeSc7XG5pbXBvcnQgKiBhcyBwbHVnaW5BcGkgZnJvbSAnLi4vdHNjX3dyYXBwZWQvcGx1Z2luX2FwaSc7XG5pbXBvcnQge0NoZWNrZXJ9IGZyb20gJy4vY2hlY2tlcic7XG5pbXBvcnQge3JlZ2lzdGVyUnVsZXN9IGZyb20gJy4vcnVubmVyJztcblxuLy8gSW5zdGFsbHMgdGhlIFRzZXRzZSBsYW5ndWFnZSBzZXJ2ZXIgcGx1Z2luLCB3aGljaCBjaGVja3MgVHNldHNlIHJ1bGVzIGluIHlvdXJcbi8vIGVkaXRvciBhbmQgc2hvd3MgaXNzdWVzIGFzIHNlbWFudGljIGVycm9ycyAocmVkIHNxdWlnZ2x5IHVuZGVybGluZSkuXG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gIHJldHVybiB7XG4gICAgY3JlYXRlKGluZm86IHRzLnNlcnZlci5QbHVnaW5DcmVhdGVJbmZvKSB7XG4gICAgICBjb25zdCBvbGRTZXJ2aWNlID0gaW5mby5sYW5ndWFnZVNlcnZpY2U7XG4gICAgICBjb25zdCBwcm9ncmFtID0gb2xkU2VydmljZS5nZXRQcm9ncmFtKCk7XG5cbiAgICAgIC8vIFNpZ25hdHVyZSBvZiBgZ2V0UHJvZ3JhbWAgaXMgYGdldFByb2dyYW0oKTogUHJvZ3JhbSB8IHVuZGVmaW5lZDtgIGluXG4gICAgICAvLyB0cyAzLjEgc28gd2UgbXVzdCBjaGVjayBpZiB0aGUgcmV0dXJuIHZhbHVlIGlzIHZhbGlkIHRvIGNvbXBpbGUgd2l0aFxuICAgICAgLy8gdHMgMy4xLlxuICAgICAgaWYgKCFwcm9ncmFtKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdGYWlsZWQgdG8gaW5pdGlhbGl6ZSB0c2V0c2UgbGFuZ3VhZ2Vfc2VydmljZV9wbHVnaW46IHByb2dyYW0gaXMgdW5kZWZpbmVkJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNoZWNrZXIgPSBuZXcgQ2hlY2tlcihwcm9ncmFtKTtcblxuICAgICAgLy8gQWRkIGRpc2FibGVkUnVsZXMgdG8gdHNjb25maWcgdG8gZGlzYWJsZSBzcGVjaWZpYyBydWxlc1xuICAgICAgLy8gXCJwbHVnaW5zXCI6IFtcbiAgICAgIC8vICAge1wibmFtZVwiOiBcIi4uLlwiLCBcImRpc2FibGVkUnVsZXNcIjogW1wiZXF1YWxzLW5hblwiXX1cbiAgICAgIC8vIF1cbiAgICAgIHJlZ2lzdGVyUnVsZXMoY2hlY2tlciwgaW5mby5jb25maWcuZGlzYWJsZWRSdWxlcyB8fCBbXSk7XG5cbiAgICAgIGNvbnN0IHByb3h5ID0gcGx1Z2luQXBpLmNyZWF0ZVByb3h5KG9sZFNlcnZpY2UpO1xuICAgICAgcHJveHkuZ2V0U2VtYW50aWNEaWFnbm9zdGljcyA9IChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFsuLi5vbGRTZXJ2aWNlLmdldFNlbWFudGljRGlhZ25vc3RpY3MoZmlsZU5hbWUpXTtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgaWdub3JlcyBzdWdnZXN0ZWQgZml4ZXMuXG4gICAgICAgIHJlc3VsdC5wdXNoKC4uLmNoZWNrZXIuZXhlY3V0ZShwcm9ncmFtLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpISlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZmFpbHVyZSA9PiBmYWlsdXJlLnRvRGlhZ25vc3RpYygpKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHByb3h5O1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0ID0gaW5pdDtcbiJdfQ==