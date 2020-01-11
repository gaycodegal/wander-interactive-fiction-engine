/**
 * @fileoverview extensions to TypeScript functionality around error handling
 * (ts.Diagnostics).
 */
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
     * If the current compilation was a compilation test expecting certain
     * diagnostics, filter out the expected diagnostics, and add new diagnostics
     * (aka errors) for non-matched diagnostics.
     */
    function filterExpected(bazelOpts, diagnostics, formatFn = uglyFormat) {
        if (!bazelOpts.expectedDiagnostics.length)
            return diagnostics;
        // The regex contains two parts:
        // 1. Optional position: '\(5,1\)'
        // 2. Required TS error: 'TS2000: message text.'
        // Need triple escapes because the expected diagnostics that we're matching
        // here are regexes, too.
        const ERROR_RE = /^(?:\\\((\d*),(\d*)\\\).*)?TS(-?\d+):(.*)/;
        const incorrectErrors = bazelOpts.expectedDiagnostics.filter(e => !e.match(ERROR_RE));
        if (incorrectErrors.length) {
            const msg = `Expected errors must match regex ${ERROR_RE}\n\t` +
                `expected errors are "${incorrectErrors.join(', ')}"`;
            return [{
                    file: undefined,
                    start: 0,
                    length: 0,
                    messageText: msg,
                    category: ts.DiagnosticCategory.Error,
                    code: 0,
                }];
        }
        const expectedDiags = bazelOpts.expectedDiagnostics.map(expected => {
            const m = expected.match(/^(?:\\\((\d*),(\d*)\\\).*)?TS(-?\d+):(.*)$/);
            if (!m) {
                throw new Error('Incorrect expected error, did you forget character escapes in ' +
                    expected);
            }
            const [, lineStr, columnStr, codeStr, regexp] = m;
            const [line, column, code] = [lineStr, columnStr, codeStr].map(str => {
                const i = Number(str);
                if (Number.isNaN(i)) {
                    return 0;
                }
                return i;
            });
            return {
                line,
                column,
                expected,
                code,
                regexp: new RegExp(regexp),
                matched: false,
            };
        });
        const unmatchedDiags = diagnostics.filter(diag => {
            let line = -1;
            let character = -1;
            if (diag.file && diag.start) {
                ({ line, character } =
                    ts.getLineAndCharacterOfPosition(diag.file, diag.start));
            }
            let matched = false;
            const msg = formatFn(bazelOpts.target, [diag]);
            // checkDiagMatchesExpected checks if the expected diagnostics matches the
            // actual diagnostics.
            const checkDiagMatchesExpected = (expDiag, diag) => {
                if (expDiag.code !== diag.code || msg.search(expDiag.regexp) === -1) {
                    return false;
                }
                // line and column are optional fields, only check them if they
                // are explicitly specified.
                // line and character are zero based.
                if (expDiag.line !== 0 && expDiag.line !== line + 1) {
                    return false;
                }
                if (expDiag.column !== 0 && expDiag.column !== character + 1) {
                    return false;
                }
                return true;
            };
            for (const expDiag of expectedDiags) {
                if (checkDiagMatchesExpected(expDiag, diag)) {
                    expDiag.matched = true;
                    matched = true;
                    // continue, one diagnostic may match multiple expected errors.
                }
            }
            return !matched;
        });
        const unmatchedErrors = expectedDiags.filter(err => !err.matched).map(err => {
            const file = ts.createSourceFile(bazelOpts.target, '/* fake source as marker */', ts.ScriptTarget.Latest);
            const messageText = `Expected a compilation error matching ${JSON.stringify(err.expected)}`;
            return {
                file,
                start: 0,
                length: 0,
                messageText,
                category: ts.DiagnosticCategory.Error,
                code: err.code,
            };
        });
        return unmatchedDiags.concat(unmatchedErrors);
    }
    exports.filterExpected = filterExpected;
    /**
     * Formats the given diagnostics, without pretty printing.  Without colors, it's
     * better for matching against programmatically.
     * @param target The bazel target, e.g. //my/package:target
     */
    function uglyFormat(target, diagnostics) {
        const diagnosticsHost = {
            getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
            getNewLine: () => ts.sys.newLine,
            // Print filenames including their relativeRoot, so they can be located on
            // disk
            getCanonicalFileName: (f) => f
        };
        return ts.formatDiagnostics(diagnostics, diagnosticsHost);
    }
    exports.uglyFormat = uglyFormat;
    /**
     * Pretty formats the given diagnostics (matching the --pretty tsc flag).
     * @param target The bazel target, e.g. //my/package:target
     */
    function format(target, diagnostics) {
        const diagnosticsHost = {
            getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
            getNewLine: () => ts.sys.newLine,
            // Print filenames including their relativeRoot, so they can be located on
            // disk
            getCanonicalFileName: (f) => f
        };
        return ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost);
    }
    exports.format = format;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9leHRlcm5hbC9idWlsZF9iYXplbF9ydWxlc190eXBlc2NyaXB0L2ludGVybmFsL3RzY193cmFwcGVkL2RpYWdub3N0aWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBSWpDOzs7O09BSUc7SUFDSCxTQUFnQixjQUFjLENBQzFCLFNBQXVCLEVBQUUsV0FBNEIsRUFDckQsUUFBUSxHQUFHLFVBQVU7UUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNO1lBQUUsT0FBTyxXQUFXLENBQUM7UUFFOUQsZ0NBQWdDO1FBQ2hDLGtDQUFrQztRQUNsQyxnREFBZ0Q7UUFDaEQsMkVBQTJFO1FBQzNFLHlCQUF5QjtRQUN6QixNQUFNLFFBQVEsR0FBRywyQ0FBMkMsQ0FBQztRQUM3RCxNQUFNLGVBQWUsR0FDakIsU0FBUyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRTtZQUMxQixNQUFNLEdBQUcsR0FBRyxvQ0FBb0MsUUFBUSxNQUFNO2dCQUMxRCx3QkFBd0IsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzFELE9BQU8sQ0FBQztvQkFDTixJQUFJLEVBQUUsU0FBVTtvQkFDaEIsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLENBQUM7b0JBQ1QsV0FBVyxFQUFFLEdBQUc7b0JBQ2hCLFFBQVEsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSztvQkFDckMsSUFBSSxFQUFFLENBQUM7aUJBQ1IsQ0FBQyxDQUFDO1NBQ0o7UUFjRCxNQUFNLGFBQWEs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V0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFWRCxnQ0FVQztJQUVEOzs7T0FHRztJQUNILFNBQWdCLE1BQU0sQ0FDbEIsTUFBYyxFQUFFLFdBQXlDO1FBQzNELE1BQU0sZUFBZSxHQUE2QjtZQUNoRCxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFO1lBQ3ZELFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU87WUFDaEMsMEVBQTBFO1lBQzFFLE9BQU87WUFDUCxvQkFBb0IsRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUN2QyxDQUFDO1FBQ0YsT0FBTyxFQUFFLENBQUMsb0NBQW9DLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFWRCx3QkFVQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBleHRlbnNpb25zIHRvIFR5cGVTY3JpcHQgZnVuY3Rpb25hbGl0eSBhcm91bmQgZXJyb3IgaGFuZGxpbmdcbiAqICh0cy5EaWFnbm9zdGljcykuXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7QmF6ZWxPcHRpb25zfSBmcm9tICcuL3RzY29uZmlnJztcblxuLyoqXG4gKiBJZiB0aGUgY3VycmVudCBjb21waWxhdGlvbiB3YXMgYSBjb21waWxhdGlvbiB0ZXN0IGV4cGVjdGluZyBjZXJ0YWluXG4gKiBkaWFnbm9zdGljcywgZmlsdGVyIG91dCB0aGUgZXhwZWN0ZWQgZGlhZ25vc3RpY3MsIGFuZCBhZGQgbmV3IGRpYWdub3N0aWNzXG4gKiAoYWthIGVycm9ycykgZm9yIG5vbi1tYXRjaGVkIGRpYWdub3N0aWNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyRXhwZWN0ZWQoXG4gICAgYmF6ZWxPcHRzOiBCYXplbE9wdGlvbnMsIGRpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW10sXG4gICAgZm9ybWF0Rm4gPSB1Z2x5Rm9ybWF0KTogdHMuRGlhZ25vc3RpY1tdIHtcbiAgaWYgKCFiYXplbE9wdHMuZXhwZWN0ZWREaWFnbm9zdGljcy5sZW5ndGgpIHJldHVybiBkaWFnbm9zdGljcztcblxuICAvLyBUaGUgcmVnZXggY29udGFpbnMgdHdvIHBhcnRzOlxuICAvLyAxLiBPcHRpb25hbCBwb3NpdGlvbjogJ1xcKDUsMVxcKSdcbiAgLy8gMi4gUmVxdWlyZWQgVFMgZXJyb3I6ICdUUzIwMDA6IG1lc3NhZ2UgdGV4dC4nXG4gIC8vIE5lZWQgdHJpcGxlIGVzY2FwZXMgYmVjYXVzZSB0aGUgZXhwZWN0ZWQgZGlhZ25vc3RpY3MgdGhhdCB3ZSdyZSBtYXRjaGluZ1xuICAvLyBoZXJlIGFyZSByZWdleGVzLCB0b28uXG4gIGNvbnN0IEVSUk9SX1JFID0gL14oPzpcXFxcXFwoKFxcZCopLChcXGQqKVxcXFxcXCkuKik/VFMoLT9cXGQrKTooLiopLztcbiAgY29uc3QgaW5jb3JyZWN0RXJyb3JzID1cbiAgICAgIGJhemVsT3B0cy5leHBlY3RlZERpYWdub3N0aWNzLmZpbHRlcihlID0+ICFlLm1hdGNoKEVSUk9SX1JFKSk7XG4gIGlmIChpbmNvcnJlY3RFcnJvcnMubGVuZ3RoKSB7XG4gICAgY29uc3QgbXNnID0gYEV4cGVjdGVkIGVycm9ycyBtdXN0IG1hdGNoIHJlZ2V4ICR7RVJST1JfUkV9XFxuXFx0YCArXG4gICAgICAgIGBleHBlY3RlZCBlcnJvcnMgYXJlIFwiJHtpbmNvcnJlY3RFcnJvcnMuam9pbignLCAnKX1cImA7XG4gICAgcmV0dXJuIFt7XG4gICAgICBmaWxlOiB1bmRlZmluZWQhLFxuICAgICAgc3RhcnQ6IDAsXG4gICAgICBsZW5ndGg6IDAsXG4gICAgICBtZXNzYWdlVGV4dDogbXNnLFxuICAgICAgY2F0ZWdvcnk6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgIGNvZGU6IDAsXG4gICAgfV07XG4gIH1cblxuICAvLyBFeHBlY3RlZERpYWdub3N0aWNzIHJlcHJlc2VudHMgdGhlIFwiZXhwZWN0ZWRfZGlhZ25vc3RpY3NcIiB1c2VycyBwcm92aWRlIGluXG4gIC8vIHRoZSBCVUlMRCBmaWxlLiBJdCBpcyB1c2VkIGZvciBlYXNpZXIgY29tcGFyc2lvbiB3aXRoIHRoZSBhY3R1YWxcbiAgLy8gZGlhZ25vc3RpY3MuXG4gIGludGVyZmFjZSBFeHBlY3RlZERpYWdub3N0aWNzIHtcbiAgICBsaW5lOiBudW1iZXI7XG4gICAgY29sdW1uOiBudW1iZXI7XG4gICAgZXhwZWN0ZWQ6IHN0cmluZztcbiAgICBjb2RlOiBudW1iZXI7XG4gICAgcmVnZXhwOiBSZWdFeHA7XG4gICAgbWF0Y2hlZDogYm9vbGVhbjtcbiAgfVxuXG4gIGNvbnN0IGV4cGVjdGVkRGlhZ3M6IEV4cGVjdGVkRGlhZ25vc3RpY3NbXSA9XG4gICAgICBiYXplbE9wdHMuZXhwZWN0ZWREaWFnbm9zdGljcy5tYXAoZXhwZWN0ZWQgPT4ge1xuICAgICAgICBjb25zdCBtID0gZXhwZWN0ZWQubWF0Y2goL14oPzpcXFxcXFwoKFxcZCopLChcXGQqKVxcXFxcXCkuKik/VFMoLT9cXGQrKTooLiopJC8pO1xuICAgICAgICBpZiAoIW0pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdJbmNvcnJlY3QgZXhwZWN0ZWQgZXJyb3IsIGRpZCB5b3UgZm9yZ2V0IGNoYXJhY3RlciBlc2NhcGVzIGluICcgK1xuICAgICAgICAgICAgICBleHBlY3RlZCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgWywgbGluZVN0ciwgY29sdW1uU3RyLCBjb2RlU3RyLCByZWdleHBdID0gbTtcbiAgICAgICAgY29uc3QgW2xpbmUsIGNvbHVtbiwgY29kZV0gPSBbbGluZVN0ciwgY29sdW1uU3RyLCBjb2RlU3RyXS5tYXAoc3RyID0+IHtcbiAgICAgICAgICBjb25zdCBpID0gTnVtYmVyKHN0cik7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihpKSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsaW5lLFxuICAgICAgICAgIGNvbHVtbixcbiAgICAgICAgICBleHBlY3RlZCxcbiAgICAgICAgICBjb2RlLFxuICAgICAgICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChyZWdleHApLFxuICAgICAgICAgIG1hdGNoZWQ6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgY29uc3QgdW5tYXRjaGVkRGlhZ3MgPSBkaWFnbm9zdGljcy5maWx0ZXIoZGlhZyA9PiB7XG4gICAgbGV0IGxpbmUgPSAtMTtcbiAgICBsZXQgY2hhcmFjdGVyID0gLTE7XG4gICAgaWYgKGRpYWcuZmlsZSAmJiBkaWFnLnN0YXJ0KSB7XG4gICAgICAoe2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihkaWFnLmZpbGUsIGRpYWcuc3RhcnQpKTtcbiAgICB9XG4gICAgbGV0IG1hdGNoZWQgPSBmYWxzZTtcbiAgICBjb25zdCBtc2cgPSBmb3JtYXRGbihiYXplbE9wdHMudGFyZ2V0LCBbZGlhZ10pO1xuICAgIC8vIGNoZWNrRGlhZ01hdGNoZXNFeHBlY3RlZCBjaGVja3MgaWYgdGhlIGV4cGVjdGVkIGRpYWdub3N0aWNzIG1hdGNoZXMgdGhlXG4gICAgLy8gYWN0dWFsIGRpYWdub3N0aWNzLlxuICAgIGNvbnN0IGNoZWNrRGlhZ01hdGNoZXNFeHBlY3RlZCA9XG4gICAgICAgIChleHBEaWFnOiBFeHBlY3RlZERpYWdub3N0aWNzLCBkaWFnOiB0cy5EaWFnbm9zdGljKSA9PiB7XG4gICAgICAgICAgaWYgKGV4cERpYWcuY29kZSAhPT0gZGlhZy5jb2RlIHx8IG1zZy5zZWFyY2goZXhwRGlhZy5yZWdleHApID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBsaW5lIGFuZCBjb2x1bW4gYXJlIG9wdGlvbmFsIGZpZWxkcywgb25seSBjaGVjayB0aGVtIGlmIHRoZXlcbiAgICAgICAgICAvLyBhcmUgZXhwbGljaXRseSBzcGVjaWZpZWQuXG4gICAgICAgICAgLy8gbGluZSBhbmQgY2hhcmFjdGVyIGFyZSB6ZXJvIGJhc2VkLlxuICAgICAgICAgIGlmIChleHBEaWFnLmxpbmUgIT09IDAgJiYgZXhwRGlhZy5saW5lICE9PSBsaW5lICsgMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXhwRGlhZy5jb2x1bW4gIT09IDAgJiYgZXhwRGlhZy5jb2x1bW4gIT09IGNoYXJhY3RlciArIDEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IGV4cERpYWcgb2YgZXhwZWN0ZWREaWFncykge1xuICAgICAgaWYgKGNoZWNrRGlhZ01hdGNoZXNFeHBlY3RlZChleHBEaWFnLCBkaWFnKSkge1xuICAgICAgICBleHBEaWFnLm1hdGNoZWQgPSB0cnVlO1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gY29udGludWUsIG9uZSBkaWFnbm9zdGljIG1heSBtYXRjaCBtdWx0aXBsZSBleHBlY3RlZCBlcnJvcnMuXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAhbWF0Y2hlZDtcbiAgfSk7XG5cbiAgY29uc3QgdW5tYXRjaGVkRXJyb3JzID0gZXhwZWN0ZWREaWFncy5maWx0ZXIoZXJyID0+ICFlcnIubWF0Y2hlZCkubWFwKGVyciA9PiB7XG4gICAgY29uc3QgZmlsZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUoXG4gICAgICAgIGJhemVsT3B0cy50YXJnZXQsICcvKiBmYWtlIHNvdXJjZSBhcyBtYXJrZXIgKi8nLFxuICAgICAgICB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0KTtcbiAgICBjb25zdCBtZXNzYWdlVGV4dCA9XG4gICAgICAgIGBFeHBlY3RlZCBhIGNvbXBpbGF0aW9uIGVycm9yIG1hdGNoaW5nICR7SlNPTi5zdHJpbmdpZnkoZXJyLmV4cGVjdGVkKX1gO1xuICAgIHJldHVybiB7XG4gICAgICBmaWxlLFxuICAgICAgc3RhcnQ6IDAsXG4gICAgICBsZW5ndGg6IDAsXG4gICAgICBtZXNzYWdlVGV4dCxcbiAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICBjb2RlOiBlcnIuY29kZSxcbiAgICB9O1xuICB9KTtcblxuICByZXR1cm4gdW5tYXRjaGVkRGlhZ3MuY29uY2F0KHVubWF0Y2hlZEVycm9ycyk7XG59XG5cbi8qKlxuICogRm9ybWF0cyB0aGUgZ2l2ZW4gZGlhZ25vc3RpY3MsIHdpdGhvdXQgcHJldHR5IHByaW50aW5nLiAgV2l0aG91dCBjb2xvcnMsIGl0J3NcbiAqIGJldHRlciBmb3IgbWF0Y2hpbmcgYWdhaW5zdCBwcm9ncmFtbWF0aWNhbGx5LlxuICogQHBhcmFtIHRhcmdldCBUaGUgYmF6ZWwgdGFyZ2V0LCBlLmcuIC8vbXkvcGFja2FnZTp0YXJnZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVnbHlGb3JtYXQoXG4gICAgdGFyZ2V0OiBzdHJpbmcsIGRpYWdub3N0aWNzOiBSZWFkb25seUFycmF5PHRzLkRpYWdub3N0aWM+KTogc3RyaW5nIHtcbiAgY29uc3QgZGlhZ25vc3RpY3NIb3N0OiB0cy5Gb3JtYXREaWFnbm9zdGljc0hvc3QgPSB7XG4gICAgZ2V0Q3VycmVudERpcmVjdG9yeTogKCkgPT4gdHMuc3lzLmdldEN1cnJlbnREaXJlY3RvcnkoKSxcbiAgICBnZXROZXdMaW5lOiAoKSA9PiB0cy5zeXMubmV3TGluZSxcbiAgICAvLyBQcmludCBmaWxlbmFtZXMgaW5jbHVkaW5nIHRoZWlyIHJlbGF0aXZlUm9vdCwgc28gdGhleSBjYW4gYmUgbG9jYXRlZCBvblxuICAgIC8vIGRpc2tcbiAgICBnZXRDYW5vbmljYWxGaWxlTmFtZTogKGY6IHN0cmluZykgPT4gZlxuICB9O1xuICByZXR1cm4gdHMuZm9ybWF0RGlhZ25vc3RpY3MoZGlhZ25vc3RpY3MsIGRpYWdub3N0aWNzSG9zdCk7XG59XG5cbi8qKlxuICogUHJldHR5IGZvcm1hdHMgdGhlIGdpdmVuIGRpYWdub3N0aWNzIChtYXRjaGluZyB0aGUgLS1wcmV0dHkgdHNjIGZsYWcpLlxuICogQHBhcmFtIHRhcmdldCBUaGUgYmF6ZWwgdGFyZ2V0LCBlLmcuIC8vbXkvcGFja2FnZTp0YXJnZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChcbiAgICB0YXJnZXQ6IHN0cmluZywgZGlhZ25vc3RpY3M6IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz4pOiBzdHJpbmcge1xuICBjb25zdCBkaWFnbm9zdGljc0hvc3Q6IHRzLkZvcm1hdERpYWdub3N0aWNzSG9zdCA9IHtcbiAgICBnZXRDdXJyZW50RGlyZWN0b3J5OiAoKSA9PiB0cy5zeXMuZ2V0Q3VycmVudERpcmVjdG9yeSgpLFxuICAgIGdldE5ld0xpbmU6ICgpID0+IHRzLnN5cy5uZXdMaW5lLFxuICAgIC8vIFByaW50IGZpbGVuYW1lcyBpbmNsdWRpbmcgdGhlaXIgcmVsYXRpdmVSb290LCBzbyB0aGV5IGNhbiBiZSBsb2NhdGVkIG9uXG4gICAgLy8gZGlza1xuICAgIGdldENhbm9uaWNhbEZpbGVOYW1lOiAoZjogc3RyaW5nKSA9PiBmXG4gIH07XG4gIHJldHVybiB0cy5mb3JtYXREaWFnbm9zdGljc1dpdGhDb2xvckFuZENvbnRleHQoZGlhZ25vc3RpY3MsIGRpYWdub3N0aWNzSG9zdCk7XG59XG4iXX0=