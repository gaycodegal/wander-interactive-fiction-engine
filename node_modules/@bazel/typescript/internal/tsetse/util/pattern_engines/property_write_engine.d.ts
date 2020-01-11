import * as ts from 'typescript';
import { Checker } from '../../checker';
import { Fixer } from '../fixer';
import { Config } from '../pattern_config';
import { PatternEngine } from '../pattern_engines/pattern_engine';
/**
 * The engine for BANNED_PROPERTY_WRITE.
 */
export declare class PropertyWriteEngine extends PatternEngine {
    private readonly matcher;
    constructor(config: Config, fixer?: Fixer);
    register(checker: Checker): void;
    check(tc: ts.TypeChecker, n: ts.Node): ts.Node | undefined;
}
