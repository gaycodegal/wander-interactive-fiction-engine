var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "protobufjs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const protobufjs = require("protobufjs");
    // Equivalent of running node with --expose-gc
    // but easier to write tooling since we don't need to inject that arg to
    // nodejs_binary
    if (typeof global.gc !== 'function') {
        // tslint:disable-next-line:no-require-imports
        require('v8').setFlagsFromString('--expose_gc');
        // tslint:disable-next-line:no-require-imports
        global.gc = require('vm').runInNewContext('gc');
    }
    /**
     * Whether to print debug messages (to console.error) from the debug function
     * below.
     */
    exports.DEBUG = false;
    /** Maybe print a debug message (depending on a flag defaulting to false). */
    function debug(...args) {
        if (exports.DEBUG)
            console.error.apply(console, args);
    }
    exports.debug = debug;
    /**
     * Write a message to stderr, which appears in the bazel log and is visible to
     * the end user.
     */
    function log(...args) {
        console.error.apply(console, args);
    }
    exports.log = log;
    /**
     * runAsWorker returns true if the given arguments indicate the process should
     * run as a persistent worker.
     */
    function runAsWorker(args) {
        return args.indexOf('--persistent_worker') !== -1;
    }
    exports.runAsWorker = runAsWorker;
    /**
     * loadWorkerPb finds and loads the protocol buffer definition for bazel's
     * worker protocol using protobufjs. In protobufjs, this means it's a reflection
     * object that also contains properties for the individual messages.
     */
    function loadWorkerPb() {
        const protoPath = '../../third_party/github.com/bazelbuild/bazel/src/main/protobuf/worker_protocol.proto';
        // Use node module resolution so we can find the .proto file in any of the
        // root dirs
        let protofile;
        try {
            // Look for the .proto file relative in its @bazel/typescript npm package
            // location
            protofile = require.resolve(protoPath);
        }
        catch (e) {
        }
        if (!protofile) {
            // If not found above, look for the .proto file in its rules_typescript
            // workspace location
            // This extra lookup should never happen in google3. It's only needed for
            // local development in the rules_typescript repo.
            protofile = require.resolve('build_bazel_rules_typescript/third_party/github.com/bazelbuild/bazel/src/main/protobuf/worker_protocol.proto');
        }
        const protoNamespace = protobufjs.loadSync(protofile);
        if (!protoNamespace) {
            throw new Error('Cannot find ' + path.resolve(protoPath));
        }
        const workerpb = protoNamespace.lookup('blaze.worker');
        if (!workerpb) {
            throw new Error(`Cannot find namespace blaze.worker`);
        }
        return workerpb;
    }
    /**
     * workerpb contains the runtime representation of the worker protocol buffer,
     * including accessor for the defined messages.
     */
    const workerpb = loadWorkerPb();
    /**
     * runWorkerLoop handles the interacton between bazel workers and the
     * TypeScript compiler. It reads compilation requests from stdin, unmarshals the
     * data, and dispatches into `runOneBuild` for the actual compilation to happen.
     *
     * The compilation handler is parameterized so that this code can be used by
     * different compiler entry points (currently TypeScript compilation, Angular
     * compilation, and the contrib vulcanize worker).
     *
     * It's also exposed publicly as an npm package:
     *   https://www.npmjs.com/package/@bazel/worker
     */
    function runWorkerLoop(runOneBuild) {
        return __awaiter(this, void 0, void 0, function* () {
            var e_1, _a;
            // Hook all output to stderr and write it to a buffer, then include
            // that buffer's in the worker protcol proto's textual output.  This
            // means you can log via console.error() and it will appear to the
            // user as expected.
            let consoleOutput = '';
            process.stderr.write =
                (chunk, ...otherArgs) => {
                    consoleOutput += chunk.toString();
                    return true;
                };
            // Accumulator for asynchronously read input.
            // protobufjs uses node's Buffer, but has its own reader abstraction on top of
            // it (for browser compatiblity). It ignores Buffer's builtin start and
            // offset, which means the handling code below cannot use Buffer in a
            // meaningful way (such as cycling data through it). The handler below reads
            // any data available on stdin, concatenating it into this buffer. It then
            // attempts to read a delimited Message from it. If a message is incomplete,
            // it exits and waits for more input. If a message has been read, it strips
            // its data of this buffer.
            let buf = Buffer.alloc(0);
            try {
                stdinLoop: for (var _b = __asyncValues(process.stdin), _c; _c = yield _b.next(), !_c.done;) {
                    const chunk = _c.value;
                    buf = Buffer.concat([buf, chunk]);
                    try {
                        const reader = new protobufjs.Reader(buf);
                        // Read all requests that have accumulated in the buffer.
                        while (reader.len - reader.pos > 0) {
                            const messageStart = reader.len;
                            const msgLength = reader.uint32();
                            // chunk might be an incomplete read from stdin. If there are not enough
                            // bytes for the next full message, wait for more input.
                            if ((reader.len - reader.pos) < msgLength)
                                continue stdinLoop;
                            const req = workerpb.WorkRequest.decode(reader, msgLength);
                            // Once a message has been read, remove it from buf so that if we pause
                            // to read more input, this message will not be processed again.
                            buf = buf.slice(messageStart);
                            debug('=== Handling new build request');
                            // Reset accumulated log output.
                            consoleOutput = '';
                            const args = req.arguments;
                            const inputs = {};
                            for (const input of req.inputs) {
                                inputs[input.path] = input.digest.toString('hex');
                            }
                            debug('Compiling with:\n\t' + args.join('\n\t'));
                            const exitCode = (yield runOneBuild(args, inputs)) ? 0 : 1;
                            process.stdout.write((workerpb.WorkResponse.encodeDelimited({
                                exitCode,
                                output: consoleOutput,
                            })).finish());
                            // Force a garbage collection pass.  This keeps our memory usage
                            // consistent across multiple compilations, and allows the file
                            // cache to use the current memory usage as a guideline for expiring
                            // data.  Note: this is intentionally not within runOneBuild(), as
                            // we want to gc only after all its locals have gone out of scope.
                            global.gc();
                        }
                        // All messages have been handled, make sure the invariant holds and
                        // Buffer is empty once all messages have been read.
                        if (buf.length > 0) {
                            throw new Error('buffer not empty after reading all messages');
                        }
                    }
                    catch (e) {
                        log('Compilation failed', e.stack);
                        process.stdout.write(workerpb.WorkResponse
                            .encodeDelimited({ exitCode: 1, output: consoleOutput })
                            .finish());
                        // Clear buffer so the next build won't read an incomplete request.
                        buf = Buffer.alloc(0);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    exports.runWorkerLoop = runWorkerLoop;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vZXh0ZXJuYWwvYnVpbGRfYmF6ZWxfcnVsZXNfdHlwZXNjcmlwdC9pbnRlcm5hbC90c2Nfd3JhcHBlZC93b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFBQSw2QkFBNkI7SUFDN0IseUNBQXlDO0lBRXpDLDhDQUE4QztJQUM5Qyx3RUFBd0U7SUFDeEUsZ0JBQWdCO0lBQ2hCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxLQUFLLFVBQVUsRUFBRTtRQUNuQyw4Q0FBOEM7UUFDOUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2hELDhDQUE4QztRQUM5QyxNQUFNLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDakQ7SUFFRDs7O09BR0c7SUFDVSxRQUFBLEtBQUssR0FBRyxLQUFLLENBQUM7SUFFM0IsNkVBQTZFO0lBQzdFLFNBQWdCLEtBQUssQ0FBQyxHQUFHLElBQW9CO1FBQzNDLElBQUksYUFBSztZQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRkQsc0JBRUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixHQUFHLENBQUMsR0FBRyxJQUFvQjtRQUN6QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUZELGtCQUVDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0IsV0FBVyxDQUFDLElBQWM7UUFDeEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FB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QUE2QyxDQUFDLENBQUM7eUJBQ2hFO3FCQUNGO29CQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNWLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ25DLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNoQixRQUFRLENBQUMsWUFBWTs2QkFDaEIsZUFBZSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFDLENBQUM7NkJBQ3JELE1BQU0sRUFBWSxDQUFDLENBQUM7d0JBQzdCLG1FQUFtRTt3QkFDbkUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ3ZCO2lCQUNGOzs7Ozs7Ozs7UUFDSCxDQUFDO0tBQUE7SUE3RUQsc0NBNkVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHByb3RvYnVmanMgZnJvbSAncHJvdG9idWZqcyc7XG5cbi8vIEVxdWl2YWxlbnQgb2YgcnVubmluZyBub2RlIHdpdGggLS1leHBvc2UtZ2Ncbi8vIGJ1dCBlYXNpZXIgdG8gd3JpdGUgdG9vbGluZyBzaW5jZSB3ZSBkb24ndCBuZWVkIHRvIGluamVjdCB0aGF0IGFyZyB0b1xuLy8gbm9kZWpzX2JpbmFyeVxuaWYgKHR5cGVvZiBnbG9iYWwuZ2MgIT09ICdmdW5jdGlvbicpIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXJlcXVpcmUtaW1wb3J0c1xuICByZXF1aXJlKCd2OCcpLnNldEZsYWdzRnJvbVN0cmluZygnLS1leHBvc2VfZ2MnKTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXJlcXVpcmUtaW1wb3J0c1xuICBnbG9iYWwuZ2MgPSByZXF1aXJlKCd2bScpLnJ1bkluTmV3Q29udGV4dCgnZ2MnKTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIHRvIHByaW50IGRlYnVnIG1lc3NhZ2VzICh0byBjb25zb2xlLmVycm9yKSBmcm9tIHRoZSBkZWJ1ZyBmdW5jdGlvblxuICogYmVsb3cuXG4gKi9cbmV4cG9ydCBjb25zdCBERUJVRyA9IGZhbHNlO1xuXG4vKiogTWF5YmUgcHJpbnQgYSBkZWJ1ZyBtZXNzYWdlIChkZXBlbmRpbmcgb24gYSBmbGFnIGRlZmF1bHRpbmcgdG8gZmFsc2UpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnKC4uLmFyZ3M6IEFycmF5PHVua25vd24+KSB7XG4gIGlmIChERUJVRykgY29uc29sZS5lcnJvci5hcHBseShjb25zb2xlLCBhcmdzKTtcbn1cblxuLyoqXG4gKiBXcml0ZSBhIG1lc3NhZ2UgdG8gc3RkZXJyLCB3aGljaCBhcHBlYXJzIGluIHRoZSBiYXplbCBsb2cgYW5kIGlzIHZpc2libGUgdG9cbiAqIHRoZSBlbmQgdXNlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvZyguLi5hcmdzOiBBcnJheTx1bmtub3duPikge1xuICBjb25zb2xlLmVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xufVxuXG4vKipcbiAqIHJ1bkFzV29ya2VyIHJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJndW1lbnRzIGluZGljYXRlIHRoZSBwcm9jZXNzIHNob3VsZFxuICogcnVuIGFzIGEgcGVyc2lzdGVudCB3b3JrZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBydW5Bc1dvcmtlcihhcmdzOiBzdHJpbmdbXSkge1xuICByZXR1cm4gYXJncy5pbmRleE9mKCctLXBlcnNpc3RlbnRfd29ya2VyJykgIT09IC0xO1xufVxuXG4vKipcbiAqIHdvcmtlclByb3RvIGRlY2xhcmVzIHRoZSBzdGF0aWMgdHlwZSBvZiB0aGUgb2JqZWN0IGNvbnN0cnVjdGVkIGF0IHJ1bnRpbWUgYnlcbiAqIHByb3RvYnVmanMsIGJhc2VkIG9uIHJlYWRpbmcgdGhlIHByb3RvY29sIGJ1ZmZlciBkZWZpbml0aW9uLlxuICovXG5kZWNsYXJlIG5hbWVzcGFjZSB3b3JrZXJQcm90byB7XG4gIC8qKiBJbnB1dCByZXByZXNlbnRzIHRoZSBibGF6ZS53b3JrZXIuSW5wdXQgbWVzc2FnZS4gKi9cbiAgaW50ZXJmYWNlIElucHV0IGV4dGVuZHMgcHJvdG9idWZqcy5NZXNzYWdlPElucHV0PiB7XG4gICAgcGF0aDogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIEluIE5vZGUsIGRpZ2VzdCBpcyBhIEJ1ZmZlci4gSW4gdGhlIGJyb3dzZXIsIGl0J3MgYSByZXBsYWNlbWVudFxuICAgICAqIGltcGxlbWVudGF0aW9uLiBXZSBvbmx5IGNhcmUgYWJvdXQgaXRzIHRvU3RyaW5nKGVuY29kaW5nKSBtZXRob2QuXG4gICAgICovXG4gICAgZGlnZXN0OiB7dG9TdHJpbmcoZW5jb2Rpbmc6IHN0cmluZyk6IHN0cmluZ307XG4gIH1cblxuICAvKiogV29ya1JlcXVlc3QgcmVwZXNlbnRzIHRoZSBibGF6ZS53b3JrZXIuV29ya1JlcXVlc3QgbWVzc2FnZS4gKi9cbiAgaW50ZXJmYWNlIFdvcmtSZXF1ZXN0IGV4dGVuZHMgcHJvdG9idWZqcy5NZXNzYWdlPFdvcmtSZXF1ZXN0PiB7XG4gICAgYXJndW1lbnRzOiBzdHJpbmdbXTtcbiAgICBpbnB1dHM6IElucHV0W107XG4gIH1cblxuICAvLyB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lIHJlZmxlY3RlZCwgY29uc3RydWN0YWJsZSB0eXBlcy5cbiAgY29uc3QgV29ya1JlcXVlc3Q6IHByb3RvYnVmanMuVHlwZTtcbiAgY29uc3QgV29ya1Jlc3BvbnNlOiBwcm90b2J1ZmpzLlR5cGU7XG4gIC8vIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZVxufVxuXG4vKipcbiAqIGxvYWRXb3JrZXJQYiBmaW5kcyBhbmQgbG9hZHMgdGhlIHByb3RvY29sIGJ1ZmZlciBkZWZpbml0aW9uIGZvciBiYXplbCdzXG4gKiB3b3JrZXIgcHJvdG9jb2wgdXNpbmcgcHJvdG9idWZqcy4gSW4gcHJvdG9idWZqcywgdGhpcyBtZWFucyBpdCdzIGEgcmVmbGVjdGlvblxuICogb2JqZWN0IHRoYXQgYWxzbyBjb250YWlucyBwcm9wZXJ0aWVzIGZvciB0aGUgaW5kaXZpZHVhbCBtZXNzYWdlcy5cbiAqL1xuZnVuY3Rpb24gbG9hZFdvcmtlclBiKCkge1xuICBjb25zdCBwcm90b1BhdGggPVxuICAgICAgJy4uLy4uL3RoaXJkX3BhcnR5L2dpdGh1Yi5jb20vYmF6ZWxidWlsZC9iYXplbC9zcmMvbWFpbi9wcm90b2J1Zi93b3JrZXJfcHJvdG9jb2wucHJvdG8nO1xuXG4gIC8vIFVzZSBub2RlIG1vZHVsZSByZXNvbHV0aW9uIHNvIHdlIGNhbiBmaW5kIHRoZSAucHJvdG8gZmlsZSBpbiBhbnkgb2YgdGhlXG4gIC8vIHJvb3QgZGlyc1xuICBsZXQgcHJvdG9maWxlO1xuICB0cnkge1xuICAgIC8vIExvb2sgZm9yIHRoZSAucHJvdG8gZmlsZSByZWxhdGl2ZSBpbiBpdHMgQGJhemVsL3R5cGVzY3JpcHQgbnBtIHBhY2thZ2VcbiAgICAvLyBsb2NhdGlvblxuICAgIHByb3RvZmlsZSA9IHJlcXVpcmUucmVzb2x2ZShwcm90b1BhdGgpO1xuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgaWYgKCFwcm90b2ZpbGUpIHtcbiAgICAvLyBJZiBub3QgZm91bmQgYWJvdmUsIGxvb2sgZm9yIHRoZSAucHJvdG8gZmlsZSBpbiBpdHMgcnVsZXNfdHlwZXNjcmlwdFxuICAgIC8vIHdvcmtzcGFjZSBsb2NhdGlvblxuICAgIC8vIFRoaXMgZXh0cmEgbG9va3VwIHNob3VsZCBuZXZlciBoYXBwZW4gaW4gZ29vZ2xlMy4gSXQncyBvbmx5IG5lZWRlZCBmb3JcbiAgICAvLyBsb2NhbCBkZXZlbG9wbWVudCBpbiB0aGUgcnVsZXNfdHlwZXNjcmlwdCByZXBvLlxuICAgIHByb3RvZmlsZSA9IHJlcXVpcmUucmVzb2x2ZShcbiAgICAgICAgJ2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9iYXplbGJ1aWxkL2JhemVsL3NyYy9tYWluL3Byb3RvYnVmL3dvcmtlcl9wcm90b2NvbC5wcm90bycpO1xuICB9XG5cbiAgY29uc3QgcHJvdG9OYW1lc3BhY2UgPSBwcm90b2J1ZmpzLmxvYWRTeW5jKHByb3RvZmlsZSk7XG4gIGlmICghcHJvdG9OYW1lc3BhY2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBmaW5kICcgKyBwYXRoLnJlc29sdmUocHJvdG9QYXRoKSk7XG4gIH1cbiAgY29uc3Qgd29ya2VycGIgPSBwcm90b05hbWVzcGFjZS5sb29rdXAoJ2JsYXplLndvcmtlcicpO1xuICBpZiAoIXdvcmtlcnBiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBuYW1lc3BhY2UgYmxhemUud29ya2VyYCk7XG4gIH1cbiAgcmV0dXJuIHdvcmtlcnBiIGFzIHByb3RvYnVmanMuUmVmbGVjdGlvbk9iamVjdCAmIHR5cGVvZiB3b3JrZXJQcm90bztcbn1cblxuLyoqXG4gKiB3b3JrZXJwYiBjb250YWlucyB0aGUgcnVudGltZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgd29ya2VyIHByb3RvY29sIGJ1ZmZlcixcbiAqIGluY2x1ZGluZyBhY2Nlc3NvciBmb3IgdGhlIGRlZmluZWQgbWVzc2FnZXMuXG4gKi9cbmNvbnN0IHdvcmtlcnBiID0gbG9hZFdvcmtlclBiKCk7XG5cbi8qKlxuICogcnVuV29ya2VyTG9vcCBoYW5kbGVzIHRoZSBpbnRlcmFjdG9uIGJldHdlZW4gYmF6ZWwgd29ya2VycyBhbmQgdGhlXG4gKiBUeXBlU2NyaXB0IGNvbXBpbGVyLiBJdCByZWFkcyBjb21waWxhdGlvbiByZXF1ZXN0cyBmcm9tIHN0ZGluLCB1bm1hcnNoYWxzIHRoZVxuICogZGF0YSwgYW5kIGRpc3BhdGNoZXMgaW50byBgcnVuT25lQnVpbGRgIGZvciB0aGUgYWN0dWFsIGNvbXBpbGF0aW9uIHRvIGhhcHBlbi5cbiAqXG4gKiBUaGUgY29tcGlsYXRpb24gaGFuZGxlciBpcyBwYXJhbWV0ZXJpemVkIHNvIHRoYXQgdGhpcyBjb2RlIGNhbiBiZSB1c2VkIGJ5XG4gKiBkaWZmZXJlbnQgY29tcGlsZXIgZW50cnkgcG9pbnRzIChjdXJyZW50bHkgVHlwZVNjcmlwdCBjb21waWxhdGlvbiwgQW5ndWxhclxuICogY29tcGlsYXRpb24sIGFuZCB0aGUgY29udHJpYiB2dWxjYW5pemUgd29ya2VyKS5cbiAqXG4gKiBJdCdzIGFsc28gZXhwb3NlZCBwdWJsaWNseSBhcyBhbiBucG0gcGFja2FnZTpcbiAqICAgaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvQGJhemVsL3dvcmtlclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuV29ya2VyTG9vcChcbiAgICBydW5PbmVCdWlsZDogKGFyZ3M6IHN0cmluZ1tdLCBpbnB1dHM/OiB7W3BhdGg6IHN0cmluZ106IHN0cmluZ30pID0+XG4gICAgICAgIGJvb2xlYW4gfCBQcm9taXNlPGJvb2xlYW4+KSB7XG4gIC8vIEhvb2sgYWxsIG91dHB1dCB0byBzdGRlcnIgYW5kIHdyaXRlIGl0IHRvIGEgYnVmZmVyLCB0aGVuIGluY2x1ZGVcbiAgLy8gdGhhdCBidWZmZXIncyBpbiB0aGUgd29ya2VyIHByb3Rjb2wgcHJvdG8ncyB0ZXh0dWFsIG91dHB1dC4gIFRoaXNcbiAgLy8gbWVhbnMgeW91IGNhbiBsb2cgdmlhIGNvbnNvbGUuZXJyb3IoKSBhbmQgaXQgd2lsbCBhcHBlYXIgdG8gdGhlXG4gIC8vIHVzZXIgYXMgZXhwZWN0ZWQuXG4gIGxldCBjb25zb2xlT3V0cHV0ID0gJyc7XG4gIHByb2Nlc3Muc3RkZXJyLndyaXRlID1cbiAgICAgIChjaHVuazogc3RyaW5nfEJ1ZmZlciwgLi4ub3RoZXJBcmdzOiBBcnJheTx1bmtub3duPik6IGJvb2xlYW4gPT4ge1xuICAgICAgICBjb25zb2xlT3V0cHV0ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAvLyBBY2N1bXVsYXRvciBmb3IgYXN5bmNocm9ub3VzbHkgcmVhZCBpbnB1dC5cbiAgLy8gcHJvdG9idWZqcyB1c2VzIG5vZGUncyBCdWZmZXIsIGJ1dCBoYXMgaXRzIG93biByZWFkZXIgYWJzdHJhY3Rpb24gb24gdG9wIG9mXG4gIC8vIGl0IChmb3IgYnJvd3NlciBjb21wYXRpYmxpdHkpLiBJdCBpZ25vcmVzIEJ1ZmZlcidzIGJ1aWx0aW4gc3RhcnQgYW5kXG4gIC8vIG9mZnNldCwgd2hpY2ggbWVhbnMgdGhlIGhhbmRsaW5nIGNvZGUgYmVsb3cgY2Fubm90IHVzZSBCdWZmZXIgaW4gYVxuICAvLyBtZWFuaW5nZnVsIHdheSAoc3VjaCBhcyBjeWNsaW5nIGRhdGEgdGhyb3VnaCBpdCkuIFRoZSBoYW5kbGVyIGJlbG93IHJlYWRzXG4gIC8vIGFueSBkYXRhIGF2YWlsYWJsZSBvbiBzdGRpbiwgY29uY2F0ZW5hdGluZyBpdCBpbnRvIHRoaXMgYnVmZmVyLiBJdCB0aGVuXG4gIC8vIGF0dGVtcHRzIHRvIHJlYWQgYSBkZWxpbWl0ZWQgTWVzc2FnZSBmcm9tIGl0LiBJZiBhIG1lc3NhZ2UgaXMgaW5jb21wbGV0ZSxcbiAgLy8gaXQgZXhpdHMgYW5kIHdhaXRzIGZvciBtb3JlIGlucHV0LiBJZiBhIG1lc3NhZ2UgaGFzIGJlZW4gcmVhZCwgaXQgc3RyaXBzXG4gIC8vIGl0cyBkYXRhIG9mIHRoaXMgYnVmZmVyLlxuICBsZXQgYnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMCk7XG4gIHN0ZGluTG9vcDogZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBwcm9jZXNzLnN0ZGluKSB7XG4gICAgYnVmID0gQnVmZmVyLmNvbmNhdChbYnVmLCBjaHVuayBhcyBCdWZmZXJdKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVhZGVyID0gbmV3IHByb3RvYnVmanMuUmVhZGVyKGJ1Zik7XG4gICAgICAvLyBSZWFkIGFsbCByZXF1ZXN0cyB0aGF0IGhhdmUgYWNjdW11bGF0ZWQgaW4gdGhlIGJ1ZmZlci5cbiAgICAgIHdoaWxlIChyZWFkZXIubGVuIC0gcmVhZGVyLnBvcyA+IDApIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZVN0YXJ0ID0gcmVhZGVyLmxlbjtcbiAgICAgICAgY29uc3QgbXNnTGVuZ3RoOiBudW1iZXIgPSByZWFkZXIudWludDMyKCk7XG4gICAgICAgIC8vIGNodW5rIG1pZ2h0IGJlIGFuIGluY29tcGxldGUgcmVhZCBmcm9tIHN0ZGluLiBJZiB0aGVyZSBhcmUgbm90IGVub3VnaFxuICAgICAgICAvLyBieXRlcyBmb3IgdGhlIG5leHQgZnVsbCBtZXNzYWdlLCB3YWl0IGZvciBtb3JlIGlucHV0LlxuICAgICAgICBpZiAoKHJlYWRlci5sZW4gLSByZWFkZXIucG9zKSA8IG1zZ0xlbmd0aCkgY29udGludWUgc3RkaW5Mb29wO1xuXG4gICAgICAgIGNvbnN0IHJlcSA9IHdvcmtlcnBiLldvcmtSZXF1ZXN0LmRlY29kZShyZWFkZXIsIG1zZ0xlbmd0aCkgYXNcbiAgICAgICAgICAgIHdvcmtlclByb3RvLldvcmtSZXF1ZXN0O1xuICAgICAgICAvLyBPbmNlIGEgbWVzc2FnZSBoYXMgYmVlbiByZWFkLCByZW1vdmUgaXQgZnJvbSBidWYgc28gdGhhdCBpZiB3ZSBwYXVzZVxuICAgICAgICAvLyB0byByZWFkIG1vcmUgaW5wdXQsIHRoaXMgbWVzc2FnZSB3aWxsIG5vdCBiZSBwcm9jZXNzZWQgYWdhaW4uXG4gICAgICAgIGJ1ZiA9IGJ1Zi5zbGljZShtZXNzYWdlU3RhcnQpO1xuICAgICAgICBkZWJ1ZygnPT09IEhhbmRsaW5nIG5ldyBidWlsZCByZXF1ZXN0Jyk7XG4gICAgICAgIC8vIFJlc2V0IGFjY3VtdWxhdGVkIGxvZyBvdXRwdXQuXG4gICAgICAgIGNvbnNvbGVPdXRwdXQgPSAnJztcbiAgICAgICAgY29uc3QgYXJncyA9IHJlcS5hcmd1bWVudHM7XG4gICAgICAgIGNvbnN0IGlucHV0czoge1twYXRoOiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgaW5wdXQgb2YgcmVxLmlucHV0cykge1xuICAgICAgICAgIGlucHV0c1tpbnB1dC5wYXRoXSA9IGlucHV0LmRpZ2VzdC50b1N0cmluZygnaGV4Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcoJ0NvbXBpbGluZyB3aXRoOlxcblxcdCcgKyBhcmdzLmpvaW4oJ1xcblxcdCcpKTtcbiAgICAgICAgY29uc3QgZXhpdENvZGUgPSAoYXdhaXQgcnVuT25lQnVpbGQoYXJncywgaW5wdXRzKSkgPyAwIDogMTtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoKHdvcmtlcnBiLldvcmtSZXNwb25zZS5lbmNvZGVEZWxpbWl0ZWQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRDb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogY29uc29sZU91dHB1dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpLmZpbmlzaCgpIGFzIEJ1ZmZlcik7XG4gICAgICAgIC8vIEZvcmNlIGEgZ2FyYmFnZSBjb2xsZWN0aW9uIHBhc3MuICBUaGlzIGtlZXBzIG91ciBtZW1vcnkgdXNhZ2VcbiAgICAgICAgLy8gY29uc2lzdGVudCBhY3Jvc3MgbXVsdGlwbGUgY29tcGlsYXRpb25zLCBhbmQgYWxsb3dzIHRoZSBmaWxlXG4gICAgICAgIC8vIGNhY2hlIHRvIHVzZSB0aGUgY3VycmVudCBtZW1vcnkgdXNhZ2UgYXMgYSBndWlkZWxpbmUgZm9yIGV4cGlyaW5nXG4gICAgICAgIC8vIGRhdGEuICBOb3RlOiB0aGlzIGlzIGludGVudGlvbmFsbHkgbm90IHdpdGhpbiBydW5PbmVCdWlsZCgpLCBhc1xuICAgICAgICAvLyB3ZSB3YW50IHRvIGdjIG9ubHkgYWZ0ZXIgYWxsIGl0cyBsb2NhbHMgaGF2ZSBnb25lIG91dCBvZiBzY29wZS5cbiAgICAgICAgZ2xvYmFsLmdjKCk7XG4gICAgICB9XG4gICAgICAvLyBBbGwgbWVzc2FnZXMgaGF2ZSBiZWVuIGhhbmRsZWQsIG1ha2Ugc3VyZSB0aGUgaW52YXJpYW50IGhvbGRzIGFuZFxuICAgICAgLy8gQnVmZmVyIGlzIGVtcHR5IG9uY2UgYWxsIG1lc3NhZ2VzIGhhdmUgYmVlbiByZWFkLlxuICAgICAgaWYgKGJ1Zi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignYnVmZmVyIG5vdCBlbXB0eSBhZnRlciByZWFkaW5nIGFsbCBtZXNzYWdlcycpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZygnQ29tcGlsYXRpb24gZmFpbGVkJywgZS5zdGFjayk7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShcbiAgICAgICAgICB3b3JrZXJwYi5Xb3JrUmVzcG9uc2VcbiAgICAgICAgICAgICAgLmVuY29kZURlbGltaXRlZCh7ZXhpdENvZGU6IDEsIG91dHB1dDogY29uc29sZU91dHB1dH0pXG4gICAgICAgICAgICAgIC5maW5pc2goKSBhcyBCdWZmZXIpO1xuICAgICAgLy8gQ2xlYXIgYnVmZmVyIHNvIHRoZSBuZXh0IGJ1aWxkIHdvbid0IHJlYWQgYW4gaW5jb21wbGV0ZSByZXF1ZXN0LlxuICAgICAgYnVmID0gQnVmZmVyLmFsbG9jKDApO1xuICAgIH1cbiAgfVxufVxuIl19