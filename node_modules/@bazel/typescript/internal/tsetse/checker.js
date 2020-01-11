/**
 * @fileoverview Checker contains all the information we need to perform source
 * file AST traversals and report errors.
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "./failure"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const failure_1 = require("./failure");
    /**
     * Tsetse rules use on() and addFailureAtNode() for rule implementations.
     * Rules can get a ts.TypeChecker from checker.typeChecker so typed rules are
     * possible. Compiler uses execute() to run the Tsetse check.
     */
    class Checker {
        constructor(program) {
            /**
             * nodeHandlersMap contains node to handlers mapping for all enabled rules.
             */
            this.nodeHandlersMap = new Map();
            this.failures = [];
            // currentCode will be set before invoking any handler functions so the value
            // initialized here is never used.
            this.currentCode = 0;
            // Avoid the cost for each rule to create a new TypeChecker.
            this.typeChecker = program.getTypeChecker();
        }
        /**
         * This doesn't run any checks yet. Instead, it registers `handlerFunction` on
         * `nodeKind` node in `nodeHandlersMap` map. After all rules register their
         * handlers, the source file AST will be traversed.
         */
        on(nodeKind, handlerFunction, code) {
            const newHandler = { handlerFunction, code };
            const registeredHandlers = this.nodeHandlersMap.get(nodeKind);
            if (registeredHandlers === undefined) {
                this.nodeHandlersMap.set(nodeKind, [newHandler]);
            }
            else {
                registeredHandlers.push(newHandler);
            }
        }
        /**
         * Add a failure with a span. addFailure() is currently private because
         * `addFailureAtNode` is preferred.
         */
        addFailure(start, end, failureText, fix) {
            if (!this.currentSourceFile) {
                throw new Error('Source file not defined');
            }
            if (start >= end || end > this.currentSourceFile.end || start < 0) {
                // Since only addFailureAtNode() is exposed for now this shouldn't happen.
                throw new Error(`Invalid start and end position: [${start}, ${end}]` +
                    ` in file ${this.currentSourceFile.fileName}.`);
            }
            const failure = new failure_1.Failure(this.currentSourceFile, start, end, failureText, this.currentCode, fix);
            this.failures.push(failure);
        }
        addFailureAtNode(node, failureText, fix) {
            // node.getStart() takes a sourceFile as argument whereas node.getEnd()
            // doesn't need it.
            this.addFailure(node.getStart(this.currentSourceFile), node.getEnd(), failureText, fix);
        }
        /**
         * Walk `sourceFile`, invoking registered handlers with Checker as the first
         * argument and current node as the second argument. Return failures if there
         * are any.
         */
        execute(sourceFile) {
            const thisChecker = this;
            this.currentSourceFile = sourceFile;
            this.failures = [];
            ts.forEachChild(sourceFile, run);
            return this.failures;
            function run(node) {
                const handlers = thisChecker.nodeHandlersMap.get(node.kind);
                if (handlers !== undefined) {
                    for (const handler of handlers) {
                        thisChecker.currentCode = handler.code;
                        handler.handlerFunction(thisChecker, node);
                    }
                }
                ts.forEachChild(node, run);
            }
        }
    }
    exports.Checker = Checker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL2NoZWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsdUNBQXVDO0lBWXZDOzs7O09BSUc7SUFDSCxNQUFhLE9BQU87UUFlbEIsWUFBWSxPQUFtQjtZQWQvQjs7ZUFFRztZQUNLLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQTRCLENBQUM7WUFDdEQsYUFBUSxHQUFjLEVBQUUsQ0FBQztZQUVqQyw2RUFBNkU7WUFDN0Usa0NBQWtDO1lBQzFCLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBT3RCLDREQUE0RDtZQUM1RCxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM5QyxDQUFDO1FBRUQ7Ozs7V0FJRztRQUNILEVBQUUsQ0FDRSxRQUFtQixFQUFFLGVBQW9ELEVBQ3pFLElBQVk7WUFDZCxNQUFNLFVBQVUsR0FBWSxFQUFDLGVBQWUsRUFBRSxJQUFJLEVBQUMsQ0FBQztZQUNwRCxNQUFNLGtCQUFrQixHQUNwQixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2QyxJQUFJLGtCQUFrQixLQUFLLFNBQVMsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzthQUNsRDtpQkFBTTtnQkFDTCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDckM7UUFDSCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ssVUFBVSxDQUNkLEtBQWEsRUFBRSxHQUFXLEVBQUUsV0FBbUIsRUFBRSxHQUFTO1lBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQzthQUM1QztZQUNELElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO2dCQUNqRSwwRUFBMEU7Z0JBQzFFLE1BQU0sSUFBSSxLQUFLLENBQ1gsb0NBQW9DLEtBQUssS0FBSyxHQUFHLEdBQUc7b0JBQ3BELFlBQVksSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7YUFDckQ7WUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxJQUFhLEVBQUUsV0FBbUIsRUFBRSxHQUFTO1lBQzVELHVFQUF1RTtZQUN2RSxtQkFBbUI7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FDWCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSCxPQUFPLENBQUMsVUFBeUI7WUFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7WUFDcEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDbkIsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDakMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRXJCLFNBQVMsR0FBRyxDQUFDLElBQWE7Z0JBQ3hCLE1BQU0sUUFBUSxHQUNWLFdBQVcsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO29CQUMxQixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTt3QkFDOUIsV0FBVyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO3dCQUN2QyxPQUFPLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztxQkFDNUM7aUJBQ0Y7Z0JBQ0QsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0IsQ0FBQztRQUNILENBQUM7S0FDRjtJQTFGRCwwQkEwRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ2hlY2tlciBjb250YWlucyBhbGwgdGhlIGluZm9ybWF0aW9uIHdlIG5lZWQgdG8gcGVyZm9ybSBzb3VyY2VcbiAqIGZpbGUgQVNUIHRyYXZlcnNhbHMgYW5kIHJlcG9ydCBlcnJvcnMuXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0ZhaWx1cmUsIEZpeH0gZnJvbSAnLi9mYWlsdXJlJztcblxuXG4vKipcbiAqIEEgSGFuZGxlciBjb250YWlucyBhIGhhbmRsZXIgZnVuY3Rpb24gYW5kIGl0cyBjb3JyZXNwb25kaW5nIGVycm9yIGNvZGUgc29cbiAqIHdoZW4gdGhlIGhhbmRsZXIgZnVuY3Rpb24gaXMgdHJpZ2dlcmVkIHdlIGtub3cgd2hpY2ggcnVsZSBpcyB2aW9sYXRlZC5cbiAqL1xuaW50ZXJmYWNlIEhhbmRsZXIge1xuICBoYW5kbGVyRnVuY3Rpb24oY2hlY2tlcjogQ2hlY2tlciwgbm9kZTogdHMuTm9kZSk6IHZvaWQ7XG4gIGNvZGU6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUc2V0c2UgcnVsZXMgdXNlIG9uKCkgYW5kIGFkZEZhaWx1cmVBdE5vZGUoKSBmb3IgcnVsZSBpbXBsZW1lbnRhdGlvbnMuXG4gKiBSdWxlcyBjYW4gZ2V0IGEgdHMuVHlwZUNoZWNrZXIgZnJvbSBjaGVja2VyLnR5cGVDaGVja2VyIHNvIHR5cGVkIHJ1bGVzIGFyZVxuICogcG9zc2libGUuIENvbXBpbGVyIHVzZXMgZXhlY3V0ZSgpIHRvIHJ1biB0aGUgVHNldHNlIGNoZWNrLlxuICovXG5leHBvcnQgY2xhc3MgQ2hlY2tlciB7XG4gIC8qKlxuICAgKiBub2RlSGFuZGxlcnNNYXAgY29udGFpbnMgbm9kZSB0byBoYW5kbGVycyBtYXBwaW5nIGZvciBhbGwgZW5hYmxlZCBydWxlcy5cbiAgICovXG4gIHByaXZhdGUgbm9kZUhhbmRsZXJzTWFwID0gbmV3IE1hcDx0cy5TeW50YXhLaW5kLCBIYW5kbGVyW10+KCk7XG4gIHByaXZhdGUgZmFpbHVyZXM6IEZhaWx1cmVbXSA9IFtdO1xuICBwcml2YXRlIGN1cnJlbnRTb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZDtcbiAgLy8gY3VycmVudENvZGUgd2lsbCBiZSBzZXQgYmVmb3JlIGludm9raW5nIGFueSBoYW5kbGVyIGZ1bmN0aW9ucyBzbyB0aGUgdmFsdWVcbiAgLy8gaW5pdGlhbGl6ZWQgaGVyZSBpcyBuZXZlciB1c2VkLlxuICBwcml2YXRlIGN1cnJlbnRDb2RlID0gMDtcbiAgLyoqXG4gICAqIEFsbG93IHR5cGVkIHJ1bGVzIHZpYSB0eXBlQ2hlY2tlci5cbiAgICovXG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcjtcblxuICBjb25zdHJ1Y3Rvcihwcm9ncmFtOiB0cy5Qcm9ncmFtKSB7XG4gICAgLy8gQXZvaWQgdGhlIGNvc3QgZm9yIGVhY2ggcnVsZSB0byBjcmVhdGUgYSBuZXcgVHlwZUNoZWNrZXIuXG4gICAgdGhpcy50eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGRvZXNuJ3QgcnVuIGFueSBjaGVja3MgeWV0LiBJbnN0ZWFkLCBpdCByZWdpc3RlcnMgYGhhbmRsZXJGdW5jdGlvbmAgb25cbiAgICogYG5vZGVLaW5kYCBub2RlIGluIGBub2RlSGFuZGxlcnNNYXBgIG1hcC4gQWZ0ZXIgYWxsIHJ1bGVzIHJlZ2lzdGVyIHRoZWlyXG4gICAqIGhhbmRsZXJzLCB0aGUgc291cmNlIGZpbGUgQVNUIHdpbGwgYmUgdHJhdmVyc2VkLlxuICAgKi9cbiAgb248VCBleHRlbmRzIHRzLk5vZGU+KFxuICAgICAgbm9kZUtpbmQ6IFRbJ2tpbmQnXSwgaGFuZGxlckZ1bmN0aW9uOiAoY2hlY2tlcjogQ2hlY2tlciwgbm9kZTogVCkgPT4gdm9pZCxcbiAgICAgIGNvZGU6IG51bWJlcikge1xuICAgIGNvbnN0IG5ld0hhbmRsZXI6IEhhbmRsZXIgPSB7aGFuZGxlckZ1bmN0aW9uLCBjb2RlfTtcbiAgICBjb25zdCByZWdpc3RlcmVkSGFuZGxlcnM6IEhhbmRsZXJbXXx1bmRlZmluZWQgPVxuICAgICAgICB0aGlzLm5vZGVIYW5kbGVyc01hcC5nZXQobm9kZUtpbmQpO1xuICAgIGlmIChyZWdpc3RlcmVkSGFuZGxlcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ub2RlSGFuZGxlcnNNYXAuc2V0KG5vZGVLaW5kLCBbbmV3SGFuZGxlcl0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWdpc3RlcmVkSGFuZGxlcnMucHVzaChuZXdIYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgZmFpbHVyZSB3aXRoIGEgc3Bhbi4gYWRkRmFpbHVyZSgpIGlzIGN1cnJlbnRseSBwcml2YXRlIGJlY2F1c2VcbiAgICogYGFkZEZhaWx1cmVBdE5vZGVgIGlzIHByZWZlcnJlZC5cbiAgICovXG4gIHByaXZhdGUgYWRkRmFpbHVyZShcbiAgICAgIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBmYWlsdXJlVGV4dDogc3RyaW5nLCBmaXg/OiBGaXgpIHtcbiAgICBpZiAoIXRoaXMuY3VycmVudFNvdXJjZUZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU291cmNlIGZpbGUgbm90IGRlZmluZWQnKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ID49IGVuZCB8fCBlbmQgPiB0aGlzLmN1cnJlbnRTb3VyY2VGaWxlLmVuZCB8fCBzdGFydCA8IDApIHtcbiAgICAgIC8vIFNpbmNlIG9ubHkgYWRkRmFpbHVyZUF0Tm9kZSgpIGlzIGV4cG9zZWQgZm9yIG5vdyB0aGlzIHNob3VsZG4ndCBoYXBwZW4uXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEludmFsaWQgc3RhcnQgYW5kIGVuZCBwb3NpdGlvbjogWyR7c3RhcnR9LCAke2VuZH1dYCArXG4gICAgICAgICAgYCBpbiBmaWxlICR7dGhpcy5jdXJyZW50U291cmNlRmlsZS5maWxlTmFtZX0uYCk7XG4gICAgfVxuXG4gICAgY29uc3QgZmFpbHVyZSA9IG5ldyBGYWlsdXJlKFxuICAgICAgICB0aGlzLmN1cnJlbnRTb3VyY2VGaWxlLCBzdGFydCwgZW5kLCBmYWlsdXJlVGV4dCwgdGhpcy5jdXJyZW50Q29kZSwgZml4KTtcbiAgICB0aGlzLmZhaWx1cmVzLnB1c2goZmFpbHVyZSk7XG4gIH1cblxuICBhZGRGYWlsdXJlQXROb2RlKG5vZGU6IHRzLk5vZGUsIGZhaWx1cmVUZXh0OiBzdHJpbmcsIGZpeD86IEZpeCkge1xuICAgIC8vIG5vZGUuZ2V0U3RhcnQoKSB0YWtlcyBhIHNvdXJjZUZpbGUgYXMgYXJndW1lbnQgd2hlcmVhcyBub2RlLmdldEVuZCgpXG4gICAgLy8gZG9lc24ndCBuZWVkIGl0LlxuICAgIHRoaXMuYWRkRmFpbHVyZShcbiAgICAgICAgbm9kZS5nZXRTdGFydCh0aGlzLmN1cnJlbnRTb3VyY2VGaWxlKSwgbm9kZS5nZXRFbmQoKSwgZmFpbHVyZVRleHQsIGZpeCk7XG4gIH1cblxuICAvKipcbiAgICogV2FsayBgc291cmNlRmlsZWAsIGludm9raW5nIHJlZ2lzdGVyZWQgaGFuZGxlcnMgd2l0aCBDaGVja2VyIGFzIHRoZSBmaXJzdFxuICAgKiBhcmd1bWVudCBhbmQgY3VycmVudCBub2RlIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFJldHVybiBmYWlsdXJlcyBpZiB0aGVyZVxuICAgKiBhcmUgYW55LlxuICAgKi9cbiAgZXhlY3V0ZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogRmFpbHVyZVtdIHtcbiAgICBjb25zdCB0aGlzQ2hlY2tlciA9IHRoaXM7XG4gICAgdGhpcy5jdXJyZW50U291cmNlRmlsZSA9IHNvdXJjZUZpbGU7XG4gICAgdGhpcy5mYWlsdXJlcyA9IFtdO1xuICAgIHRzLmZvckVhY2hDaGlsZChzb3VyY2VGaWxlLCBydW4pO1xuICAgIHJldHVybiB0aGlzLmZhaWx1cmVzO1xuXG4gICAgZnVuY3Rpb24gcnVuKG5vZGU6IHRzLk5vZGUpIHtcbiAgICAgIGNvbnN0IGhhbmRsZXJzOiBIYW5kbGVyW118dW5kZWZpbmVkID1cbiAgICAgICAgICB0aGlzQ2hlY2tlci5ub2RlSGFuZGxlcnNNYXAuZ2V0KG5vZGUua2luZCk7XG4gICAgICBpZiAoaGFuZGxlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgaGFuZGxlcnMpIHtcbiAgICAgICAgICB0aGlzQ2hlY2tlci5jdXJyZW50Q29kZSA9IGhhbmRsZXIuY29kZTtcbiAgICAgICAgICBoYW5kbGVyLmhhbmRsZXJGdW5jdGlvbih0aGlzQ2hlY2tlciwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBydW4pO1xuICAgIH1cbiAgfVxufVxuIl19