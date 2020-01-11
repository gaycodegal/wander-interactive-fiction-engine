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
     * Tsetse rules should extend AbstractRule and provide a `register` function.
     * Rules are instantiated once per compilation operation and used across many
     * files.
     */
    class AbstractRule {
    }
    exports.AbstractRule = AbstractRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL3J1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFFQTs7OztPQUlHO0lBQ0gsTUFBc0IsWUFBWTtLQWFqQztJQWJELG9DQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDaGVja2VyfSBmcm9tICcuL2NoZWNrZXInO1xuXG4vKipcbiAqIFRzZXRzZSBydWxlcyBzaG91bGQgZXh0ZW5kIEFic3RyYWN0UnVsZSBhbmQgcHJvdmlkZSBhIGByZWdpc3RlcmAgZnVuY3Rpb24uXG4gKiBSdWxlcyBhcmUgaW5zdGFudGlhdGVkIG9uY2UgcGVyIGNvbXBpbGF0aW9uIG9wZXJhdGlvbiBhbmQgdXNlZCBhY3Jvc3MgbWFueVxuICogZmlsZXMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdFJ1bGUge1xuICAvKipcbiAgICogQSBsb3dlci1kYXNoZWQtY2FzZSBuYW1lIGZvciB0aGF0IHJ1bGUuIFRoaXMgaXMgbm90IHVzZWQgYnkgVHNldHNlIGl0c2VsZixcbiAgICogYnV0IHRoZSBpbnRlZ3JhdG9ycyBtaWdodCAoc3VjaCBhcyB0aGUgVHlwZVNjcmlwdCBCYXplbCBydWxlcywgZm9yXG4gICAqIGluc3RhbmNlKS5cbiAgICovXG4gIGFic3RyYWN0IHJlYWRvbmx5IHJ1bGVOYW1lOiBzdHJpbmc7XG4gIGFic3RyYWN0IHJlYWRvbmx5IGNvZGU6IG51bWJlcjtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGhhbmRsZXIgZnVuY3Rpb25zIG9uIG5vZGVzIGluIENoZWNrZXIuXG4gICAqL1xuICBhYnN0cmFjdCByZWdpc3RlcihjaGVja2VyOiBDaGVja2VyKTogdm9pZDtcbn1cbiJdfQ==