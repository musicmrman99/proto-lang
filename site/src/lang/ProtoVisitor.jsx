import Message from '../utils/Message';
import ProtoParserVisitor from './build/ProtoParserVisitor';

import { repr, is, format } from '../core/Representations';

/* Parser
-------------------------------------------------- */

// This class defines a complete visitor for a parse tree produced by ProtoParser.
export default class ProtoVisitor extends ProtoParserVisitor {
    /**
     * Create an ANTLR visitor for the output of the 1st phase parser.
     * 
     * @param {{}} config The configuration to use.
     * @param {{success: boolean, output: Array}} log The logger for errors,
     *   warnings, and other messages.
     */
    constructor(config, log) {
        super();

        this.config = config;
        this.log = log;
    }

    /* Dropped and Bypassed Nodes
    -------------------- */

    // Discard comments and unimportant whitespace
    visitComment = () => null;
    visitAny_whitespace = () => null;

    // Bypass expression_atom and map_expression_atom nodes
    visitExpression_atom = (ctx) => this.visitChildren(ctx)[0];

    /* Basic Literals and Syntactic Expressions
    -------------------- */

    // Translate basic literals into their JS equivalents
    visitNumber_literal = (ctx) => {
        const [whole, frac] = ctx.INT_LITERAL();
        const point = ctx.DECIMAL_POINT();
        return new repr.Number(parseFloat(
            whole.getText() +
            (point != null ? point.getText() : "") +
            (frac != null ? frac.getText() : "")
        ));
    }
    visitText_literal = (ctx) => new repr.Text(ctx.TEXT_LITERAL().getText().slice(1, -1)); // Remove the quotes
    visitLogical_literal = (ctx) => new repr.Logical(ctx.LOGICAL_LITERAL().getText() === "true");

    // Translate parameters into their AST representation
    // Note: Like basic literals, parameters can appear anywhere
    visitParameter = (ctx) => {
        const index = ctx.parameter_index();
        const extraction = ctx.parameter_extraction();
        return new repr.Parameter(
            index != null ? parseInt(index.getText()) : 1,
            extraction != null ? this.visitMap_literal(extraction.map_literal()) : new repr.Map()
        );
    }

    /* Pre-Sentence Parsing Representations
    -------------------- */

    // Translate sentence_fragment and the various syntactic operators
    // into their pre-sentence parsing AST representations.

    visitSentence_fragment = (ctx) => new repr.SentenceFragment(ctx.getText());

    visitUsing_operator = () => new repr.UsingOperator();
    visitDeclaration_operator = () => new repr.DeclarationOperator();
    visitPlaceholder_operator = () => new repr.PlaceholderOperator();

    visitMap_separator_operator = () => new repr.SeparatorOperator();
    visitMap_association_operator = (ctx) => new repr.AssociationOperator(
        {
            "--": { left: false, right: false },
            "->": { left: false, right: true  },
            "<-": { left: true,  right: false },
            "<>": { left: true,  right: true  },
        }[ctx.MAP_ASSOCIATION().getText()]
    );

    /* Sentence Parsing
    -------------------- */

    // Translate newline -> explicit soft terminator
    visitNewline = () => new repr.ExplicitSoftTerminator();

    // Program (entry point) and Compound Literals
    visitProgram = (ctx) => {
        // First, get the normalised representation of all 1st-phase parser nodes
        // (leaf-to-root (outward) parse).
        const root = this.parseBlock(ctx);

        // Then do sentence parsing - this ensures that *declarations* are parsed/added
        // top-to-bottom, root-to-leaf (inward). A leaf-to-root parse here would cause
        // no sentence definitions to be available in nested nodes (blocks/maps).
        // 
        // This is one way of implementing lexical clojures, as refs are bound to the
        // block's child Sentences at the site of creation, and may come from outer
        // scopes.
        this.parseSentences(root, root);
        return root;
    };
    visitBlock_literal = (ctx) => this.parseBlock(ctx);
    visitMap_literal = (ctx) => this.parseMap(ctx);

