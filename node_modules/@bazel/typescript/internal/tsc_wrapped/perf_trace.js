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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * perf_trace records traces in the Chrome Trace format (which is actually used
     * for more than just Chrome).  See:
     * https://github.com/catapult-project/catapult/blob/master/tracing/README.md
     */
    const fs = require("fs");
    /** @return a high-res timestamp of the current time. */
    function now() {
        const [sec, nsec] = process.hrtime();
        return (sec * 1e6) + (nsec / 1e3);
    }
    const events = [];
    /** wrap wraps enter()/leave() calls around a block of code. */
    function wrap(name, f) {
        const start = now();
        try {
            return f();
        }
        finally {
            const end = now();
            events.push({ name, ph: 'X', pid: 1, ts: start, dur: (end - start) });
        }
    }
    exports.wrap = wrap;
    /**
     * counter records a snapshot of counts.  The counter name identifies a
     * single graph, while the counts object provides data for each count
     * of a line on the stacked bar graph.
     */
    function counter(name, counts) {
        events.push({ name, ph: 'C', pid: 1, ts: now(), args: counts });
    }
    exports.counter = counter;
    /** write writes the trace in Chrome Trace format to a given path. */
    function write(path) {
        fs.writeFileSync(path, JSON.stringify(events), { encoding: 'utf8' });
    }
    exports.write = write;
    /** Record the current heap usage to the performance trace. */
    function snapshotMemoryUsage() {
        const snapshot = process.memoryUsage();
        // The counter displays as a stacked bar graph, so compute metrics
        // that sum to the appropriate total.
        const unused = snapshot.heapTotal - snapshot.heapUsed;
        counter('memory', { 'used': snapshot.heapUsed, 'unused': unused });
    }
    exports.snapshotMemoryUsage = snapshotMemoryUsage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZl90cmFjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2V4dGVybmFsL2J1aWxkX2JhemVsX3J1bGVzX3R5cGVzY3JpcHQvaW50ZXJuYWwvdHNjX3dyYXBwZWQvcGVyZl90cmFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7Ozs7Ozs7Ozs7OztJQUVIOzs7O09BSUc7SUFFSCx5QkFBeUI7SUFJekIsd0RBQXdEO0lBQ3hELFNBQVMsR0FBRztRQUNWLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQWdCRCxNQUFNLE1BQU0sR0FBWSxFQUFFLENBQUM7SUFFM0IsK0RBQStEO0lBQy9ELFNBQWdCLElBQUksQ0FBSSxJQUFZLEVBQUUsQ0FBVTtRQUM5QyxNQUFNLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJO1lBQ0YsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUNaO2dCQUFTO1lBQ1IsTUFBTSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDO1NBQ3JFO0lBQ0gsQ0FBQztJQVJELG9CQVFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFZLEVBQUUsTUFBZ0M7UUFDcEUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFGRCwwQkFFQztJQUVELHFFQUFxRTtJQUNyRSxTQUFnQixLQUFLLENBQUMsSUFBWTtRQUNoQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUZELHNCQUVDO0lBRUQsOERBQThEO0lBQzlELFNBQWdCLG1CQUFtQjtRQUNqQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdkMsa0VBQWtFO1FBQ2xFLHFDQUFxQztRQUNyQyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdEQsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFORCxrREFNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IFRoZSBCYXplbCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIHBlcmZfdHJhY2UgcmVjb3JkcyB0cmFjZXMgaW4gdGhlIENocm9tZSBUcmFjZSBmb3JtYXQgKHdoaWNoIGlzIGFjdHVhbGx5IHVzZWRcbiAqIGZvciBtb3JlIHRoYW4ganVzdCBDaHJvbWUpLiAgU2VlOlxuICogaHR0cHM6Ly9naXRodWIuY29tL2NhdGFwdWx0LXByb2plY3QvY2F0YXB1bHQvYmxvYi9tYXN0ZXIvdHJhY2luZy9SRUFETUUubWRcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbnR5cGUgTWljcm9zZWNvbmRzID0gbnVtYmVyO1xuXG4vKiogQHJldHVybiBhIGhpZ2gtcmVzIHRpbWVzdGFtcCBvZiB0aGUgY3VycmVudCB0aW1lLiAqL1xuZnVuY3Rpb24gbm93KCk6IE1pY3Jvc2Vjb25kcyB7XG4gIGNvbnN0IFtzZWMsIG5zZWNdID0gcHJvY2Vzcy5ocnRpbWUoKTtcbiAgcmV0dXJuIChzZWMgKiAxZTYpICsgKG5zZWMgLyAxZTMpO1xufVxuXG4vKipcbiAqIFRoZSB0eXBlIG9mIGVudHJpZXMgaW4gdGhlIENocm9tZSBUcmFjZSBmb3JtYXQ6XG4gKiBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9kb2N1bWVudC9kLzFDdkFDbHZGZnlBNVItUGhZVW1uNU9PUXRZTUg0aDZJMG5Tc0tjaE5BeVNVL2VkaXRcbiAqIEZpZWxkIG5hbWVzIGFyZSBjaG9zZW4gdG8gbWF0Y2ggdGhlIEpTT04gZm9ybWF0LlxuICovXG5kZWNsYXJlIGludGVyZmFjZSBFdmVudCB7XG4gIG5hbWU6IHN0cmluZztcbiAgcGg6ICdCJ3wnRSd8J1gnfCdDJztcbiAgcGlkOiBudW1iZXI7ICAvLyBSZXF1aXJlZCBmaWVsZCBpbiB0aGUgdHJhY2Ugdmlld2VyLCBidXQgd2UgZG9uJ3QgdXNlIGl0LlxuICB0czogTWljcm9zZWNvbmRzO1xuICBkdXI/OiBNaWNyb3NlY29uZHM7XG4gIGFyZ3M/OiBhbnk7XG59XG5cbmNvbnN0IGV2ZW50czogRXZlbnRbXSA9IFtdO1xuXG4vKiogd3JhcCB3cmFwcyBlbnRlcigpL2xlYXZlKCkgY2FsbHMgYXJvdW5kIGEgYmxvY2sgb2YgY29kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwPFQ+KG5hbWU6IHN0cmluZywgZjogKCkgPT4gVCk6IFQge1xuICBjb25zdCBzdGFydCA9IG5vdygpO1xuICB0cnkge1xuICAgIHJldHVybiBmKCk7XG4gIH0gZmluYWxseSB7XG4gICAgY29uc3QgZW5kID0gbm93KCk7XG4gICAgZXZlbnRzLnB1c2goe25hbWUsIHBoOiAnWCcsIHBpZDogMSwgdHM6IHN0YXJ0LCBkdXI6IChlbmQgLSBzdGFydCl9KTtcbiAgfVxufVxuXG4vKipcbiAqIGNvdW50ZXIgcmVjb3JkcyBhIHNuYXBzaG90IG9mIGNvdW50cy4gIFRoZSBjb3VudGVyIG5hbWUgaWRlbnRpZmllcyBhXG4gKiBzaW5nbGUgZ3JhcGgsIHdoaWxlIHRoZSBjb3VudHMgb2JqZWN0IHByb3ZpZGVzIGRhdGEgZm9yIGVhY2ggY291bnRcbiAqIG9mIGEgbGluZSBvbiB0aGUgc3RhY2tlZCBiYXIgZ3JhcGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3VudGVyKG5hbWU6IHN0cmluZywgY291bnRzOiB7W25hbWU6IHN0cmluZ106IG51bWJlcn0pIHtcbiAgZXZlbnRzLnB1c2goe25hbWUsIHBoOiAnQycsIHBpZDogMSwgdHM6IG5vdygpLCBhcmdzOiBjb3VudHN9KTtcbn1cblxuLyoqIHdyaXRlIHdyaXRlcyB0aGUgdHJhY2UgaW4gQ2hyb21lIFRyYWNlIGZvcm1hdCB0byBhIGdpdmVuIHBhdGguICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGUocGF0aDogc3RyaW5nKSB7XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgSlNPTi5zdHJpbmdpZnkoZXZlbnRzKSwge2VuY29kaW5nOiAndXRmOCd9KTtcbn1cblxuLyoqIFJlY29yZCB0aGUgY3VycmVudCBoZWFwIHVzYWdlIHRvIHRoZSBwZXJmb3JtYW5jZSB0cmFjZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzbmFwc2hvdE1lbW9yeVVzYWdlKCkge1xuICBjb25zdCBzbmFwc2hvdCA9IHByb2Nlc3MubWVtb3J5VXNhZ2UoKTtcbiAgLy8gVGhlIGNvdW50ZXIgZGlzcGxheXMgYXMgYSBzdGFja2VkIGJhciBncmFwaCwgc28gY29tcHV0ZSBtZXRyaWNzXG4gIC8vIHRoYXQgc3VtIHRvIHRoZSBhcHByb3ByaWF0ZSB0b3RhbC5cbiAgY29uc3QgdW51c2VkID0gc25hcHNob3QuaGVhcFRvdGFsIC0gc25hcHNob3QuaGVhcFVzZWQ7XG4gIGNvdW50ZXIoJ21lbW9yeScsIHsndXNlZCc6IHNuYXBzaG90LmhlYXBVc2VkLCAndW51c2VkJzogdW51c2VkfSk7XG59XG4iXX0=