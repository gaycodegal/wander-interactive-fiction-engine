import * as ts from 'typescript';
/**
 * This class matches symbols given a "foo.bar.baz" name, where none of the
 * steps are instances of classes.
 *
 * Note that this isn't smart about subclasses and types: to write a check, we
 * strongly suggest finding the expected symbol in externs to find the object
 * name on which the symbol was initially defined.
 *
 * TODO(rjamet): add a file-based optional filter, since FQNs tell you where
 * your imported symbols were initially defined. That would let us be more
 * specific in matches (say, you want to ban the fromLiteral in foo.ts but not
 * the one from bar.ts).
 */
export declare class AbsoluteMatcher {
    readonly bannedName: string;
    /**
     * From a "path/to/file.ts:foo.bar.baz" or "foo.bar.baz" matcher
     * specification, builds a Matcher.
     */
    constructor(bannedName: string);
    matches(n: ts.Node, tc: ts.TypeChecker): boolean;
}
/**
 * This class matches a property access node, based on a property holder type
 * (through its name), i.e. a class, and a property name.
 *
 * The logic is voluntarily simple: if a matcher for `a.b` tests a `x.y` node,
 * it will return true if:
 * - `x` is of type `a` either directly (name-based) or through inheritance
 *   (ditto),
 * - and, textually, `y` === `b`.
 *
 * Note that the logic is different from TS's type system: this matcher doesn't
 * have any knowledge of structural typing.
 */
export declare class PropertyMatcher {
    readonly bannedType: string;
    readonly bannedProperty: string;
    static fromSpec(spec: string): PropertyMatcher;
    constructor(bannedType: string, bannedProperty: string);
    /**
     * @param n The PropertyAccessExpression we're looking at.
     */
    matches(n: ts.PropertyAccessExpression, tc: ts.TypeChecker): boolean;
    private exactTypeMatches;
    private typeMatches;
}
