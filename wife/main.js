(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("wife/typescript/game/main", ["require", "exports", "wife/typescript/testlib/person"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const person_1 = require("wife/typescript/testlib/person");
    const person = new person_1.Person("Jon");
    console.log("hm", person.greet());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3R5cGVzY3JpcHQvZ2FtZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsMkRBQXdEO0lBQ3hELE1BQU0sTUFBTSxHQUFXLElBQUksZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGVyc29uIH0gZnJvbSBcIndpZmUvdHlwZXNjcmlwdC90ZXN0bGliL3BlcnNvblwiO1xuY29uc3QgcGVyc29uOiBQZXJzb24gPSBuZXcgUGVyc29uKFwiSm9uXCIpO1xuY29uc29sZS5sb2coXCJobVwiLCBwZXJzb24uZ3JlZXQoKSk7Il19