    parseBlock = (ctx) => {
        const parent = new repr.Block();
        parent.children = this.getNormalisedChildren(ctx);
        parent.children.filter(is.nestable).forEach((child) => child.parent = parent);
        parent.decls = [];
        return parent;
    }

    parseMap = (ctx) => {
        const parent = new repr.Map();
        parent.children = this.getNormalisedChildren(ctx);
        parent.children.filter(is.nestable).forEach((child) => child.parent = parent);
        return parent;
    }

    getNormalisedChildren = (ctx) => {
        // Get raw children
        let children = this.visitChildren(ctx) // Expressions -> their values / representations
            .filter((child) => child != null); // Remove EOF, `{`, `}`, `[`, `]`, and dropped nodes

        // Merge sentence fragments
        children = this.mergeSentenceFragments(children);

        return children;
    }

    // Merge SENTENCE_FRAGMENT nodes (they'll be split correctly later), while
    // passing along other node types.
    mergeSentenceFragments(children) {
        const newChildren = [];

        // Initialise and utility
        let mergedSentenceFragment = [];
        const pushMergedSentenceFragment = () => {
            if (mergedSentenceFragment.length > 0) {
                newChildren.push(new repr.SentenceFragment(
                    mergedSentenceFragment
                        .map((sentenceFragment) => sentenceFragment.content)
                        .join("")
                ));
                mergedSentenceFragment = [];
            }
        };

        // Merge adjacent sentence fragments
        for (const child of children) {
            if (is.sentenceFragment(child)) {
                mergedSentenceFragment.push(child);
            } else {
                pushMergedSentenceFragment();
                newChildren.push(child);
            }
        }
        pushMergedSentenceFragment();

        return newChildren;
    }

    /* Sentence Parsing Algorithm
    -------------------- */

