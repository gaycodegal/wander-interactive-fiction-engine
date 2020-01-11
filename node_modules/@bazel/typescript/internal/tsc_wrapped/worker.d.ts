/**
 * Whether to print debug messages (to console.error) from the debug function
 * below.
 */
export declare const DEBUG = false;
/** Maybe print a debug message (depending on a flag defaulting to false). */
export declare function debug(...args: Array<unknown>): void;
/**
 * Write a message to stderr, which appears in the bazel log and is visible to
 * the end user.
 */
export declare function log(...args: Array<unknown>): void;
/**
 * runAsWorker returns true if the given arguments indicate the process should
 * run as a persistent worker.
 */
export declare function runAsWorker(args: string[]): boolean;
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
export declare function runWorkerLoop(runOneBuild: (args: string[], inputs?: {
    [path: string]: string;
}) => boolean | Promise<boolean>): Promise<void>;
