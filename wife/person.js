(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("wife/typescript/testlib/person", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Person {
        constructor(name) {
            this._name = name;
        }
        greet() {
            return "Hello, " + this._name;
        }
    }
    exports.Person = Person;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyc29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vdHlwZXNjcmlwdC90ZXN0bGliL3BlcnNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLE1BQWEsTUFBTTtRQUdmLFlBQVksSUFBWTtZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO1FBRUQsS0FBSztZQUNELE9BQU8sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbEMsQ0FBQztLQUNKO0lBVkQsd0JBVUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgUGVyc29uIHtcbiAgICBwcml2YXRlIF9uYW1lOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgZ3JlZXQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIFwiSGVsbG8sIFwiICsgdGhpcy5fbmFtZTsgXG4gICAgfVxufSJdfQ==