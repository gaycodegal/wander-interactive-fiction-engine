(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../ast_tools"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ast_tools_1 = require("../ast_tools");
    /**
     * A patternEngine is the logic that handles a specific PatternKind.
     */
    class PatternEngine {
        constructor(config, fixer) {
            this.config = config;
            this.fixer = fixer;
            this.whitelistedPrefixes = [];
            this.whitelistedRegExps = [];
            this.whitelistMemoizer = new Map();
            if (config.whitelistEntries) {
                for (const e of config.whitelistEntries) {
                    if (e.prefix) {
                        this.whitelistedPrefixes =
                            this.whitelistedPrefixes.concat(...e.prefix);
                    }
                    if (e.regexp) {
                        this.whitelistedRegExps = this.whitelistedRegExps.concat(...e.regexp.map(r => new RegExp(r)));
                    }
                }
            }
        }
        /**
         * A wrapper for `check` that handles aspects of the analysis that are not
         * engine-specific, and which defers to the subclass-specific logic
         * afterwards.
         */
        checkAndFilterResults(c, n) {
            if (!ast_tools_1.shouldExamineNode(n) || n.getSourceFile().isDeclarationFile) {
                return;
            }
            const matchedNode = this.check(c.typeChecker, n);
            if (matchedNode && !this.isWhitelisted(matchedNode)) {
                const fix = this.fixer ? this.fixer.getFixForFlaggedNode(matchedNode) : undefined;
                c.addFailureAtNode(matchedNode, this.config.errorMessage, fix);
            }
        }
        isWhitelisted(n) {
            const name = n.getSourceFile().fileName;
            if (this.whitelistMemoizer.has(name)) {
                return this.whitelistMemoizer.get(name);
            }
            for (const p of this.whitelistedPrefixes) {
                if (name.indexOf(p) == 0) {
                    this.whitelistMemoizer.set(name, true);
                    return true;
                }
            }
            for (const re of this.whitelistedRegExps) {
                if (re.test(name)) {
                    this.whitelistMemoizer.set(name, true);
                    return true;
                }
            }
            this.whitelistMemoizer.set(name, false);
            return false;
        }
    }
    exports.PatternEngine = PatternEngine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0dGVybl9lbmdpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS91dGlsL3BhdHRlcm5fZW5naW5lcy9wYXR0ZXJuX2VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUtBLDRDQUErQztJQUUvQzs7T0FFRztJQUNILE1BQXNCLGFBQWE7UUFLakMsWUFDdUIsTUFBYyxFQUFxQixLQUFhO1lBQWhELFdBQU0sR0FBTixNQUFNLENBQVE7WUFBcUIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUx0RCx3QkFBbUIsR0FBYSxFQUFFLENBQUM7WUFDbkMsdUJBQWtCLEdBQWEsRUFBRSxDQUFDO1lBQ2xDLHNCQUFpQixHQUF5QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBSW5FLElBQUksTUFBTSxDQUFDLGdCQUFnQixFQUFFO2dCQUMzQixLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDdkMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO3dCQUNaLElBQUksQ0FBQyxtQkFBbUI7NEJBQ3BCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ2xEO29CQUNELElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTt3QkFDWixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FDcEQsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDMUM7aUJBQ0Y7YUFDRjtRQUNILENBQUM7UUFnQkQ7Ozs7V0FJRztRQUNILHFCQUFxQixDQUFDLENBQVUsRUFBRSxDQUFVO1lBQzFDLElBQUksQ0FBQyw2QkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ2hFLE9BQU87YUFDUjtZQUNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRCxJQUFJLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ25ELE1BQU0sR0FBRyxHQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDMUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNoRTtRQUNILENBQUM7UUFFRCxhQUFhLENBQUMsQ0FBVTtZQUN0QixNQUFNLElBQUksR0FBVyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDO1lBQ2hELElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDcEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRSxDQUFDO2FBQzFDO1lBQ0QsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7Z0JBQ3hDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN2QyxPQUFPLElBQUksQ0FBQztpQkFDYjthQUNGO1lBQ0QsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ3hDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDakIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3ZDLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2FBQ0Y7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4QyxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7S0FDRjtJQXhFRCxzQ0F3RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Q2hlY2tlcn0gZnJvbSAnLi4vLi4vY2hlY2tlcic7XG5pbXBvcnQge0ZpeH0gZnJvbSAnLi4vLi4vZmFpbHVyZSc7XG5pbXBvcnQge0ZpeGVyfSBmcm9tICcuLi8uLi91dGlsL2ZpeGVyJztcbmltcG9ydCB7Q29uZmlnfSBmcm9tICcuLi8uLi91dGlsL3BhdHRlcm5fY29uZmlnJztcbmltcG9ydCB7c2hvdWxkRXhhbWluZU5vZGV9IGZyb20gJy4uL2FzdF90b29scyc7XG5cbi8qKlxuICogQSBwYXR0ZXJuRW5naW5lIGlzIHRoZSBsb2dpYyB0aGF0IGhhbmRsZXMgYSBzcGVjaWZpYyBQYXR0ZXJuS2luZC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFBhdHRlcm5FbmdpbmUge1xuICBwcml2YXRlIHJlYWRvbmx5IHdoaXRlbGlzdGVkUHJlZml4ZXM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgd2hpdGVsaXN0ZWRSZWdFeHBzOiBSZWdFeHBbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IHdoaXRlbGlzdE1lbW9pemVyOiBNYXA8c3RyaW5nLCBib29sZWFuPiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3RlY3RlZCByZWFkb25seSBjb25maWc6IENvbmZpZywgcHJvdGVjdGVkIHJlYWRvbmx5IGZpeGVyPzogRml4ZXIpIHtcbiAgICBpZiAoY29uZmlnLndoaXRlbGlzdEVudHJpZXMpIHtcbiAgICAgIGZvciAoY29uc3QgZSBvZiBjb25maWcud2hpdGVsaXN0RW50cmllcykge1xuICAgICAgICBpZiAoZS5wcmVmaXgpIHtcbiAgICAgICAgICB0aGlzLndoaXRlbGlzdGVkUHJlZml4ZXMgPVxuICAgICAgICAgICAgICB0aGlzLndoaXRlbGlzdGVkUHJlZml4ZXMuY29uY2F0KC4uLmUucHJlZml4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZS5yZWdleHApIHtcbiAgICAgICAgICB0aGlzLndoaXRlbGlzdGVkUmVnRXhwcyA9IHRoaXMud2hpdGVsaXN0ZWRSZWdFeHBzLmNvbmNhdChcbiAgICAgICAgICAgICAgLi4uZS5yZWdleHAubWFwKHIgPT4gbmV3IFJlZ0V4cChyKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGByZWdpc3RlcmAgd2lsbCBiZSBjYWxsZWQgYnkgdGhlIENvbmZvcm1hbmNlUnVsZSB0byB0ZWxsIFRzZXRzZSB0aGVcbiAgICogUGF0dGVybkVuZ2luZSB3aWxsIGhhbmRsZSBtYXRjaGluZy4gSW1wbGVtZW50YXRpb25zIHNob3VsZCB1c2VcbiAgICpgY2hlY2tBbmRGaWx0ZXJSZXN1bHRzYCBhcyBhIHdyYXBwZXIgZm9yIGBjaGVja2AuXG4gICAqKi9cbiAgYWJzdHJhY3QgcmVnaXN0ZXIoY2hlY2tlcjogQ2hlY2tlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIGBjaGVja2AgaXMgdGhlIFBhdHRlcm5FbmdpbmUgc3ViY2xhc3Mtc3BlY2lmaWMgbWF0Y2hpbmcgbG9naWMuIE92ZXJ3cml0ZVxuICAgKiB3aXRoIHdoYXQgdGhlIGVuZ2luZSBsb29rcyBmb3IsIGkuZS4sIEFTVCBtYXRjaGluZy4gVGhlIHdoaXRlbGlzdGluZyBsb2dpY1xuICAgKiBhbmQgZml4IGdlbmVyYXRpb24gYXJlIGhhbmRsZWQgaW4gYGNoZWNrQW5kRmlsdGVyUmVzdWx0c2AuXG4gICAqL1xuICBhYnN0cmFjdCBjaGVjayh0YzogdHMuVHlwZUNoZWNrZXIsIG46IHRzLk5vZGUpOiB0cy5Ob2RlfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSB3cmFwcGVyIGZvciBgY2hlY2tgIHRoYXQgaGFuZGxlcyBhc3BlY3RzIG9mIHRoZSBhbmFseXNpcyB0aGF0IGFyZSBub3RcbiAgICogZW5naW5lLXNwZWNpZmljLCBhbmQgd2hpY2ggZGVmZXJzIHRvIHRoZSBzdWJjbGFzcy1zcGVjaWZpYyBsb2dpY1xuICAgKiBhZnRlcndhcmRzLlxuICAgKi9cbiAgY2hlY2tBbmRGaWx0ZXJSZXN1bHRzKGM6IENoZWNrZXIsIG46IHRzLk5vZGUpIHtcbiAgICBpZiAoIXNob3VsZEV4YW1pbmVOb2RlKG4pIHx8IG4uZ2V0U291cmNlRmlsZSgpLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG1hdGNoZWROb2RlID0gdGhpcy5jaGVjayhjLnR5cGVDaGVja2VyLCBuKTtcbiAgICBpZiAobWF0Y2hlZE5vZGUgJiYgIXRoaXMuaXNXaGl0ZWxpc3RlZChtYXRjaGVkTm9kZSkpIHtcbiAgICAgIGNvbnN0IGZpeDogRml4fHVuZGVmaW5lZCA9XG4gICAgICAgICAgdGhpcy5maXhlciA/IHRoaXMuZml4ZXIuZ2V0Rml4Rm9yRmxhZ2dlZE5vZGUobWF0Y2hlZE5vZGUpIDogdW5kZWZpbmVkO1xuICAgICAgYy5hZGRGYWlsdXJlQXROb2RlKG1hdGNoZWROb2RlLCB0aGlzLmNvbmZpZy5lcnJvck1lc3NhZ2UsIGZpeCk7XG4gICAgfVxuICB9XG5cbiAgaXNXaGl0ZWxpc3RlZChuOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbmFtZTogc3RyaW5nID0gbi5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG4gICAgaWYgKHRoaXMud2hpdGVsaXN0TWVtb2l6ZXIuaGFzKG5hbWUpKSB7XG4gICAgICByZXR1cm4gdGhpcy53aGl0ZWxpc3RNZW1vaXplci5nZXQobmFtZSkhO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy53aGl0ZWxpc3RlZFByZWZpeGVzKSB7XG4gICAgICBpZiAobmFtZS5pbmRleE9mKHApID09IDApIHtcbiAgICAgICAgdGhpcy53aGl0ZWxpc3RNZW1vaXplci5zZXQobmFtZSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHJlIG9mIHRoaXMud2hpdGVsaXN0ZWRSZWdFeHBzKSB7XG4gICAgICBpZiAocmUudGVzdChuYW1lKSkge1xuICAgICAgICB0aGlzLndoaXRlbGlzdE1lbW9pemVyLnNldChuYW1lLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMud2hpdGVsaXN0TWVtb2l6ZXIuc2V0KG5hbWUsIGZhbHNlKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==