    /**
     * Parses all sentences and any additional features relevant to the node
     * type from the children.
     * 
     * @param {repr.Block} context The current declaration context. It will have its
     *   decls and reqEncDecls lists populated.
     * @param {repr.Map|repr.Block} nestableNode The representation of the nestable
     *   node in which to parse sentences. Its children will be replaced by the
     *   parsed sentences.
     */
    parseSentences = (context, nestableNode) => {
        /*
        Details of the algorithm:

        +---------------------------------------------------------------------------+
        |                                  |                 Effect                 |
        +              Symbol(s)           +----------------------------------------+
        |                                  |        Expr        |        Decl       |
        |---------------------------------------------------------------------------|
        | fragment                         | buffer + continue  | buffer + continue |
        | number, text, logical, parameter | hard nesting       | ERROR             |
        | map, block                       | hard nesting       | ERROR             |
        | separator operator               | hard terminator    | ERROR             |
        | association operator             | hard terminator    | ERROR             |
        | explicit hard terminator         | hard terminator    | ERROR             |
        | explicit soft terminator         | soft terminator    | ERROR             |
        | placeholder operator             | ERROR              | placeholder       |
        | declaration operator             | ERROR              | terminator (decl) |
        +---------------------------------------------------------------------------+

        "Effect" Key
        --------------------

        Base:
        - buffer + continue - Add to the list of candidate nodes, then move to next token.
        - hard nesting      - Must either appear on its own, or fit into a placeholder as
                              a sentence argument.
        - soft terminator   - May terminate the sentence. If it doesn't, keep parsing.
        - hard terminator   - Must terminate the sentence and produce a Sentence as a
                              new child of the current nestable node. If it doesn't
                              terminate the sentence, then error.

        Additional Features:
        - terminator (decl) - Terminates the sentence template and produces a Declaration.
                              If the value/sentence after the declaration point is
                              incomplete or otherwise invalid, then error.
                              Requires the "declaration" additional feature.
        - placeholder       - Represents itself. Requires the "declaration" additional
                              feature.
        */

        // Value is:
        // - true if a declaration operator is allowed next.
        // - false if a declaration operator is not allowed next.
        // - a repr.Declaration if next complete sentence is the value of a decl.
        let declTemplate = is.hasDeclarations(nestableNode);

        // Utility for the previous one. If it's not boolean, then it must be the
        // relevant Repr.
        const isImpossible = (value) => value === false;
        const isPossible = (value) => value === true;
        const isActual = (value) => !isImpossible(value) && !isPossible(value);

        // A buffer for collected nodes until a valid syntactic construct is found
        // (eg. a complete sentence, declaration operator, separator operator, association operator, etc.),
        // or until this nestable node's content is judged to be malformed.
        let candidateNodes = [];

        // The collation of all valid sentences.
        const finalChildren = [];

        /**
         * Check if nodes up to this point form a complete sentence based on all
         * outer declarations and all declarations in this scope so far, and if
         * so, flush the sentence to final children.
         * 
         * Must be done for each soft/hard terminator, including the explicit one
         * at the end of the nestable node.
         */
        const terminateSentence = (terminator) => {
            // Try to parse sentence using the collection of all declarations
            // lexically available in this nestable node, in order of precedence.
            const sentence = this.parseSentence(candidateNodes, this.getDeclarations(nestableNode));

            // If the sentence is incomplete, then return
            if (sentence == null) {
                // If the sentence MUST be complate by this point, then error
                if (is.hardTerminator(terminator)) {
                    this.log.success = false;
                    this.log.output.push(
                        new Message("error", "Incomplete Sentence: " + format.nodeListToString(candidateNodes))
                    );
                }
                return;
            }

            // Add the Sentence/Declaration to the nestable node
            if (isActual(declTemplate)) {
                const decl = new repr.Declaration(declTemplate, sentence);

                // Must be in set of static declarations for senteces to be parsed
                // (ie. the this.parseSentence() algorithm used above).
                nestableNode.decls.push(decl);

                // Senteces in declarations must be evaluated at the site of declaration,
                // not the site of usage, for closures to work properly.
                finalChildren.push(decl);

                // We're now out of the 'value of a declaration' context, so further declarations are allowed.
                declTemplate = true;

                this.log.output.push(new Message("info", "New Declaration: " + decl.toString()));

            } else {
                finalChildren.push(sentence);

                this.log.output.push(new Message("info", "New Sentence: " + sentence.toString()));
            }

            // Parse nested nodes (recurse into non-nestable child nodes as needed).
            //
            // Doing it here - after the Declaration has been added to this namespace,
            // and not during sentence parsing - makes this language support recursive
            // blocks without faffing with mutable maps.
            //
            // Also, find all the Declarations that this block will need to enclose over.
            this.parseNestedNodes(context, sentence);

            // Drop explicit terminators but keep implicit ones, as they may still
            // need parsing in the parent nestable node.
            if (is.implicitTerminator(terminator)) finalChildren.push(terminator);

            // Keep parsing
            candidateNodes = [];
        }

        // Parse Children
        for (const child of nestableNode.children) {
            if (is.declarationOp(child)) {
                // Both 'defs not supported'/'multi-line template' (isImpossible())
                // and 'decl in def' (isActual()) are invalid.
                if (!isPossible(declTemplate)) {
                    candidateNodes.push(child); // Push the decl operator for the error
                    this.log.success = false;

                    // Error messages - be precise
                    if (!is.hasDeclarations(nestableNode)) {
                        this.log.output.push(
                            new Message("error",
                                "Declaration operator found outside of a block (at the end of " + format.nodeListToString(candidateNodes) + ")"
                            )
                        );
                    } else if (isImpossible(declTemplate)) {
                        this.log.output.push(
                            new Message("error",
                                "Multi-line sentence templates are not supported (" + format.nodeListToString(candidateNodes) + ")"
                            )
                        );
                    } else {
                        this.log.output.push(
                            new Message("error",
                                "Declaration operator found inside of another declaration's value (at end of " + format.nodeListToString(candidateNodes) + ")"
                            )
                        );
                        this.log.output.push(
                            new Message("info", "Declaration chaining is not supported.")
                        );
                    }

                    return []; // Block/map content is malformed - no children
                }

                // Templates consisting of only placeholders are invalid
                if (!candidateNodes.some(is.sentenceFragment)) {
                    this.log.success = false;
                    this.log.output.push(
                        new Message("error",
                            "Sentence templates consists only of placeholders (" + format.nodeListToString(candidateNodes) + ")"
                        )
                    );
                    return []; // Block/map content is malformed - no children
                }

                // Templates may only contain fragments and placeholders
                else if (!candidateNodes.every(
                    (node) => is.sentenceFragment(node) || is.placeholderOp(node)
                )) {
                    this.log.success = false;
                    this.log.output.push(
                        new Message("error",
                            "Sentence templates must not consist only of placeholders (" + format.nodeListToString(candidateNodes) + ")"
                        )
                    );
                    return []; // Block/map content is malformed - no children
                }

                declTemplate = candidateNodes;
                candidateNodes = [];

            } else if (is.terminator(child)) {
                terminateSentence(child);

            } else {
                // Otherwise, keep the input and continue
                candidateNodes.push(child);
            }
        }

        // The end of the nestable node is an explicit hard terminator,
        // but ignore it if we only just terminated the last sentence.
        if (candidateNodes.length > 0) terminateSentence(new repr.ExplicitHardTerminator());

        // Assign transformed children
        nestableNode.children = finalChildren;
    }

