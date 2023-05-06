import isObject from './is-object';

// --------------------------------------------------
// Glossary
// --------------------------------------------------

// Multi-Tree Node (MTN) - This represents a single *location* within a
//   collection of trees. If any trees do not have this node, then NOT_PRESENT
//   is used in place of that node's value (ie. STN).
//   NOTE: An 'MTN' is different structures in different contexts. Most of the
//         time it is an Object containing:
//         - the STN values (in the 'values' property), and
//         - other metadata about the node.
//         In some places (mainly the Trees.traverse() function) an 'MTN' is an
//         array of STNs.
//
// Single-Tree Node (STN) - This represents a single node within a single tree.
//   An STN is an Object or a value from the TraversalNode enum.

// --------------------------------------------------
// Helpers and Enumerations
// --------------------------------------------------

export const TraversalConflictPriority = Object.freeze({
    LEAF: Symbol("take-leaf"),
    NON_LEAF: Symbol("take-non-leaf"),
    NEITHER: Symbol("take-neither")
});

export const TraversalNode = Object.freeze({
    NOT_PRESENT: Symbol("not-present"),
    CONFLICTING_TYPE: Symbol("conflicting-type")
});

export function isSpecialNode(stn) {
    return Object.values(TraversalNode).some((type) => stn === type);
}

export function resolvePath(root, path) {
    let node = root;
    for (const key of path) {
        node = node[key];
    }
    return node;
}

export function insertAtPath(root, path, item, create) {
    if (create == null) create = false;

    let node = root;
    for (const key of path.slice(0, -1)) {
        if (create && node[key] === undefined) node[key] = {};
        node = node[key];
    }
    node[path[path.length-1]] = item;

    return root; // May be useful in some cases, eg. reduce()
}

// Selector functions take an MTN, and select and return one of its STNs.
// Some selector functions can be wrapped to modify their behaviour.
export const Selectors = Object.freeze({
    // Can be wrapped to:
    // - change the order of the values in the MTN by using a sorting function:
    //     (mtn) => Selectors.first(mtn, (arr) => arr.slice().reverse())
    // - disable exclusion of special STNs (ie. those from TraversalNode):
    //     (mtn) => Selectors.first(mtn, null, true)
    first(mtn, sort, includeSpecial) {
        if (sort == null) sort = (a) => a;
        const sortedValues = sort(mtn.values);

        let newStn = null;
        if (includeSpecial) {
            // Returns undefined if mtn is an empty array, rather than throwing
            newStn = sortedValues.find(() => true);
        } else {
            newStn = sortedValues.find((stn) => !isSpecialNode(stn));
        }

        if (newStn !== undefined) {
            return newStn; // Use the first 'real' value
        } else {
            return TraversalNode.NOT_PRESENT; // If no 'real' values found
        }
    },

    // Alias for first, with the values in reversed order
    last: (mtn) => Selectors.first(mtn, (a) => a.slice().reverse())
});

