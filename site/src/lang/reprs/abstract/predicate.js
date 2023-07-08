const predicateSym = Symbol("predicate");

export function predicate(fn) {
    if (typeof fn !== "function") {
        throw new Error("predicates must be created from a function");
    }
    fn.predicateType = predicateSym;
    return fn;
}
export function isPredicate(fn) {
    return fn != null && fn.predicateType === predicateSym;
}