    /**
     * Return a flattened list of all declarations in the given lexical scope
     * (nestable node), ordered by lexical precedence to enable name hiding.
     * A declaration is a mapping of a sentence template to a literal or sentence.
     */
    getDeclarations = (nestableNode) => {
        // Base case (above the top namespace = no decls)
        if (nestableNode == null) return [];

        // Recursive case
        const decls = [];
        if (is.hasDeclarations(nestableNode)) {
            decls.push(...nestableNode.decls); // If this nestable node has a namespace, add its decls (possibly hiding parent decls)
        }
        decls.push(...this.getDeclarations(nestableNode.parent)); // Add decls of all parent namespaces recursively.
        return decls;
    }

    /**
     * Parse the sentences of the given nestable node (if a nestable node), or
     * all nestable nodes found within the given node (if not a nestable node).
     * 
     * Recurses into any non-nestable non-terminal nodes to find nestable nodes.
     * Assumes that all applicable declarations in parents (and the 'current'
     * declaration, if applicable) have been created for the nestable node's
     * sentences to match against.
     * 
     * Also, find all the Declarations that this block will need to enclose over.
     * 
     * @param {repr.Block} context The current declaration context. It will have its
     *   decls and reqEncDecls lists populated.
     * @param {repr.Repr} node The node to recursively search for nestable nodes (maps
     *   and blocks).
     */
    parseNestedNodes = (context, node) => {
        // Note: this is above parseSentence() in this file, regardless of the order
        //       of usage, because it's related to high-level processing of nodes.

        // Base case
        if (is.nestable(node)) {
            let nestableNode = node;
            // A parameter has-a Map, not is-a Map, so special-case it
            if (is.parameter(node)) nestableNode = node.extraction;

            // If this nestable node creates a new namespace/scope, set it as the
            // new context, otherwise keep the current context.
            const nestedContext = is.block(nestableNode) ? nestableNode : context;

            // Recurse into the nested sentences
            this.parseSentences(nestedContext, nestableNode);

            // If the nestable node we're parsing is a Map, now we know
            // its final children we can parse their associations.
            if (is.map(nestableNode)) this.parseAssociations(nestableNode);

            // If this nestable node creates a new namespace/scope, then cascade its
            // required enclosing declarations upwards to the current context,
            // excluding any declarations provided by the current context.
            if (is.block(nestableNode)) {
                context.reqEncDecls.push(
                    ...nestedContext.reqEncDecls
                    .filter((reqEncDecl) => !context.decls.includes(reqEncDecl))
                );
            }
        }

        if (is.sentence(node)) {
            // Check if the sentence's declaration requires enclosure, and add it if so
            if (!context.decls.includes(node.decl) && !context.reqEncDecls.includes(node.decl)) {
                context.reqEncDecls.push(node.decl);
            }

            // Recursive case
            for (const param of node.params) {
                this.parseNestedNodes(context, param);
            }
        }

        // Base case - non-nestable literal
        // Nothing to parse for these
    }

