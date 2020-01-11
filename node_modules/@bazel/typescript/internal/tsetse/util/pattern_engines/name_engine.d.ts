import * as ts from 'typescript';
import { Checker } from '../../checker';
import { Fixer } from '../fixer';
import { Config } from '../pattern_config';
import { PatternEngine } from './pattern_engine';
export declare class NameEngine extends PatternEngine {
    private readonly matcher;
    constructor(config: Config, fixer?: Fixer);
    register(checker: Checker): void;
    check(tc: ts.TypeChecker, n: ts.Node): ts.Node | undefined;
}