export const Trees = Object.freeze({
    // --------------------------------------------------
    // Main Traversal Function
    // --------------------------------------------------

    // An generator/iterator for one or more trees simultaneously.
    //
    // Yields {key, values[], isLeaf, parentPath[]} for every 'node'. Yielding
    // every node allows the entire tree to be re-constructed using the
    // generator.
    //
    // NOTE: It iterates depth-first.
    // NOTE: The 'parentPath' parameter is rarely passed in directly. It is
    //       mainly used as part of the MTNs (see below for definition) that are
    //       yielded when recursing. It may occasionally become useful to pass
    //       in a value, such as if you know the roots of all trees you are
    //       passing in are part of larger trees, and using the path relative to
    //       these larger trees is necessary/useful for your algorithm.
    // NOTE: The given 'trees' MTN (ie. the root node of the given trees) is not
    //       counted as a node, and so will never be yielded. All of it's
    //       contained nodes (alongside their keys and other MTN metadata) are
    //       counted, and will be yielded. This means that the root node can be
    //       reconstructed by adding all 0-depth nodes to an empty Object.
    traverse: function* (trees, options, parentPath) {
        if (parentPath == null) parentPath = [];

        // Options
        const defaultOptions = {
            isLeaf: (node) => false, // No object is a leaf node
            comparator: (mtn1, mtn2) => 0, // Don't change order
            conflictPriority: TraversalConflictPriority.NEITHER
        }
        options = Object.assign({}, defaultOptions, options);

        // Gather all nodes from the root node of all trees (which will be any
        // given location further down the tree when recursing).
        const concatNodeNames = trees.reduce(
            (accum, tree) => accum.concat(Object.keys(tree)), []);
        const uniqueNodeNames = Array.from(new Set(concatNodeNames));

        // Construct the MTNs
        // --------------------------------------------------

        const mtns = [];
        for (const key of uniqueNodeNames) {
            // Get the MTN for this key.
            const mtn = trees.reduce(
                (accum, tree) => {
                    if (
                        tree !== TraversalNode.NOT_PRESENT &&
                        tree[key] !== undefined
                    ) {
                        accum.push(tree[key]);
                    } else {
                        accum.push(TraversalNode.NOT_PRESENT)
                    }
                    return accum;
                }, []);

            // Filter out all nodes whose types conflict (ie. if a single MTN
            // has STNs that are not all leaf/non-leaf nodes), according to the
            // traversal option
            // --------------------

            // Determine if the STN in each tree is a leaf node.
            const areLeaf = mtn.map(
                (stn) => (!isObject(stn) || options.isLeaf(stn))
            );

            // If there are any conflicts, resolve them.
            const someLeafNodes = areLeaf.some((isLeaf_) => isLeaf_);
            const someNonLeafNodes = areLeaf.some((isLeaf_) => !isLeaf_);

            let isLeaf_ = null;
            if (someLeafNodes && someNonLeafNodes) {
                switch (options.conflictPriority) {
                    // Use only leaf nodes.
                    case TraversalConflictPriority.LEAF:
                        isLeaf_ = true;
                        for (let i=0; i<mtn.length; i++) {
                            if (!areLeaf[i]) {
                                mtn[i] = TraversalNode.CONFLICTING_TYPE;
                            }
                        }
                        break;

                    // Use only non-leaf nodes.
                    case TraversalConflictPriority.NON_LEAF:
                        isLeaf_ = false;
                        for (let i=0; i<mtn.length; i++) {
                            if (areLeaf[i]) {
                                mtn[i] = TraversalNode.CONFLICTING_TYPE;
                            }
                        }
                        break;

                    // Use neither
                    case TraversalConflictPriority.NEITHER:
                        // If there there is a leaf and non-leaf node in this
                        // position in different trees, then assign
                        // CONFLICTING_TYPE to all values.
                        if (someLeafNodes && someNonLeafNodes) {
                            isLeaf_ = null;
                            for (let i=0; i<mtn.length; i++) {
                                mtn[i] = TraversalNode.CONFLICTING_TYPE;
                            }
                        }
                        else if (someLeafNodes) isLeaf_ = true;
                        else if (someNonLeafNodes) isLeaf_ = false;
                        break;
                }
            }
            else if (someLeafNodes) isLeaf_ = true;
            else if (someNonLeafNodes) isLeaf_ = false;

            // Generate the node sequence and recurse depth-first
            // --------------------

            // Yield this MTN, whether leaf or not.
            mtns.push({
                key: key,
                values: [...mtn],
                isLeaf: isLeaf_,
                parentPath: parentPath
            });
        }

        // Sort the MTNs
        // --------------------------------------------------

        mtns.sort(options.comparator);

        // Yield the MTNs and Recurse
        // --------------------------------------------------

        for (const mtn of mtns) {
            yield mtn;

            // If not a leaf node, then recurse down.
            if (!mtn.isLeaf) {
                // Recurse to all standard sub-nodes (ie. excluding nodes that have
                // special values from the TraversalNode enum).
                const nextPath = mtn.parentPath.concat(mtn.key);
                const subTree = Trees.traverse(mtn.values, options, nextPath);

                // Yield all non-special sub-nodes
                for (const subNode of subTree) {
                    yield subNode;
                }
            }
        }
    },

    // --------------------------------------------------
    // Common Use-Cases
    // --------------------------------------------------

    // Reduce multiple trees into a new tree.
    // If into is given, it must be an object. It defaults to a blank object.
    reduce(trees, fn, into, traverseOptions) {
        if (fn == null) throw new Error("'fn' must be given");
        if (into == null) into = {};

        for (const mtn of Trees.traverse(trees, traverseOptions)) {
            into = fn(into, mtn);
        }
        return into;
    },

    // Translate (Map and Filter) Trees
    // Construct a tree out of one or more given trees.
    // - mapFn(mtn) must return an STN (ie. a 'real' node - an Object).
    // - filterFn(mtn) returns a boolean that dictates whether to keep the node
    //   at all. If the node is pruned, all of its sub-nodes are too (if any).
    translate(trees, filterFn, mapFn, into, traverseOptions) {
        if (filterFn == null) filterFn = () => true; // never filter
        if (mapFn == null) mapFn = Selectors.first; // See Selectors.first()

        function translateReducer(accum, mtn) {
            if (filterFn(mtn)) {
                // As parts of the tree could be pruned off all together,
                // reconstruction of the *entire* tree is not garunteed, that
                // being the purpose of filter().
                try {
                    insertAtPath(
                        accum,
                        mtn.parentPath.concat(mtn.key),
                        mtn.isLeaf ? mapFn(mtn) : {},
                        false // ie. raise on path resolution failure
                    );

                // If the path cannot be resolved, then some node up the path
                // has been pruned. This would raise:
                //   TypeError: [some-node-up-the-path] is undefined
                } catch (e) {
                    if (e instanceof TypeError) {
                        // Do nothing
                    } else {
                        throw e;
                    }
                }
            }
            return accum;
        }

        return Trees.reduce(trees, translateReducer, into, traverseOptions);
    },

    // Flatten Tree
    // If into is an object, flatten into that object (preserving keys). If into
    // is an array, flatten the nodes into that array (discarding keys).
    // NOTE: Only flattens leaf nodes (ignores non-leaf nodes).
    // NOTE: If you need to flatten multiple trees into one, use
    //       Trees.flatten(Trees.translate(trees, ...)).
    flatten(tree, into, traverseOptions) {
        // Into's default must be set here too, as its type is checked in this
        // scope.
        if (into == null) into = {};

        function flattenReducer(accum, mtn) {
            if (mtn.isLeaf) {
                if (isObject(into)) {
                    accum[mtn.key] = mtn.values[0];
                } else if (Array.isArray(into)) {
                    accum.push(mtn.values[0]);
                }
            }
            return accum;
        }

        return Trees.reduce([tree], flattenReducer, into, traverseOptions);
    }
});
