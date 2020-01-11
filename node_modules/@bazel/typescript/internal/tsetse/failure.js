(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /**
     * A Tsetse check Failure is almost identical to a Diagnostic from TypeScript
     * except that:
     * (1) The error code is defined by each individual Tsetse rule.
     * (2) The optional `source` property is set to `Tsetse` so the host (VS Code
     * for instance) would use that to indicate where the error comes from.
     * (3) There's an optional suggestedFix field.
     */
    class Failure {
        constructor(sourceFile, start, end, failureText, code, suggestedFix) {
            this.sourceFile = sourceFile;
            this.start = start;
            this.end = end;
            this.failureText = failureText;
            this.code = code;
            this.suggestedFix = suggestedFix;
        }
        /**
         * This returns a structure compatible with ts.Diagnostic, but with added
         * fields, for convenience and to support suggested fixes.
         */
        toDiagnostic() {
            return {
                file: this.sourceFile,
                start: this.start,
                end: this.end,
                // start-end-using systems.
                length: this.end - this.start,
                messageText: this.failureText,
                category: ts.DiagnosticCategory.Error,
                code: this.code,
                // source is the name of the plugin.
                source: 'Tsetse',
                fix: this.suggestedFix
            };
        }
        /**
         * Same as toDiagnostic, but include the fix in the message, so that systems
         * that don't support displaying suggested fixes can still surface that
         * information. This assumes the diagnostic message is going to be presented
         * within the context of the problematic code
         */
        toDiagnosticWithStringifiedFix() {
            const diagnostic = this.toDiagnostic();
            if (this.suggestedFix) {
                diagnostic.messageText += ' ' + this.fixToReadableStringInContext();
            }
            return diagnostic;
        }
        toString() {
            return `{ sourceFile:${this.sourceFile ? this.sourceFile.fileName : 'unknown'}, start:${this.start}, end:${this.end}, fix:${fixToString(this.suggestedFix)} }`;
        }
        /**
         * Stringifies a `Fix`, in a way that makes sense when presented alongside the
         * finding. This is a heuristic, obviously.
         */
        fixToReadableStringInContext() {
            if (!this.suggestedFix)
                return ''; // no changes, nothing to state.
            const f = this.suggestedFix;
            let fixText = '';
            for (const c of f.changes) {
                // Remove leading/trailing whitespace from the stringified suggestions:
                // since we add line breaks after each line of stringified suggestion, and
                // since users will manually apply the fix, there is no need to show
                // trailing whitespace. This is however just for stringification of the
                // fixes: the suggested fix itself still keeps trailing whitespace.
                const printableReplacement = c.replacement.trim();
                // Insertion.
                if (c.start === c.end) {
                    // Try to see if that's an import.
                    if (c.replacement.indexOf('import') !== -1) {
                        fixText += `- Add new import: ${printableReplacement}\n`;
                    }
                    else {
                        // Insertion that's not a full import. This should rarely happen in
                        // our context, and we don't have a great message for these.
                        // For instance, this could be the addition of a new symbol in an
                        // existing import (`import {foo}` becoming `import {foo, bar}`).
                        fixText += `- Insert ${this.readableRange(c.start, c.end)}: ${printableReplacement}\n`;
                    }
                }
                else if (c.start === this.start && c.end === this.end) {
                    // We assume the replacement is the main part of the fix, so put that
                    // individual change first in `fixText`.
                    fixText = `- Replace the full match with: ${printableReplacement}\n` +
                        fixText;
                }
                else {
                    // Fallback case: Use a numerical range to specify a replacement. In
                    // general, falling through in this case should be avoided, as it's not
                    // really readable without an IDE (the range can be outside of the
                    // matched code).
                    fixText = `- Replace ${this.readableRange(c.start, c.end)} with: ` +
                        `${printableReplacement}\n${fixText}`;
                }
            }
            return 'Suggested fix:\n' + fixText.trim();
        }
        // TS indexes from 0 both ways, but tooling generally indexes from 1 for both
        // lines and columns. The translation is done here.
        readableRange(from, to) {
            const lcf = this.sourceFile.getLineAndCharacterOfPosition(from);
            const lct = this.sourceFile.getLineAndCharacterOfPosition(to);
            if (lcf.line === lct.line) {
                if (lcf.character === lct.character) {
                    return `at line ${lcf.line + 1}, char ${lcf.character + 1}`;
                }
                return `line ${lcf.line + 1}, from char ${lcf.character + 1} to ${lct.character + 1}`;
            }
            else {
                return `from line ${lcf.line + 1}, char ${lcf.character + 1} to line ${lct.line + 1}, char ${lct.character + 1}`;
            }
        }
    }
    exports.Failure = Failure;
    /**
     * Stringifies a `Fix`, replacing the `ts.SourceFile` with the matching
     * filename.
     */
    function fixToString(f) {
        if (!f)
            return 'undefined';
        return '{' + JSON.stringify(f.changes.map(ic => {
            return {
                start: ic.start,
                end: ic.end,
                replacement: ic.replacement,
                fileName: ic.sourceFile.fileName
            };
        })) +
            '}';
    }
    exports.fixToString = fixToString;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFpbHVyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNldHNlL2ZhaWx1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQSxpQ0FBaUM7SUFFakM7Ozs7Ozs7T0FPRztJQUNILE1BQWEsT0FBTztRQUNsQixZQUNxQixVQUF5QixFQUN6QixLQUFhLEVBQW1CLEdBQVcsRUFDM0MsV0FBbUIsRUFBbUIsSUFBWSxFQUNsRCxZQUFrQjtZQUhsQixlQUFVLEdBQVYsVUFBVSxDQUFlO1lBQ3pCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFBbUIsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUMzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFtQixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ2xELGlCQUFZLEdBQVosWUFBWSxDQUFNO1FBQUcsQ0FBQztRQUUzQzs7O1dBR0c7UUFDSCxZQUFZO1lBQ1YsT0FBTztnQkFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7Z0JBQ3JCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO2dCQUNHLDJCQUEyQjtnQkFDM0MsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUs7Z0JBQzdCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsUUFBUSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLO2dCQUNyQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2Ysb0NBQW9DO2dCQUNwQyxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxZQUFZO2FBQ3ZCLENBQUM7UUFDSixDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCw4QkFBOEI7WUFDNUIsTUFBTSxVQUFV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RTtvQkFDbkMsT0FBTyxXQUFXLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7aUJBQzdEO2dCQUNELE9BQU8sUUFBUSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsT0FDdkQsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQzthQUN6QjtpQkFBTTtnQkFDTCxPQUFPLGFBQWEsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLFlBQ3ZELEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7YUFDL0M7UUFDSCxDQUFDO0tBQ0Y7SUFoSEQsMEJBZ0hDO0lBNkJEOzs7T0FHRztJQUNILFNBQWdCLFdBQVcsQ0FBQyxDQUFPO1FBQ2pDLElBQUksQ0FBQyxDQUFDO1lBQUUsT0FBTyxXQUFXLENBQUM7UUFDM0IsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUM3QyxPQUFPO2dCQUNMLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQkFDZixHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUc7Z0JBQ1gsV0FBVyxFQUFFLEVBQUUsQ0FBQyxXQUFXO2dCQUMzQixRQUFRLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRO2FBQ2pDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztZQUNDLEdBQUcsQ0FBQTtJQUNULENBQUM7SUFYRCxrQ0FXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKipcbiAqIEEgVHNldHNlIGNoZWNrIEZhaWx1cmUgaXMgYWxtb3N0IGlkZW50aWNhbCB0byBhIERpYWdub3N0aWMgZnJvbSBUeXBlU2NyaXB0XG4gKiBleGNlcHQgdGhhdDpcbiAqICgxKSBUaGUgZXJyb3IgY29kZSBpcyBkZWZpbmVkIGJ5IGVhY2ggaW5kaXZpZHVhbCBUc2V0c2UgcnVsZS5cbiAqICgyKSBUaGUgb3B0aW9uYWwgYHNvdXJjZWAgcHJvcGVydHkgaXMgc2V0IHRvIGBUc2V0c2VgIHNvIHRoZSBob3N0IChWUyBDb2RlXG4gKiBmb3IgaW5zdGFuY2UpIHdvdWxkIHVzZSB0aGF0IHRvIGluZGljYXRlIHdoZXJlIHRoZSBlcnJvciBjb21lcyBmcm9tLlxuICogKDMpIFRoZXJlJ3MgYW4gb3B0aW9uYWwgc3VnZ2VzdGVkRml4IGZpZWxkLlxuICovXG5leHBvcnQgY2xhc3MgRmFpbHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBzdGFydDogbnVtYmVyLCBwcml2YXRlIHJlYWRvbmx5IGVuZDogbnVtYmVyLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBmYWlsdXJlVGV4dDogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IGNvZGU6IG51bWJlcixcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgc3VnZ2VzdGVkRml4PzogRml4KSB7fVxuXG4gIC8qKlxuICAgKiBUaGlzIHJldHVybnMgYSBzdHJ1Y3R1cmUgY29tcGF0aWJsZSB3aXRoIHRzLkRpYWdub3N0aWMsIGJ1dCB3aXRoIGFkZGVkXG4gICAqIGZpZWxkcywgZm9yIGNvbnZlbmllbmNlIGFuZCB0byBzdXBwb3J0IHN1Z2dlc3RlZCBmaXhlcy5cbiAgICovXG4gIHRvRGlhZ25vc3RpYygpOiBEaWFnbm9zdGljV2l0aEZpeCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbGU6IHRoaXMuc291cmNlRmlsZSxcbiAgICAgIHN0YXJ0OiB0aGlzLnN0YXJ0LFxuICAgICAgZW5kOiB0aGlzLmVuZCwgIC8vIE5vdCBpbiB0cy5EaWFnbm9zdGljLCBidXQgYWx3YXlzIHVzZWZ1bCBmb3JcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdGFydC1lbmQtdXNpbmcgc3lzdGVtcy5cbiAgICAgIGxlbmd0aDogdGhpcy5lbmQgLSB0aGlzLnN0YXJ0LFxuICAgICAgbWVzc2FnZVRleHQ6IHRoaXMuZmFpbHVyZVRleHQsXG4gICAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgLy8gc291cmNlIGlzIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4uXG4gICAgICBzb3VyY2U6ICdUc2V0c2UnLFxuICAgICAgZml4OiB0aGlzLnN1Z2dlc3RlZEZpeFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyB0b0RpYWdub3N0aWMsIGJ1dCBpbmNsdWRlIHRoZSBmaXggaW4gdGhlIG1lc3NhZ2UsIHNvIHRoYXQgc3lzdGVtc1xuICAgKiB0aGF0IGRvbid0IHN1cHBvcnQgZGlzcGxheWluZyBzdWdnZXN0ZWQgZml4ZXMgY2FuIHN0aWxsIHN1cmZhY2UgdGhhdFxuICAgKiBpbmZvcm1hdGlvbi4gVGhpcyBhc3N1bWVzIHRoZSBkaWFnbm9zdGljIG1lc3NhZ2UgaXMgZ29pbmcgdG8gYmUgcHJlc2VudGVkXG4gICAqIHdpdGhpbiB0aGUgY29udGV4dCBvZiB0aGUgcHJvYmxlbWF0aWMgY29kZVxuICAgKi9cbiAgdG9EaWFnbm9zdGljV2l0aFN0cmluZ2lmaWVkRml4KCk6IERpYWdub3N0aWNXaXRoRml4IHtcbiAgICBjb25zdCBkaWFnbm9zdGljID0gdGhpcy50b0RpYWdub3N0aWMoKTtcbiAgICBpZiAodGhpcy5zdWdnZXN0ZWRGaXgpIHtcbiAgICAgIGRpYWdub3N0aWMubWVzc2FnZVRleHQgKz0gJyAnICsgdGhpcy5maXhUb1JlYWRhYmxlU3RyaW5nSW5Db250ZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiBkaWFnbm9zdGljO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHsgc291cmNlRmlsZToke1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPyB0aGlzLnNvdXJjZUZpbGUuZmlsZU5hbWUgOiAndW5rbm93bid9LCBzdGFydDoke1xuICAgICAgICB0aGlzLnN0YXJ0fSwgZW5kOiR7dGhpcy5lbmR9LCBmaXg6JHtmaXhUb1N0cmluZyh0aGlzLnN1Z2dlc3RlZEZpeCl9IH1gO1xuICB9XG5cblxuICAvKipcbiAgICogU3RyaW5naWZpZXMgYSBgRml4YCwgaW4gYSB3YXkgdGhhdCBtYWtlcyBzZW5zZSB3aGVuIHByZXNlbnRlZCBhbG9uZ3NpZGUgdGhlXG4gICAqIGZpbmRpbmcuIFRoaXMgaXMgYSBoZXVyaXN0aWMsIG9idmlvdXNseS5cbiAgICovXG4gIGZpeFRvUmVhZGFibGVTdHJpbmdJbkNvbnRleHQoKSB7XG4gICAgaWYgKCF0aGlzLnN1Z2dlc3RlZEZpeCkgcmV0dXJuICcnOyAgLy8gbm8gY2hhbmdlcywgbm90aGluZyB0byBzdGF0ZS5cbiAgICBjb25zdCBmOiBGaXggPSB0aGlzLnN1Z2dlc3RlZEZpeDtcbiAgICBsZXQgZml4VGV4dCA9ICcnO1xuXG4gICAgZm9yIChjb25zdCBjIG9mIGYuY2hhbmdlcykge1xuICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZSBmcm9tIHRoZSBzdHJpbmdpZmllZCBzdWdnZXN0aW9uczpcbiAgICAgIC8vIHNpbmNlIHdlIGFkZCBsaW5lIGJyZWFrcyBhZnRlciBlYWNoIGxpbmUgb2Ygc3RyaW5naWZpZWQgc3VnZ2VzdGlvbiwgYW5kXG4gICAgICAvLyBzaW5jZSB1c2VycyB3aWxsIG1hbnVhbGx5IGFwcGx5IHRoZSBmaXgsIHRoZXJlIGlzIG5vIG5lZWQgdG8gc2hvd1xuICAgICAgLy8gdHJhaWxpbmcgd2hpdGVzcGFjZS4gVGhpcyBpcyBob3dldmVyIGp1c3QgZm9yIHN0cmluZ2lmaWNhdGlvbiBvZiB0aGVcbiAgICAgIC8vIGZpeGVzOiB0aGUgc3VnZ2VzdGVkIGZpeCBpdHNlbGYgc3RpbGwga2VlcHMgdHJhaWxpbmcgd2hpdGVzcGFjZS5cbiAgICAgIGNvbnN0IHByaW50YWJsZVJlcGxhY2VtZW50ID0gYy5yZXBsYWNlbWVudC50cmltKCk7XG5cbiAgICAgIC8vIEluc2VydGlvbi5cbiAgICAgIGlmIChjLnN0YXJ0ID09PSBjLmVuZCkge1xuICAgICAgICAvLyBUcnkgdG8gc2VlIGlmIHRoYXQncyBhbiBpbXBvcnQuXG4gICAgICAgIGlmIChjLnJlcGxhY2VtZW50LmluZGV4T2YoJ2ltcG9ydCcpICE9PSAtMSkge1xuICAgICAgICAgIGZpeFRleHQgKz0gYC0gQWRkIG5ldyBpbXBvcnQ6ICR7cHJpbnRhYmxlUmVwbGFjZW1lbnR9XFxuYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJbnNlcnRpb24gdGhhdCdzIG5vdCBhIGZ1bGwgaW1wb3J0LiBUaGlzIHNob3VsZCByYXJlbHkgaGFwcGVuIGluXG4gICAgICAgICAgLy8gb3VyIGNvbnRleHQsIGFuZCB3ZSBkb24ndCBoYXZlIGEgZ3JlYXQgbWVzc2FnZSBmb3IgdGhlc2UuXG4gICAgICAgICAgLy8gRm9yIGluc3RhbmNlLCB0aGlzIGNvdWxkIGJlIHRoZSBhZGRpdGlvbiBvZiBhIG5ldyBzeW1ib2wgaW4gYW5cbiAgICAgICAgICAvLyBleGlzdGluZyBpbXBvcnQgKGBpbXBvcnQge2Zvb31gIGJlY29taW5nIGBpbXBvcnQge2ZvbywgYmFyfWApLlxuICAgICAgICAgIGZpeFRleHQgKz0gYC0gSW5zZXJ0ICR7dGhpcy5yZWFkYWJsZVJhbmdlKGMuc3RhcnQsIGMuZW5kKX06ICR7XG4gICAgICAgICAgICAgIHByaW50YWJsZVJlcGxhY2VtZW50fVxcbmA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYy5zdGFydCA9PT0gdGhpcy5zdGFydCAmJiBjLmVuZCA9PT0gdGhpcy5lbmQpIHtcbiAgICAgICAgLy8gV2UgYXNzdW1lIHRoZSByZXBsYWNlbWVudCBpcyB0aGUgbWFpbiBwYXJ0IG9mIHRoZSBmaXgsIHNvIHB1dCB0aGF0XG4gICAgICAgIC8vIGluZGl2aWR1YWwgY2hhbmdlIGZpcnN0IGluIGBmaXhUZXh0YC5cbiAgICAgICAgZml4VGV4dCA9IGAtIFJlcGxhY2UgdGhlIGZ1bGwgbWF0Y2ggd2l0aDogJHtwcmludGFibGVSZXBsYWNlbWVudH1cXG5gICtcbiAgICAgICAgICAgIGZpeFRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjayBjYXNlOiBVc2UgYSBudW1lcmljYWwgcmFuZ2UgdG8gc3BlY2lmeSBhIHJlcGxhY2VtZW50LiBJblxuICAgICAgICAvLyBnZW5lcmFsLCBmYWxsaW5nIHRocm91Z2ggaW4gdGhpcyBjYXNlIHNob3VsZCBiZSBhdm9pZGVkLCBhcyBpdCdzIG5vdFxuICAgICAgICAvLyByZWFsbHkgcmVhZGFibGUgd2l0aG91dCBhbiBJREUgKHRoZSByYW5nZSBjYW4gYmUgb3V0c2lkZSBvZiB0aGVcbiAgICAgICAgLy8gbWF0Y2hlZCBjb2RlKS5cbiAgICAgICAgZml4VGV4dCA9IGAtIFJlcGxhY2UgJHt0aGlzLnJlYWRhYmxlUmFuZ2UoYy5zdGFydCwgYy5lbmQpfSB3aXRoOiBgICtcbiAgICAgICAgICAgIGAke3ByaW50YWJsZVJlcGxhY2VtZW50fVxcbiR7Zml4VGV4dH1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAnU3VnZ2VzdGVkIGZpeDpcXG4nICsgZml4VGV4dC50cmltKCk7XG4gIH1cblxuICAvLyBUUyBpbmRleGVzIGZyb20gMCBib3RoIHdheXMsIGJ1dCB0b29saW5nIGdlbmVyYWxseSBpbmRleGVzIGZyb20gMSBmb3IgYm90aFxuICAvLyBsaW5lcyBhbmQgY29sdW1ucy4gVGhlIHRyYW5zbGF0aW9uIGlzIGRvbmUgaGVyZS5cbiAgcmVhZGFibGVSYW5nZShmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpIHtcbiAgICBjb25zdCBsY2YgPSB0aGlzLnNvdXJjZUZpbGUuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oZnJvbSk7XG4gICAgY29uc3QgbGN0ID0gdGhpcy5zb3VyY2VGaWxlLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHRvKTtcbiAgICBpZiAobGNmLmxpbmUgPT09IGxjdC5saW5lKSB7XG4gICAgICBpZiAobGNmLmNoYXJhY3RlciA9PT0gbGN0LmNoYXJhY3Rlcikge1xuICAgICAgICByZXR1cm4gYGF0IGxpbmUgJHtsY2YubGluZSArIDF9LCBjaGFyICR7bGNmLmNoYXJhY3RlciArIDF9YDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgbGluZSAke2xjZi5saW5lICsgMX0sIGZyb20gY2hhciAke2xjZi5jaGFyYWN0ZXIgKyAxfSB0byAke1xuICAgICAgICAgIGxjdC5jaGFyYWN0ZXIgKyAxfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgZnJvbSBsaW5lICR7bGNmLmxpbmUgKyAxfSwgY2hhciAke2xjZi5jaGFyYWN0ZXIgKyAxfSB0byBsaW5lICR7XG4gICAgICAgICAgbGN0LmxpbmUgKyAxfSwgY2hhciAke2xjdC5jaGFyYWN0ZXIgKyAxfWA7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSBgRml4YCBpcyBhIHBvdGVudGlhbCByZXBhaXIgdG8gdGhlIGFzc29jaWF0ZWQgYEZhaWx1cmVgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZpeCB7XG4gIC8qKlxuICAgKiBUaGUgaW5kaXZpZHVhbCB0ZXh0IHJlcGxhY2VtZW50cyBjb21wb3NpbmcgdGhhdCBmaXguXG4gICAqL1xuICBjaGFuZ2VzOiBJbmRpdmlkdWFsQ2hhbmdlW10sXG59XG5cbi8qKlxuICogQW4gaW5kaXZpZHVhbCB0ZXh0IHJlcGxhY2VtZW50L2luc2VydGlvbiBpbiBhIHNvdXJjZSBmaWxlLiBVc2VkIGFzIHBhcnQgb2YgYVxuICogYEZpeGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5kaXZpZHVhbENoYW5nZSB7XG4gIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCByZXBsYWNlbWVudDogc3RyaW5nXG59XG5cbi8qKlxuICogQSB0cy5EaWFnbm9zdGljIHRoYXQgbWlnaHQgaW5jbHVkZSBhIGBGaXhgLCBhbmQgd2l0aCBhbiBhZGRlZCBgZW5kYCBmaWVsZCBmb3JcbiAqIGNvbnZlbmllbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpYWdub3N0aWNXaXRoRml4IGV4dGVuZHMgdHMuRGlhZ25vc3RpYyB7XG4gIGVuZDogbnVtYmVyO1xuICBmaXg/OiBGaXg7XG59XG5cbi8qKlxuICogU3RyaW5naWZpZXMgYSBgRml4YCwgcmVwbGFjaW5nIHRoZSBgdHMuU291cmNlRmlsZWAgd2l0aCB0aGUgbWF0Y2hpbmdcbiAqIGZpbGVuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZml4VG9TdHJpbmcoZj86IEZpeCkge1xuICBpZiAoIWYpIHJldHVybiAndW5kZWZpbmVkJztcbiAgcmV0dXJuICd7JyArIEpTT04uc3RyaW5naWZ5KGYuY2hhbmdlcy5tYXAoaWMgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBzdGFydDogaWMuc3RhcnQsXG4gICAgICBlbmQ6IGljLmVuZCxcbiAgICAgIHJlcGxhY2VtZW50OiBpYy5yZXBsYWNlbWVudCxcbiAgICAgIGZpbGVOYW1lOiBpYy5zb3VyY2VGaWxlLmZpbGVOYW1lXG4gICAgfTtcbiAgfSkpICtcbiAgICAgICd9J1xufVxuIl19