/**
 * @fileoverview Bans `== NaN`, `=== NaN`, `!= NaN`, and `!== NaN` in TypeScript
 * code, since no value (including NaN) is equal to NaN.
 */
import { Checker } from '../checker';
import { AbstractRule } from '../rule';
export declare class Rule extends AbstractRule {
    readonly ruleName = "equals-nan";
    readonly code = ErrorCode.EQUALS_NAN;
    register(checker: Checker): void;
}
