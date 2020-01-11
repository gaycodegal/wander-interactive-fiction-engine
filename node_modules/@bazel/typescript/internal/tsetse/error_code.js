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
     * Error codes for tsetse checks.
     *
     * Start with 21222 and increase linearly.
     * The intent is for these codes to be fixed, so that tsetse users can
     * search for them in user forums and other media.
     */
    var ErrorCode;
    (function (ErrorCode) {
        ErrorCode[ErrorCode["CHECK_RETURN_VALUE"] = 21222] = "CHECK_RETURN_VALUE";
        ErrorCode[ErrorCode["EQUALS_NAN"] = 21223] = "EQUALS_NAN";
        ErrorCode[ErrorCode["BAN_EXPECT_TRUTHY_PROMISE"] = 21224] = "BAN_EXPECT_TRUTHY_PROMISE";
        ErrorCode[ErrorCode["MUST_USE_PROMISES"] = 21225] = "MUST_USE_PROMISES";
        ErrorCode[ErrorCode["BAN_PROMISE_AS_CONDITION"] = 21226] = "BAN_PROMISE_AS_CONDITION";
        ErrorCode[ErrorCode["PROPERTY_RENAMING_SAFE"] = 21227] = "PROPERTY_RENAMING_SAFE";
        ErrorCode[ErrorCode["CONFORMANCE_PATTERN"] = 21228] = "CONFORMANCE_PATTERN";
    })(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfY29kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL2Vycm9yX2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCxJQUFZLFNBUVg7SUFSRCxXQUFZLFNBQVM7UUFDbkIseUVBQTBCLENBQUE7UUFDMUIseURBQWtCLENBQUE7UUFDbEIsdUZBQWlDLENBQUE7UUFDakMsdUVBQXlCLENBQUE7UUFDekIscUZBQWdDLENBQUE7UUFDaEMsaUZBQThCLENBQUE7UUFDOUIsMkVBQTJCLENBQUE7SUFDN0IsQ0FBQyxFQVJXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBUXBCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFcnJvciBjb2RlcyBmb3IgdHNldHNlIGNoZWNrcy5cbiAqXG4gKiBTdGFydCB3aXRoIDIxMjIyIGFuZCBpbmNyZWFzZSBsaW5lYXJseS5cbiAqIFRoZSBpbnRlbnQgaXMgZm9yIHRoZXNlIGNvZGVzIHRvIGJlIGZpeGVkLCBzbyB0aGF0IHRzZXRzZSB1c2VycyBjYW5cbiAqIHNlYXJjaCBmb3IgdGhlbSBpbiB1c2VyIGZvcnVtcyBhbmQgb3RoZXIgbWVkaWEuXG4gKi9cbmV4cG9ydCBlbnVtIEVycm9yQ29kZSB7XG4gIENIRUNLX1JFVFVSTl9WQUxVRSA9IDIxMjIyLFxuICBFUVVBTFNfTkFOID0gMjEyMjMsXG4gIEJBTl9FWFBFQ1RfVFJVVEhZX1BST01JU0UgPSAyMTIyNCxcbiAgTVVTVF9VU0VfUFJPTUlTRVMgPSAyMTIyNSxcbiAgQkFOX1BST01JU0VfQVNfQ09ORElUSU9OID0gMjEyMjYsXG4gIFBST1BFUlRZX1JFTkFNSU5HX1NBRkUgPSAyMTIyNyxcbiAgQ09ORk9STUFOQ0VfUEFUVEVSTiA9IDIxMjI4LFxufVxuIl19