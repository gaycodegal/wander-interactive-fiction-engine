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
     * The list of supported patterns useable in ConformancePatternRule. The
     * patterns whose name match JSConformance patterns should behave similarly (see
     * https://github.com/google/closure-compiler/wiki/JS-Conformance-Framework)
     */
    var PatternKind;
    (function (PatternKind) {
        PatternKind["BANNED_NAME"] = "banned-name";
        PatternKind["BANNED_PROPERTY_WRITE"] = "banned-property-write";
        PatternKind["BANNED_PROPERTY_NON_CONSTANT_WRITE"] = "banned-property-non-constant-write";
        // Not from JSConformance.
        PatternKind["BANNED_NAME_CALL_NON_CONSTANT_ARGUMENT"] = "banned-call-non-constant-argument";
    })(PatternKind = exports.PatternKind || (exports.PatternKind = {}));
    /**
     * The categories of whitelist entries.
     */
    var WhitelistReason;
    (function (WhitelistReason) {
        /** No reason. */
        WhitelistReason[WhitelistReason["UNSPECIFIED"] = 0] = "UNSPECIFIED";
        /** Code that has to be grandfathered in (no guarantees). */
        WhitelistReason[WhitelistReason["LEGACY"] = 1] = "LEGACY";
        /**
         * Code that does not enter the scope of this particular check  (no
         * guarantees).
         */
        WhitelistReason[WhitelistReason["OUT_OF_SCOPE"] = 2] = "OUT_OF_SCOPE";
        /** Manually reviewed exceptions (supposedly okay). */
        WhitelistReason[WhitelistReason["MANUALLY_REVIEWED"] = 3] = "MANUALLY_REVIEWED";
    })(WhitelistReason = exports.WhitelistReason || (exports.WhitelistReason = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0dGVybl9jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzZXRzZS91dGlsL3BhdHRlcm5fY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQ0E7Ozs7T0FJRztJQUNILElBQVksV0FNWDtJQU5ELFdBQVksV0FBVztRQUNyQiwwQ0FBMkIsQ0FBQTtRQUMzQiw4REFBK0MsQ0FBQTtRQUMvQyx3RkFBeUUsQ0FBQTtRQUN6RSwwQkFBMEI7UUFDMUIsMkZBQTRFLENBQUE7SUFDOUUsQ0FBQyxFQU5XLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBTXRCO0lBNEREOztPQUVHO0lBQ0gsSUFBWSxlQVlYO0lBWkQsV0FBWSxlQUFlO1FBQ3pCLGlCQUFpQjtRQUNqQixtRUFBVyxDQUFBO1FBQ1gsNERBQTREO1FBQzVELHlEQUFNLENBQUE7UUFDTjs7O1dBR0c7UUFDSCxxRUFBWSxDQUFBO1FBQ1osc0RBQXNEO1FBQ3RELCtFQUFpQixDQUFBO0lBQ25CLENBQUMsRUFaVyxlQUFlLEdBQWYsdUJBQWUsS0FBZix1QkFBZSxRQVkxQiIsInNvdXJjZXNDb250ZW50IjpbIlxuLyoqXG4gKiBUaGUgbGlzdCBvZiBzdXBwb3J0ZWQgcGF0dGVybnMgdXNlYWJsZSBpbiBDb25mb3JtYW5jZVBhdHRlcm5SdWxlLiBUaGVcbiAqIHBhdHRlcm5zIHdob3NlIG5hbWUgbWF0Y2ggSlNDb25mb3JtYW5jZSBwYXR0ZXJucyBzaG91bGQgYmVoYXZlIHNpbWlsYXJseSAoc2VlXG4gKiBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2Nsb3N1cmUtY29tcGlsZXIvd2lraS9KUy1Db25mb3JtYW5jZS1GcmFtZXdvcmspXG4gKi9cbmV4cG9ydCBlbnVtIFBhdHRlcm5LaW5kIHtcbiAgQkFOTkVEX05BTUUgPSAnYmFubmVkLW5hbWUnLFxuICBCQU5ORURfUFJPUEVSVFlfV1JJVEUgPSAnYmFubmVkLXByb3BlcnR5LXdyaXRlJyxcbiAgQkFOTkVEX1BST1BFUlRZX05PTl9DT05TVEFOVF9XUklURSA9ICdiYW5uZWQtcHJvcGVydHktbm9uLWNvbnN0YW50LXdyaXRlJyxcbiAgLy8gTm90IGZyb20gSlNDb25mb3JtYW5jZS5cbiAgQkFOTkVEX05BTUVfQ0FMTF9OT05fQ09OU1RBTlRfQVJHVU1FTlQgPSAnYmFubmVkLWNhbGwtbm9uLWNvbnN0YW50LWFyZ3VtZW50J1xufVxuXG4vKipcbiAqIEEgY29uZmlnIGZvciBDb25mb3JtYW5jZVBhdHRlcm5SdWxlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZyB7XG4gIGtpbmQ6IFBhdHRlcm5LaW5kO1xuXG4gIC8qKlxuICAgKiBWYWx1ZXMgaGF2ZSBhIHBhdHRlcm4tc3BlY2lmaWMgc3ludGF4LlxuICAgKlxuICAgKiBUT0RPKHJqYW1ldCk6IFdlJ2xsIGRvY3VtZW50IHRoZW0sIGJ1dCBmb3Igbm93IHNlZSBlYWNoIHBhdHRlcm5LaW5kJ3NcbiAgICogdGVzdHMgZm9yIGV4YW1wbGVzLlxuICAgKi9cbiAgdmFsdWVzOiBzdHJpbmdbXTtcblxuICAvKiogVGhlIGVycm9yIG1lc3NhZ2UgdGhpcyBwYXR0ZXJuIHdpbGwgY3JlYXRlLiAqL1xuICBlcnJvck1lc3NhZ2U6IHN0cmluZztcblxuICAvKiogQSBsaXN0IG9mIHdoaXRlbGlzdCBibG9ja3MuICovXG4gIHdoaXRlbGlzdEVudHJpZXM/OiBXaGl0ZWxpc3RFbnRyeVtdO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBuYW1lIGZvciB0aGF0IHJ1bGUsIHdoaWNoIHdpbGwgYmUgdGhlIHJ1bGUncyBgcnVsZU5hbWVgLlxuICAgKiBTaG91bGQgYmUgbG93ZXItZGFzaGVkLWNhc2UuXG4gICAqL1xuICBuYW1lPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgd2hpdGVsaXN0IGVudHJ5LCBjb3JyZXNwb25kaW5nIHRvIGEgbG9naWNhbCB3aGl0ZWxpc3RpbmcgcnVsZS4gVXNlIHRoZXNlXG4gKiB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIHZhcmlvdXMgbG9naWNhbCByZWFzb25zIGZvciB3aGl0ZWxpc3Rpbmcgc29tZXRoaW5nOlxuICogZm9yIGluc3RhbmNlLCB0aWUgdGhlc2UgdG8gcGFydGljdWxhciBidWdzIHRoYXQgbmVlZGVkIHdoaXRlbGlzdGluZywgcGVyXG4gKiBsZWdhY3kgcHJvamVjdCwgbWFudWFsbHkgcmV2aWV3ZWQgZW50cmllcywgYW5kIHNvIG9uLlxuICpcbiAqIFdoaXRlbGlzdHMgYXJlIGJhc2VkIG9uIHRoZSBmaWxlIHBhdGhzIHByb3ZpZGVkIGJ5IHRoZSBUUyBjb21waWxlciwgd2l0aFxuICogYm90aCByZWdleHAtYmFzZWQgY2hlY2tzIGFuZCBwcmVmaXgtYmFzZWQgY2hlY2tzLlxuICpcbiAqXG4gKiBGb2xsb3dzIHRoZSBsb2dpYyBpblxuICogaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jbG9zdXJlLWNvbXBpbGVyL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2phdmFzY3JpcHQvanNjb21wL2NvbmZvcm1hbmNlLnByb3RvLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdoaXRlbGlzdEVudHJ5IHtcbiAgLyoqIFRoZSBjYXRlZ29yeSBjb3JyZXNwb25kaW5nIHRvIHRoaXMgZW50cnkuICovXG4gIHJlYXNvbjogV2hpdGVsaXN0UmVhc29uO1xuICAvKiogV2h5IGlzIHRoaXMgb2theSB0byB3aGl0ZWxpc3QuICovXG4gIGV4cGxhbmF0aW9uPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBSZWdleHBzIGZvciB0aGUgcGF0aHMgb2YgZmlsZXMgdGhhdCB3aWxsIGJlIGlnbm9yZWQgYnkgdGhlXG4gICAqIENvbmZvcm1hbmNlUGF0dGVybi4gQmV3YXJlLCBlc2NhcGluZyBjYW4gYmUgdHJpY2t5LlxuICAgKi9cbiAgcmVnZXhwPzogc3RyaW5nW107XG4gIC8qKlxuICAgKiBQcmVmaXhlcyBmb3IgdGhlIHBhdGhzIG9mIGZpbGVzIHRoYXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHRoZVxuICAgKiBDb25mb3JtYW5jZVBhdHRlcm4uXG4gICAqL1xuICBwcmVmaXg/OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBUaGUgY2F0ZWdvcmllcyBvZiB3aGl0ZWxpc3QgZW50cmllcy5cbiAqL1xuZXhwb3J0IGVudW0gV2hpdGVsaXN0UmVhc29uIHtcbiAgLyoqIE5vIHJlYXNvbi4gKi9cbiAgVU5TUEVDSUZJRUQsXG4gIC8qKiBDb2RlIHRoYXQgaGFzIHRvIGJlIGdyYW5kZmF0aGVyZWQgaW4gKG5vIGd1YXJhbnRlZXMpLiAqL1xuICBMRUdBQ1ksXG4gIC8qKlxuICAgKiBDb2RlIHRoYXQgZG9lcyBub3QgZW50ZXIgdGhlIHNjb3BlIG9mIHRoaXMgcGFydGljdWxhciBjaGVjayAgKG5vXG4gICAqIGd1YXJhbnRlZXMpLlxuICAgKi9cbiAgT1VUX09GX1NDT1BFLFxuICAvKiogTWFudWFsbHkgcmV2aWV3ZWQgZXhjZXB0aW9ucyAoc3VwcG9zZWRseSBva2F5KS4gKi9cbiAgTUFOVUFMTFlfUkVWSUVXRURcbn1cbiJdfQ==