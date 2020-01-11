(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./tsconfig", "./cache", "./compiler_host", "./diagnostics", "./worker", "./manifest", "./plugin_api"], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require("./tsconfig"));
    __export(require("./cache"));
    __export(require("./compiler_host"));
    __export(require("./diagnostics"));
    __export(require("./worker"));
    __export(require("./manifest"));
    __export(require("./plugin_api"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0lBQUEsZ0NBQTJCO0lBQzNCLDZCQUF3QjtJQUN4QixxQ0FBZ0M7SUFDaEMsbUNBQThCO0lBQzlCLDhCQUF5QjtJQUN6QixnQ0FBMkI7SUFDM0Isa0NBQTZCIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSAnLi90c2NvbmZpZyc7XG5leHBvcnQgKiBmcm9tICcuL2NhY2hlJztcbmV4cG9ydCAqIGZyb20gJy4vY29tcGlsZXJfaG9zdCc7XG5leHBvcnQgKiBmcm9tICcuL2RpYWdub3N0aWNzJztcbmV4cG9ydCAqIGZyb20gJy4vd29ya2VyJztcbmV4cG9ydCAqIGZyb20gJy4vbWFuaWZlc3QnO1xuZXhwb3J0ICogZnJvbSAnLi9wbHVnaW5fYXBpJztcbiJdfQ==