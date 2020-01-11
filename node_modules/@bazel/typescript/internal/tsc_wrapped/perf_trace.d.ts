/**
 * @license
 * Copyright 2017 The Bazel Authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** wrap wraps enter()/leave() calls around a block of code. */
export declare function wrap<T>(name: string, f: () => T): T;
/**
 * counter records a snapshot of counts.  The counter name identifies a
 * single graph, while the counts object provides data for each count
 * of a line on the stacked bar graph.
 */
export declare function counter(name: string, counts: {
    [name: string]: number;
}): void;
/** write writes the trace in Chrome Trace format to a given path. */
export declare function write(path: string): void;
/** Record the current heap usage to the performance trace. */
export declare function snapshotMemoryUsage(): void;
