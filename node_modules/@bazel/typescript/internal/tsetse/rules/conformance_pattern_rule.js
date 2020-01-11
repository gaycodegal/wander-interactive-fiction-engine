(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../error_code", "../util/pattern_config", "../util/pattern_engines/name_call_non_constant_argument", "../util/pattern_engines/name_engine", "../util/pattern_engines/property_non_constant_write_engine", "../util/pattern_engines/property_write_engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const error_code_1 = require("../error_code");
    const pattern_config_1 = require("../util/pattern_config");
    exports.PatternKind = pattern_config_1.PatternKind;
    const name_call_non_constant_argument_1 = require("../util/pattern_engines/name_call_non_constant_argument");
    const name_engine_1 = require("../util/pattern_engines/name_engine");
    const property_non_constant_write_engine_1 = require("../util/pattern_engines/property_non_constant_write_engine");
    const property_write_engine_1 = require("../util/pattern_engines/property_write_engine");
    /**
     * Builds a Rule that matches a certain pattern, given as parameter, and
     * that can additionally run a suggested fix generator on the matches.
     *
     * This is templated, mostly to ensure the nodes that have been matched
     * correspond to what the Fixer expects.
     */
    class ConformancePatternRule {
        constructor(config, fixer) {
            this.code = error_code_1.ErrorCode.CONFORMANCE_PATTERN;
            switch (config.kind) {
                case pattern_config_1.PatternKind.BANNED_PROPERTY_WRITE:
                    this.engine = new property_write_engine_1.PropertyWriteEngine(config, fixer);
                    break;
                case pattern_config_1.PatternKind.BANNED_PROPERTY_NON_CONSTANT_WRITE:
                    this.engine = new property_non_constant_write_engine_1.PropertyNonConstantWriteEngine(config, fixer);
                    break;
                case pattern_config_1.PatternKind.BANNED_NAME:
                    this.engine = new name_engine_1.NameEngine(config, fixer);
                    break;
                case pattern_config_1.PatternKind.BANNED_NAME_CALL_NON_CONSTANT_ARGUMENT:
                    this.engine = new name_call_non_constant_argument_1.CallNonConstantArgumentEngine(config, fixer);
                    break;
                default:
                    throw new Error('Config type not recognized, or not implemented yet.');
            }
            this.ruleName = config.name || `conformance-pattern-${config.kind}`;
        }
        register(checker) {
            this.engine.register(checker);
        }
    }
    exports.ConformancePatternRule = ConformancePatternRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZm9ybWFuY2VfcGF0dGVybl9ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2V0c2UvcnVsZXMvY29uZm9ybWFuY2VfcGF0dGVybl9ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQ0EsOENBQXdDO0lBR3hDLDJEQUEyRDtJQW9EbkQsc0JBcERRLDRCQUFXLENBb0RSO0lBbkRuQiw2R0FBc0c7SUFDdEcscUVBQStEO0lBRS9ELG1IQUEwRztJQUMxRyx5RkFBa0Y7SUFHbEY7Ozs7OztPQU1HO0lBQ0gsTUFBYSxzQkFBc0I7UUFNakMsWUFBWSxNQUFjLEVBQUUsS0FBYTtZQUpoQyxTQUFJLEdBQUcsc0JBQVMsQ0FBQyxtQkFBbUIsQ0FBQztZQUs1QyxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLEtBQUssNEJBQVcsQ0FBQyxxQkFBcUI7b0JBQ3BDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSwyQ0FBbUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3JELE1BQU07Z0JBQ1IsS0FBSyw0QkFBVyxDQUFDLGtDQUFrQztvQkFDakQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLG1FQUE4QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDaEUsTUFBTTtnQkFDUixLQUFLLDRCQUFXLENBQUMsV0FBVztvQkFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHdCQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM1QyxNQUFNO2dCQUNSLEtBQUssNEJBQVcsQ0FBQyxzQ0FBc0M7b0JBQ3JELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSwrREFBNkIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQy9ELE1BQU07Z0JBQ1I7b0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO2FBQzFFO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxJQUFJLHVCQUF1QixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEUsQ0FBQztRQUVELFFBQVEsQ0FBQyxPQUFnQjtZQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxDQUFDO0tBQ0Y7SUE3QkQsd0RBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDaGVja2VyfSBmcm9tICcuLi9jaGVja2VyJztcbmltcG9ydCB7RXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcl9jb2RlJztcbmltcG9ydCB7QWJzdHJhY3RSdWxlfSBmcm9tICcuLi9ydWxlJztcbmltcG9ydCB7Rml4ZXJ9IGZyb20gJy4uL3V0aWwvZml4ZXInO1xuaW1wb3J0IHtDb25maWcsIFBhdHRlcm5LaW5kfSBmcm9tICcuLi91dGlsL3BhdHRlcm5fY29uZmlnJztcbmltcG9ydCB7Q2FsbE5vbkNvbnN0YW50QXJndW1lbnRFbmdpbmV9IGZyb20gJy4uL3V0aWwvcGF0dGVybl9lbmdpbmVzL25hbWVfY2FsbF9ub25fY29uc3RhbnRfYXJndW1lbnQnO1xuaW1wb3J0IHtOYW1lRW5naW5lfSBmcm9tICcuLi91dGlsL3BhdHRlcm5fZW5naW5lcy9uYW1lX2VuZ2luZSc7XG5pbXBvcnQge1BhdHRlcm5FbmdpbmV9IGZyb20gJy4uL3V0aWwvcGF0dGVybl9lbmdpbmVzL3BhdHRlcm5fZW5naW5lJztcbmltcG9ydCB7UHJvcGVydHlOb25Db25zdGFudFdyaXRlRW5naW5lfSBmcm9tICcuLi91dGlsL3BhdHRlcm5fZW5naW5lcy9wcm9wZXJ0eV9ub25fY29uc3RhbnRfd3JpdGVfZW5naW5lJztcbmltcG9ydCB7UHJvcGVydHlXcml0ZUVuZ2luZX0gZnJvbSAnLi4vdXRpbC9wYXR0ZXJuX2VuZ2luZXMvcHJvcGVydHlfd3JpdGVfZW5naW5lJztcblxuXG4vKipcbiAqIEJ1aWxkcyBhIFJ1bGUgdGhhdCBtYXRjaGVzIGEgY2VydGFpbiBwYXR0ZXJuLCBnaXZlbiBhcyBwYXJhbWV0ZXIsIGFuZFxuICogdGhhdCBjYW4gYWRkaXRpb25hbGx5IHJ1biBhIHN1Z2dlc3RlZCBmaXggZ2VuZXJhdG9yIG9uIHRoZSBtYXRjaGVzLlxuICpcbiAqIFRoaXMgaXMgdGVtcGxhdGVkLCBtb3N0bHkgdG8gZW5zdXJlIHRoZSBub2RlcyB0aGF0IGhhdmUgYmVlbiBtYXRjaGVkXG4gKiBjb3JyZXNwb25kIHRvIHdoYXQgdGhlIEZpeGVyIGV4cGVjdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25mb3JtYW5jZVBhdHRlcm5SdWxlIGltcGxlbWVudHMgQWJzdHJhY3RSdWxlIHtcbiAgcmVhZG9ubHkgcnVsZU5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29kZSA9IEVycm9yQ29kZS5DT05GT1JNQU5DRV9QQVRURVJOO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgZW5naW5lOiBQYXR0ZXJuRW5naW5lO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29uZmlnLCBmaXhlcj86IEZpeGVyKSB7XG4gICAgc3dpdGNoIChjb25maWcua2luZCkge1xuICAgICAgY2FzZSBQYXR0ZXJuS2luZC5CQU5ORURfUFJPUEVSVFlfV1JJVEU6XG4gICAgICAgIHRoaXMuZW5naW5lID0gbmV3IFByb3BlcnR5V3JpdGVFbmdpbmUoY29uZmlnLCBmaXhlcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQYXR0ZXJuS2luZC5CQU5ORURfUFJPUEVSVFlfTk9OX0NPTlNUQU5UX1dSSVRFOlxuICAgICAgICB0aGlzLmVuZ2luZSA9IG5ldyBQcm9wZXJ0eU5vbkNvbnN0YW50V3JpdGVFbmdpbmUoY29uZmlnLCBmaXhlcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQYXR0ZXJuS2luZC5CQU5ORURfTkFNRTpcbiAgICAgICAgdGhpcy5lbmdpbmUgPSBuZXcgTmFtZUVuZ2luZShjb25maWcsIGZpeGVyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBhdHRlcm5LaW5kLkJBTk5FRF9OQU1FX0NBTExfTk9OX0NPTlNUQU5UX0FSR1VNRU5UOlxuICAgICAgICB0aGlzLmVuZ2luZSA9IG5ldyBDYWxsTm9uQ29uc3RhbnRBcmd1bWVudEVuZ2luZShjb25maWcsIGZpeGVyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZpZyB0eXBlIG5vdCByZWNvZ25pemVkLCBvciBub3QgaW1wbGVtZW50ZWQgeWV0LicpO1xuICAgIH1cbiAgICB0aGlzLnJ1bGVOYW1lID0gY29uZmlnLm5hbWUgfHwgYGNvbmZvcm1hbmNlLXBhdHRlcm4tJHtjb25maWcua2luZH1gO1xuICB9XG5cbiAgcmVnaXN0ZXIoY2hlY2tlcjogQ2hlY2tlcikge1xuICAgIHRoaXMuZW5naW5lLnJlZ2lzdGVyKGNoZWNrZXIpO1xuICB9XG59XG5cbi8vIFJlLWV4cG9ydGVkIGZvciBjb252ZW5pZW5jZSB3aGVuIGluc3RhbnRpYXRpbmcgcnVsZXMuXG4vKipcbiAqIFRoZSBsaXN0IG9mIHN1cHBvcnRlZCBwYXR0ZXJucyB1c2VhYmxlIGluIENvbmZvcm1hbmNlUGF0dGVyblJ1bGUuIFRoZVxuICogcGF0dGVybnMgd2hvc2UgbmFtZSBtYXRjaCBKU0NvbmZvcm1hbmNlIHBhdHRlcm5zIHNob3VsZCBiZWhhdmUgc2ltaWxhcmx5IChzZWVcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2xvc3VyZS1jb21waWxlci93aWtpL0pTLUNvbmZvcm1hbmNlLUZyYW1ld29yaykuXG4gKi9cbmV4cG9ydCB7UGF0dGVybktpbmR9O1xuIl19