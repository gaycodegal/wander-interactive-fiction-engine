interface IdxSig {
    [key: string]: string;
}
declare function propAccess(x: IdxSig): void;
declare function descructuring(x: IdxSig): void;
interface MixedIdxSig extends IdxSig {
    namedProp: string;
}
declare function mixedPropAccess(x: MixedIdxSig): void;
declare function genericAccess<T extends IdxSig>(x: T): void;
interface MixedIndexSigUsedInUnion {
    [key: string]: string;
    namedProp2: string;
}
declare function unionType(x: MixedIdxSig | MixedIndexSigUsedInUnion): void;
/**
 * Curiously Record<string, T> is treated like an index signature.
 */
declare function recordStringType(x: Record<string, number>): void;
/**
 * But narrowing the generic parameter to a string literal union exempts it.
 */
declare function recordNarrowType(x: Record<'prop' | 'other', number>): void;
/**
 * Similary, to Records mapped types of of 'in string' are threated like a
 * string index signature.
 */
declare function mappedType(x: {
    [x in string]: boolean;
}): void;
