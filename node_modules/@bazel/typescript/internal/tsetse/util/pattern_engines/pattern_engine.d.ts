import * as ts from 'typescript';
import { Checker } from '../../checker';
import { Fixer } from '../../util/fixer';
import { Config } from '../../util/pattern_config';
/**
 * A patternEngine is the logic that handles a specific PatternKind.
 */
export declare abstract class PatternEngine {
    protected readonly config: Config;
    protected readonly fixer?: Fixer | undefined;
    private readonly whitelistedPrefixes;
    private readonly whitelistedRegExps;
    private readonly whitelistMemoizer;
    constructor(config: Config, fixer?: Fixer | undefined);
    /**
     * `register` will be called by the ConformanceRule to tell Tsetse the
     * PatternEngine will handle matching. Implementations should use
     *`checkAndFilterResults` as a wrapper for `check`.
     **/
    abstract register(checker: Checker): void;
    /**
     * `check` is the PatternEngine subclass-specific matching logic. Overwrite
     * with what the engine looks for, i.e., AST matching. The whitelisting logic
     * and fix generation are handled in `checkAndFilterResults`.
     */
    abstract check(tc: ts.TypeChecker, n: ts.Node): ts.Node | undefined;
    /**
     * A wrapper for `check` that handles aspects of the analysis that are not
     * engine-specific, and which defers to the subclass-specific logic
     * afterwards.
     */
    checkAndFilterResults(c: Checker, n: ts.Node): void;
    isWhitelisted(n: ts.Node): boolean;
}
