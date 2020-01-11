/**
 * @fileoverview Bans using a promise as a condition. Promises are always
 * truthy, and this pattern is likely to be a bug where the developer meant
 * if(await returnsPromise()) {} and forgot the await.
 */
import { Checker } from '../checker';
import { AbstractRule } from '../rule';
export declare class Rule extends AbstractRule {
    readonly ruleName = "ban-promise-as-condition";
    readonly code = ErrorCode.BAN_PROMISE_AS_CONDITION;
    register(checker: Checker): void;
}