    /**
     * Parse the item separators and associations, removing their parse-phase
     * AST representations (repr.AssociationOperator and repr.SeparatorOperator).
     * 
     * @param {repr.Map} map The map to parse associations for.
     */
    parseAssociations = (map) => {
        // Note: this is above parseSentence() in this file, regardless of the order
        //       of usage, because it's related to high-level processing of nodes.

        const associations = [];
        const newChildren = [];

        let prevChild = null;
        let prevAssoc = null;
        for (const child of map.children) {
            if (is.separatorOp(child)) {
                prevChild = null;

            } else if (is.associationOp(child)) {
                prevAssoc = child;

            } else { // A sentence/literal/parameter/etc.
                if (prevAssoc != null) {
                    associations.push([prevChild, prevAssoc, child]);
                    prevAssoc = null;
                }
                newChildren.push(child);
                prevChild = child;
            }
        }

        map.associations = associations;
        map.children = newChildren;
    }

    /**
     * Try to create a Sentence from the given set of nodes.
     * 
     * Return null if the sentence is incomplete.
     * 
     * @param {Array<Repr>} sentence The sentence to parse.
     * @param {Array<repr.Declaration>} allDecls An array containing all in-scope
     *   declarations. Declaration templates must not contain only placeholders.
     */
    parseSentence = (sentence, allDecls, indent = 0) => {
        /*
        Key Points:
        - Top-level sentence must be terminated with a soft or hard terminator.
        - Top level sentence must match the entire node list and return ONE sentence, or null
        - Sub-sentences may extend to anywhere in the node list (and ambiguities must be resolved)

        Notes:
        - This algorithm assumes that sentences that only include placeholders are disallowed.
        */

        const indentStr = indent > 1 ? "-".repeat(indent-1)+"> " : "";
        const log = (message) => {
            this.log.output.push(new Message("info", indentStr + message));
        };

        log("Parse Sentence: " + format.nodeListToString(sentence));

        // 1) If it's a value (literal or parameter), return it directly (no sentence parsing).
        if (sentence.length === 1 && is.value(sentence[0])) {
            return sentence[0];
        }

        // Some logging for (2) and (3)
        log("In-Scope Declarations:");
        allDecls.forEach(decl => log(decl.toString()));

        // Check if it's a `using`
        const isUsingClause = is.usingOp(sentence[0]);
        const usingOperator = isUsingClause ? sentence[0] : null;

        // 2) Get a list of all possible matches of a sentence template (as an array of
        //    [decl, [Repr, ...]] pairs), ignoring recursion.
        const sortedTemplateMatches = allDecls
            // For each declaration
            .map((decl) => [decl]
                // Get the list of matches of the sentence
                .flatMap((decl) => isUsingClause ?
                    this.getAllTemplateMatches(sentence.slice(1), decl.template) :
                    this.getAllTemplateMatches(sentence, decl.template)
                )
                // Embed the declaration that let to those matches into each match
                .map((sentenceCandidate) => [decl, sentenceCandidate])
            )
            // Merge the lists of matches into one big list of matches
            .flat()
            // Remove non-matching declarations
            .filter(([_, sentenceCandidate]) => sentenceCandidate.length !== 0);

        // 3) For each sentence candidate, try to get a match. First match is
        //    the best match of this sentence.
        log("Match Against Declarations:");
        for (const [decl, sentenceCandidate] of sortedTemplateMatches) {
            // 3.1) Recursive Case: Try to parse each argument of the sentence/using
            //      (to get the best matching sub-sentence) to form a full sentence.
            const parsedArgs = this.parseSentenceArgs(sentenceCandidate, allDecls, isUsingClause, indent);
            const fullSentence = isUsingClause ?
                new repr.Using(decl, parsedArgs) :
                new repr.Sentence(decl, parsedArgs);

            // 3.2) If it has valid parameters, return it (the first full sentence
            //      found with a valid recursive parse wins).
            const isMatch = fullSentence.params != null;
            log(
                (isUsingClause ? usingOperator.toString() : "") + decl +
                " -- " + (isMatch ? "MATCH" : "NO MATCH")
            );
            if (isMatch) return fullSentence;
        }

        // 4) Base Case: No matching sentence found
        return null;
    }

