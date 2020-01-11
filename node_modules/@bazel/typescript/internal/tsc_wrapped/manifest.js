/**
 * @fileoverview utilities to construct a static graph representation of the
 * import graph discovered in typescript inputs.
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Recursively walk the import graph provided by tsickle, populating entries
     * in the result map such that if foo imports bar, foo will appear before bar
     * in the map.
     */
    function topologicalSort(result, current, modulesManifest, visiting) {
        const referencedModules = modulesManifest.getReferencedModules(current);
        if (!referencedModules)
            return; // not in the local set of sources.
        for (const referencedModule of referencedModules) {
            const referencedFileName = modulesManifest.getFileNameFromModule(referencedModule);
            if (!referencedFileName)
                continue; // Ambient modules.
            if (!result[referencedFileName]) {
                if (visiting[referencedFileName]) {
                    const path = current + ' -> ' + Object.keys(visiting).join(' -> ');
                    throw new Error('Cyclical dependency between files:\n' + path);
                }
                visiting[referencedFileName] = true;
                topologicalSort(result, referencedFileName, modulesManifest, visiting);
                delete visiting[referencedFileName];
            }
        }
        result[current] = true;
    }
    /**
     * Create the contents of the .es5.MF file which propagates partial ordering of
     * the import graph to later actions.
     * Each line in the resulting text corresponds with a workspace-relative file
     * path, and the lines are ordered to match the expected load order in a
     * browser.
     */
    function constructManifest(modulesManifest, host) {
        const result = {};
        for (const file of modulesManifest.fileNames) {
            topologicalSort(result, file, modulesManifest, {});
        }
        // NB: The object literal maintains insertion order.
        return Object.keys(result).map(fn => host.relativeOutputPath(fn)).join('\n') +
            '\n';
    }
    exports.constructManifest = constructManifest;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuaWZlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL21hbmlmZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7O0lBSUg7Ozs7T0FJRztJQUNILFNBQVMsZUFBZSxDQUNwQixNQUFnQyxFQUFFLE9BQWUsRUFDakQsZUFBd0MsRUFDeEMsUUFBa0M7UUFDcEMsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEUsSUFBSSxDQUFDLGlCQUFpQjtZQUFFLE9BQU8sQ0FBRSxtQ0FBbUM7UUFDcEUsS0FBSyxNQUFNLGdCQUFnQixJQUFJLGlCQUFpQixFQUFFO1lBQ2hELE1BQU0sa0JBQWtCLEdBQ3BCLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxrQkFBa0I7Z0JBQUUsU0FBUyxDQUFFLG1CQUFtQjtZQUN2RCxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEVBQUU7Z0JBQy9CLElBQUksUUFBUSxDQUFDLGtCQUFrQixDQUFDLEVBQUU7b0JBQ2hDLE1BQU0sSUFBSSxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ25FLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLEdBQUcsSUFBSSxDQUFDLENBQUM7aUJBQ2hFO2dCQUNELFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDcEMsZUFBZSxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZFLE9BQU8sUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7YUFDckM7U0FDRjtRQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFNBQWdCLGlCQUFpQixDQUM3QixlQUF3QyxFQUN4QyxJQUFpRDtRQUNuRCxNQUFNLE1BQU0sR0FBNkIsRUFBRSxDQUFDO1FBQzVDLEtBQUssTUFBTSxJQUFJLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRTtZQUM1QyxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDcEQ7UUFFRCxvREFBb0Q7UUFDcEQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDeEUsSUFBSSxDQUFDO0lBQ1gsQ0FBQztJQVhELDhDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IHV0aWxpdGllcyB0byBjb25zdHJ1Y3QgYSBzdGF0aWMgZ3JhcGggcmVwcmVzZW50YXRpb24gb2YgdGhlXG4gKiBpbXBvcnQgZ3JhcGggZGlzY292ZXJlZCBpbiB0eXBlc2NyaXB0IGlucHV0cy5cbiAqL1xuXG5pbXBvcnQgKiBhcyB0c2lja2xlIGZyb20gJ3RzaWNrbGUnO1xuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHdhbGsgdGhlIGltcG9ydCBncmFwaCBwcm92aWRlZCBieSB0c2lja2xlLCBwb3B1bGF0aW5nIGVudHJpZXNcbiAqIGluIHRoZSByZXN1bHQgbWFwIHN1Y2ggdGhhdCBpZiBmb28gaW1wb3J0cyBiYXIsIGZvbyB3aWxsIGFwcGVhciBiZWZvcmUgYmFyXG4gKiBpbiB0aGUgbWFwLlxuICovXG5mdW5jdGlvbiB0b3BvbG9naWNhbFNvcnQoXG4gICAgcmVzdWx0OiB0c2lja2xlLkZpbGVNYXA8Ym9vbGVhbj4sIGN1cnJlbnQ6IHN0cmluZyxcbiAgICBtb2R1bGVzTWFuaWZlc3Q6IHRzaWNrbGUuTW9kdWxlc01hbmlmZXN0LFxuICAgIHZpc2l0aW5nOiB0c2lja2xlLkZpbGVNYXA8Ym9vbGVhbj4pIHtcbiAgY29uc3QgcmVmZXJlbmNlZE1vZHVsZXMgPSBtb2R1bGVzTWFuaWZlc3QuZ2V0UmVmZXJlbmNlZE1vZHVsZXMoY3VycmVudCk7XG4gIGlmICghcmVmZXJlbmNlZE1vZHVsZXMpIHJldHVybjsgIC8vIG5vdCBpbiB0aGUgbG9jYWwgc2V0IG9mIHNvdXJjZXMuXG4gIGZvciAoY29uc3QgcmVmZXJlbmNlZE1vZHVsZSBvZiByZWZlcmVuY2VkTW9kdWxlcykge1xuICAgIGNvbnN0IHJlZmVyZW5jZWRGaWxlTmFtZSA9XG4gICAgICAgIG1vZHVsZXNNYW5pZmVzdC5nZXRGaWxlTmFtZUZyb21Nb2R1bGUocmVmZXJlbmNlZE1vZHVsZSk7XG4gICAgaWYgKCFyZWZlcmVuY2VkRmlsZU5hbWUpIGNvbnRpbnVlOyAgLy8gQW1iaWVudCBtb2R1bGVzLlxuICAgIGlmICghcmVzdWx0W3JlZmVyZW5jZWRGaWxlTmFtZV0pIHtcbiAgICAgIGlmICh2aXNpdGluZ1tyZWZlcmVuY2VkRmlsZU5hbWVdKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBjdXJyZW50ICsgJyAtPiAnICsgT2JqZWN0LmtleXModmlzaXRpbmcpLmpvaW4oJyAtPiAnKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDeWNsaWNhbCBkZXBlbmRlbmN5IGJldHdlZW4gZmlsZXM6XFxuJyArIHBhdGgpO1xuICAgICAgfVxuICAgICAgdmlzaXRpbmdbcmVmZXJlbmNlZEZpbGVOYW1lXSA9IHRydWU7XG4gICAgICB0b3BvbG9naWNhbFNvcnQocmVzdWx0LCByZWZlcmVuY2VkRmlsZU5hbWUsIG1vZHVsZXNNYW5pZmVzdCwgdmlzaXRpbmcpO1xuICAgICAgZGVsZXRlIHZpc2l0aW5nW3JlZmVyZW5jZWRGaWxlTmFtZV07XG4gICAgfVxuICB9XG4gIHJlc3VsdFtjdXJyZW50XSA9IHRydWU7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBjb250ZW50cyBvZiB0aGUgLmVzNS5NRiBmaWxlIHdoaWNoIHByb3BhZ2F0ZXMgcGFydGlhbCBvcmRlcmluZyBvZlxuICogdGhlIGltcG9ydCBncmFwaCB0byBsYXRlciBhY3Rpb25zLlxuICogRWFjaCBsaW5lIGluIHRoZSByZXN1bHRpbmcgdGV4dCBjb3JyZXNwb25kcyB3aXRoIGEgd29ya3NwYWNlLXJlbGF0aXZlIGZpbGVcbiAqIHBhdGgsIGFuZCB0aGUgbGluZXMgYXJlIG9yZGVyZWQgdG8gbWF0Y2ggdGhlIGV4cGVjdGVkIGxvYWQgb3JkZXIgaW4gYVxuICogYnJvd3Nlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdE1hbmlmZXN0KFxuICAgIG1vZHVsZXNNYW5pZmVzdDogdHNpY2tsZS5Nb2R1bGVzTWFuaWZlc3QsXG4gICAgaG9zdDoge3JlbGF0aXZlT3V0cHV0UGF0aDogKGY6IHN0cmluZykgPT4gc3RyaW5nfSk6IHN0cmluZyB7XG4gIGNvbnN0IHJlc3VsdDogdHNpY2tsZS5GaWxlTWFwPGJvb2xlYW4+ID0ge307XG4gIGZvciAoY29uc3QgZmlsZSBvZiBtb2R1bGVzTWFuaWZlc3QuZmlsZU5hbWVzKSB7XG4gICAgdG9wb2xvZ2ljYWxTb3J0KHJlc3VsdCwgZmlsZSwgbW9kdWxlc01hbmlmZXN0LCB7fSk7XG4gIH1cblxuICAvLyBOQjogVGhlIG9iamVjdCBsaXRlcmFsIG1haW50YWlucyBpbnNlcnRpb24gb3JkZXIuXG4gIHJldHVybiBPYmplY3Qua2V5cyhyZXN1bHQpLm1hcChmbiA9PiBob3N0LnJlbGF0aXZlT3V0cHV0UGF0aChmbikpLmpvaW4oJ1xcbicpICtcbiAgICAgICdcXG4nO1xufVxuIl19