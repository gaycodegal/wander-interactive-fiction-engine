/**
 * @fileoverview Checker contains all the information we need to perform source
 * file AST traversals and report errors.
 */
import * as ts from 'typescript';
import { Failure, Fix } from './failure';
/**
 * Tsetse rules use on() and addFailureAtNode() for rule implementations.
 * Rules can get a ts.TypeChecker from checker.typeChecker so typed rules are
 * possible. Compiler uses execute() to run the Tsetse check.
 */
export declare class Checker {
    /**
     * nodeHandlersMap contains node to handlers mapping for all enabled rules.
     */
    private nodeHandlersMap;
    private failures;
    private currentSourceFile;
    private currentCode;
    /**
     * Allow typed rules via typeChecker.
     */
    typeChecker: ts.TypeChecker;
    constructor(program: ts.Program);
    /**
     * This doesn't run any checks yet. Instead, it registers `handlerFunction` on
     * `nodeKind` node in `nodeHandlersMap` map. After all rules register their
     * handlers, the source file AST will be traversed.
     */
    on<T extends ts.Node>(nodeKind: T['kind'], handlerFunction: (checker: Checker, node: T) => void, code: number): void;
    /**
     * Add a failure with a span. addFailure() is currently private because
     * `addFailureAtNode` is preferred.
     */
    private addFailure;
    addFailureAtNode(node: ts.Node, failureText: string, fix?: Fix): void;
    /**
     * Walk `sourceFile`, invoking registered handlers with Checker as the first
     * argument and current node as the second argument. Return failures if there
     * are any.
     */
    execute(sourceFile: ts.SourceFile): Failure[];
}