    /**
     * Parse the arguments of the given sentence and return them as a list.
     * 
     * Return null if the sentence is not recursively valid.
     * 
     * @param {Array<repr.Repr>} sentence The sentence to parse the arguments of.
     * @param {Array<repr.Declaration>} allDecls An array containing all in-scope
     *   declarations. Declaration templates must not contain only placeholders.
     * @param {boolean} acceptUnboundArgs Whether to consider a single placeholder
     *   as a valid argument of the sentence. If this is true, and a single
     *   placeholder is found as an argument to the template, it is considered an
     *   unbound argument and kept as a PlaceholderOperator in the returned list.
     * @returns {Array<repr.Repr>} A list of sentences (and placeholder operators
     *   if acceptUnboundArgs is true) that are the valid argument expressions to
     *   the given sentence.
     */
    parseSentenceArgs = (sentence, allDecls, acceptUnboundArgs = false, indent = 0) => {
        const args = [];
        for (const node of sentence) {
            if (node === null) {
                return null;

            } else if (is.argument(node)) {
                const isUnboundArg = (
                    acceptUnboundArgs &&
                    node.children.length === 1 &&
                    is.placeholderOp(node.children[0])
                );

                const parsedArgument = isUnboundArg ?
                    node.children[0] :
                    this.parseSentence(node.children, allDecls, indent + 2);

                if (parsedArgument !== null) {
                    args.push(parsedArgument)
                } else {
                    // If any argument could not be parsed (ie. had no matching sentence template),
                    // then this sentence is not a valid sentence
                    return null;
                }
            }
        }
        return args;
    }

