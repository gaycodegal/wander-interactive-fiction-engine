/**
 * @fileoverview A Tsetse rule that checks the return value of certain functions
 * must be used.
 */
import { Checker } from '../checker';
import { AbstractRule } from '../rule';
export declare class Rule extends AbstractRule {
    readonly ruleName = "check-return-value";
    readonly code = ErrorCode.CHECK_RETURN_VALUE;
    register(checker: Checker): void;
}
