import { Checker } from '../checker';
import { AbstractRule } from '../rule';
/**
 * A Tsetse rule that checks for some potential unsafe property renaming
 * patterns.
 *
 * Note: This rule can have false positives.
 */
export declare class Rule extends AbstractRule {
    readonly ruleName = "property-renaming-safe";
    readonly code = ErrorCode.PROPERTY_RENAMING_SAFE;
    register(checker: Checker): void;
}
