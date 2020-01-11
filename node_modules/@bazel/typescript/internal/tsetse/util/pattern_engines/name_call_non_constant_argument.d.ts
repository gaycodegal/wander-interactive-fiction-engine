import * as ts from 'typescript';
import { Checker } from '../../checker';
import { Fixer } from '../fixer';
import { Config } from '../pattern_config';
import { PatternEngine } from './pattern_engine';
/**
 * The engine for BANNED_CALL_NON_CONSTANT_ARGUMENT.
 *
 * This takes any amount of (functionName, argument) position pairs, separated
 * by a colon. The first part matches symbols that were defined on the global
 * scope, and their fields, without going through a prototype chain.
 *
 * For instance, "URL.createObjectURL:0" will target any createObjectURL-named
 * call on a URL-named object (like the ambient URL declared in lib.dom.d.ts),
 * or "Car.buildFromParts:1" will match any buildFromParts reached from a
 * Car-named symbol, including a hypothetical class with a static member
 * function "buildFromParts" that lives in its own module.
 */
export declare class CallNonConstantArgumentEngine extends PatternEngine {
    private readonly matchers;
    constructor(config: Config, fixer?: Fixer);
    register(checker: Checker): void;
    check(tc: ts.TypeChecker, n: ts.Node): ts.Node | undefined;
}