    /**
     * Match the given sentence to the given template.
     * 
     * Uses a recursive implementation. Upon finding a match against the current
     * template fragment, it recurses twice (a "binary fork") with different
     * parameters to try to find:
     * 
     * 1) The next match of this fragment.
     * 2) The first match of the next fragment after the position of this
     *    match of this fragment.
     * 
     * Ie. (where the number (-N-) represents trying to find a match for the Nth
     * fragment in the template):
     * 
     * ```txt
     *         /-3- ...
     *     /-2-+
     *     |   \-2- ...
     * -1-+            <-- Note: This requires there to be at least one fragment.
     *     |   /-2- ...
     *     \-1-+
     *         \-1- ...
     * ```
     * 
     * Note: The sentenceInfo and templateNodeIndex parameters are internally used for
     * recursion. They should not be used by the top-level caller, and their values or
     * names may be changed or they may be removed altogether without notice or a major
     * or minor version bump.
     * 
     * @param {Array<repr.Repr>} sentence The input sentence to match against the template.
     * @param {Array<repr.Repr>} template The template to match against.
     * @return {Array<Array<repr.Repr>>} The list of possible combinations of sentences
     *   (as Reprs).
     */
    getAllTemplateMatches(
            sentence,
            template,
            sentenceInfo = { nodeIndex: 0, strIndex: 0 }
    ) {
        /* 1) Zero-case (recursive base-case)
        -------------------- */

        // No template can match a zero-length sentence and no sentence can match a zero-length template.
        if (sentence.length === 0 || template.length === 0) return [];

        /* 2) Setup
        -------------------- */

        // Initialise return value
        const matches = [];

        // Initial sentence/template nodes
        let sentenceNode = sentence[sentenceInfo.nodeIndex];
        let templateNode = template[0]; // Try the first node (fragment or placeholder) initially

        /* 3) Initial node is a fragment - align remaining sentence to (placeholder, fragment) pairs
        -------------------- */

        // If template contains a fragment as the first (possibly only) node, then deal with it and slice it off
        // to align the remaining sentence to (placeholder, fragment) pairs. The last node being a placeholder
        // is dealt with in the next section.
        if (is.sentenceFragment(templateNode)) {
            // 3.1) Fail if not a sentence fragment (as it cannot match the template fragment)
            if (!is.sentenceFragment(sentenceNode)) return matches; // Ie. return empty array

            // 3.2) Attempt to match the first template fragment
            const newInitSentenceFragments = this.spliceTemplateFragment(
                templateNode, sentenceNode, sentenceInfo.strIndex
            );

            // 3.3) Fail if no match
            if (newInitSentenceFragments === null) return matches; // Ie. return empty array

            // 3.4) Reorganise the sentence into the consumed part and the remaining part
            const [
                initialSentenceFragment,
                remainingSentenceFragment
            ] = newInitSentenceFragments;

            // 3.5) Splice sentence into [fragment match (discarded), remaining nodes],
            //      excluding the remaining fragment if it has no content
            const remainingNodes = [
                ...(                                           // The part of the fragment after the template fragment match if not empty.
                    remainingSentenceFragment.content !== "" ?
                        [remainingSentenceFragment] :
                        []
                ),
                ...sentence.slice(sentenceInfo.nodeIndex + 1)  // Plus every node after this fragment node
            ];

            // 3.6) Fail if match is not at the first character
            if (initialSentenceFragment.content !== "") return matches; // Ie. return empty array

            // 3.7) Base Case: Return sentence as it stands
            const remainingNodesLength = remainingNodes.reduce((accum, node) => accum + node.length(), 0);
            if (remainingNodesLength === 0) return [[templateNode]];

            // 3.8) Recursive Case: Unary fork (second fork of binary fork only, as first fork will never match anything else)
                // Advance to next placeholder/fragment pair
            matches.push(
                ...this.getAllTemplateMatches(
                    remainingNodes,               // Check the remaining sentence nodes
                    template.slice(1),            // Slice off the matched template fragment
                    { nodeIndex: 0, strIndex: 0 } // Start looking at the beginning of the remaining sentence fragment
                ).reduce(
                    // eslint-disable-next-line no-loop-func -- the closure over templateNode is never used outside or across iterations of the loop
                    (accum, match) => {
                        accum.push([templateNode, ...match]); // Prepend the matched fragment to every sub-match
                        return accum;
                    },
                    []
                )
            );

            // 3.10) Return everything (this is the top-level return if this condition is hit)
            return matches;
        }

        /* 4. Final node is a placeholder - consume all remaining input
        -------------------- */

        // If there is not a corresponding template fragment for the last placeholder, then consume all remaining
        // input. If there is any remaining input, match it (a placeholder must match at least one 'thing' - a
        // single character of sentence fragment, or a literal or other node).
        if (template.length === 1) { // It must be a placeholder
            // Note: Not adding anything is equivalent to failing.
            const sentenceLength = sentence.reduce((accum, node) => accum + node.length(), 0)
            if (sentenceLength >= 1) {
                matches.push([new repr.Argument(sentence)]);
            }
            return matches;
        }

        /* 5. Nodes are (placeholder [n-1], fragment [n]) pairs - consume until match, then binary fork
        -------------------- */

        /*
        Now we have effectively stripped the leading fragment and trailing placeholder,
        the remaining input will be (placeholder, fragment) pairs, where the fragment is
        at index N and the placeholder at index N-1 in `template`.

        Next:
        - If we are matching a placeholder, then if the first node in the sentence is also
          a placeholder, then match it, binary fork, and return the matches.
        - If we are not matching a placeholder (whether by request or because one wasn't
          found), then consume all input until this template fragment (index N) matches,
          binary fork, and return the matches.
        */

        // Util
        const nextNode = () => {
            sentenceInfo.nodeIndex++;
            sentenceNode = sentence[sentenceInfo.nodeIndex]; // undefined if off the end of the sentence
            sentenceInfo.strIndex = is.sentenceFragment(sentenceNode) ? 0 : null;
        }

        // Try to match second node (fragment)
        templateNode = template[1]; // The fragment

        // 5.1) Keep consuming input until the first fragment match.
        let sentenceSplice = null;
        for (; sentenceInfo.nodeIndex < sentence.length; nextNode()) {
            // 5.2) If the node cannot match the fragment, skip it.
            if (!is.sentenceFragment(sentenceNode)) continue;

            // 5.3) Attempt to match the next template fragment
            sentenceSplice = this.spliceTemplateFragment(
                templateNode, sentenceNode, sentenceInfo.strIndex
            );

            // 5.4) If found a match, break out of the loop; If no match, iterate to next sentence node
            if (sentenceSplice !== null) break;
        }

        // 5.5) Fail if there were no matches in the rest of the sentence
        if (sentenceSplice === null) return matches;

        // 5.6) Reorganise the sentence into the consumed part and the remaining part
        const [
            initialSentenceFragment,
            remainingSentenceFragment,
            ,
            remainingStart
        ] = sentenceSplice;

        // 5.7) Determine next indexes (ie. the ones used in the first part of the binary fork)
        let nextNodeIndex = sentenceInfo.nodeIndex;
        let nextStrIndex = remainingStart;

        // If we've reached the end of the fragment, continue from the next node
        if (remainingSentenceFragment.content === "") {
            nextNodeIndex++;
            nextStrIndex = 0;
        }

        // 5.8) Splice sentence into [consumed nodes, fragment match (discarded), remaining nodes],
        //      excluding the initial/remaining fragments if they have no content
        const consumedNodes = [
            ...sentence.slice(0, sentenceInfo.nodeIndex), // Every node before this fragment node,
            ...(                                          // Plus the part of the fragment before the template fragment match if not empty.
                initialSentenceFragment.content !== "" ?
                    [initialSentenceFragment] :
                    []
            )
        ];

        const remainingNodes = [
            ...(                                           // The part of the fragment after the template fragment match if not empty.
                remainingSentenceFragment.content !== "" ?
                    [remainingSentenceFragment] :
                    []
            ),
            ...sentence.slice(sentenceInfo.nodeIndex + 1)  // Plus every node after this fragment node
        ];

        // 5.9) Fail if the placeholder match is a zero-length match
        const consumedNodesLength = consumedNodes.reduce((accum, node) => accum + node.length(), 0);
        if (consumedNodesLength === 0) return matches; // Did not match placeholder

        // 5.10) Construct Repr for this placeholder match
        const argument = new repr.Argument(consumedNodes);

        // 5.11) Base Case: Return sentence as it stands
        const remainingNodesLength = remainingNodes.reduce((accum, node) => accum + node.length(), 0);
        if (remainingNodesLength === 0) return [[argument, templateNode]];

        // 5.12) Recursive Case: Binary fork (as described above)
            // Continue checking for this fragment
        matches.push(
            ...this.getAllTemplateMatches(
                sentence, // Check the remaining sentence nodes
                template, // Keep looking for the same template fragment
                {         // Check from the beginning of the remaining sentence nodes
                    nodeIndex: nextNodeIndex,
                    strIndex: nextStrIndex
                }
            )
        );

            // Advance to next placeholder/fragment pair
        matches.push(
            ...this.getAllTemplateMatches(
                remainingNodes,               // Check the remaining sentence nodes
                template.slice(2),            // Slice off the matched template placeholder and fragment
                { nodeIndex: 0, strIndex: 0 } // Check from the beginning of the remaining sentence nodes
            ).reduce(
                // eslint-disable-next-line no-loop-func -- the closure over templateNode is never used outside or across iterations of the loop
                (accum, match) => {
                    accum.push([argument, templateNode, ...match]); // Prepend the matched fragment to every sub-match
                    return accum;
                },
                []
            )
        );

        /* 6) Return Everything
        -------------------- */

        return matches;
    }

    // Utility for getAllTemplateMatches()
    spliceTemplateFragment = (templateNode, sentenceNode, sentenceStartPos) => {
        // Try to parse template fragment out of sentence fragment node
        let matchPos = sentenceNode.content
            .substring(sentenceStartPos)   // Remove previously-consumed offset
            .indexOf(templateNode.content) // Find the value
        if (matchPos === -1) return null;  // Fail if not found
        matchPos += sentenceStartPos;      // Add previously-consumed offset back on

        // Splice out the matching part
        return [
            new repr.SentenceFragment(sentenceNode.content.substring(0, matchPos)),
            new repr.SentenceFragment(sentenceNode.content.substring(matchPos + templateNode.content.length)),
            matchPos,
            matchPos + templateNode.content.length
        ];
    }
}
