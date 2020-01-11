/**
 * @fileoverview A Tsetse rule that checks that all promises in async function
 * blocks are awaited or used.
 */
import { Checker } from '../checker';
import { AbstractRule } from '../rule';
export declare class Rule extends AbstractRule {
    readonly ruleName = "must-use-promises";
    readonly code = ErrorCode.MUST_USE_PROMISES;
    register(checker: Checker): void;
}
