import Message from '../components/utils/Message';
import ProtoParserVisitor from './build/ProtoParserVisitor';

import { repr, is, format } from './Representations';

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
    visitMap_expression_atom = (ctx) => this.visitChildren(ctx)[0];

    /* Basic Literals
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
	visitString_literal = (ctx) => new repr.String(ctx.STRING_LITERAL().getText().slice(1, -1)); // Remove the quotes
	visitLogical_literal = (ctx) => new repr.Logical(ctx.LOGICAL_LITERAL().getText() === "true");

    // Translate parameters into their AST representation
    // Note: Like basic literals, parameters can appear anywhere
    visitParameter = (ctx) => {
        const index = ctx.parameter_index();
        const extraction = ctx.parameter_extraction();
        return new repr.Parameter(
            index != null ? parseInt(index.getText()) : 1,
            extraction != null ? this.visitMap_literal(extraction.map_literal()) : new repr.Map([])
        );
    }

    /* Pre-Sentence Parsing Representations
    -------------------- */

    // Translate sentence_fragment and the various syntactic operators
    // into their pre-sentence parsing AST representations.

        // Type.SENTENCE has a `ref` too (and its `content` is different)
    visitSentence_fragment = (ctx) => new repr.SentenceFragment(ctx.getText());
        // Type.DECLARATION has a `template` and `ref` too
    visitDeclaration_operator = () => new repr.DeclarationOperator();
    visitPlaceholder_operator = () => new repr.PlaceholderOperator();
    visitAssociation_operator = (ctx) => new repr.AssociationOperator(
        // Relation
        {
            // List all of them, as the symbols might change in future in a way
            // that string manipulation won't work, eg. `---` becomes `--`, and
            // `-->` becomes `->`. `<->` and `</>` may also be removed.
            "---": { leftDir: true, rightDir: true },
            "<->": { leftDir: true, rightDir: true },
            "-->": { leftDir: false, rightDir: true },
            "<--": { leftDir: true, rightDir: false },
            "-/-": { leftDir: true, rightDir: true },
            "</>": { leftDir: true, rightDir: true },
            "-/>": { leftDir: false, rightDir: true },
            "</-": { leftDir: true, rightDir: false },
        }[ctx.ASSOCIATION().getText()],

        // Is remove relation?
        ctx.ASSOCIATION().getText().includes("/")
    );

    /* Sentence Parsing Contexts
    -------------------- */

    // Translate newline -> SOFT_TERMINATOR
    visitNewline = () => new repr.SoftTerminator();

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
        this.parseSentences(root);
        return root;
    };
    visitBlock_literal = (ctx) => this.parseBlock(ctx);
    visitMap_literal = (ctx) => this.parseMap(ctx);

    /* Sentence Parsing Algorithm
    -------------------- */

    parseBlock = (ctx) => {
        const parent = new repr.Block([]);
        parent.decls = [];
        parent.children = this.getNormalisedChildren(ctx);
        parent.children.filter(is.nestable).forEach((child) => child.parent = parent);
        return parent;
    }

    parseMap = (ctx) => {
        const parent = new repr.Map([]);
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
            if (child instanceof repr.SentenceFragment) {
                mergedSentenceFragment.push(child);
            } else {
                pushMergedSentenceFragment();
                newChildren.push(child);
            }
        }
        pushMergedSentenceFragment();

        return newChildren;
    }

    /**
     * Parses all sentences and any additional features relevant to the node
     * type from the children.
     * 
     * @param {repr.Map|repr.Block} nestableNode The representation of the nestable
     *   node in which to parse sentences. Its children will be replaced by the
     *   parsed sentences.
     */
    parseSentences = (nestableNode) => {
        /*
        Details of the algorithm:

        +-----------------------------------------------------------------------------+
        |                                    |                 Effect                 |
        +              Symbol(s)             +----------------------------------------+
        |                                    |        Expr        |        Decl       |
        |-----------------------------------------------------------------------------|
        | fragment                           | buffer + continue  | buffer + continue |
        | number, string, logical, parameter | hard nesting       | ERROR             |
        | map, block                         | hard nesting       | ERROR             |
        | association operator               | hard terminator    | ERROR             |
        | soft terminator                    | soft terminator    | ERROR             |
        | placeholder operator               | ERROR              | placeholder       |
        | declaration operator               | ERROR              | terminator (decl) |
        +-----------------------------------------------------------------------------+

        "Effect" Key
        --------------------

        Base:
        - buffer + continue - Add to the list of candidate nodes, then move to next token.
        - hard nesting      - Must either appear on its own, or fit into a placeholder as
                              a sentence argument.
        - soft terminator   - May terminate the sentence. If it doesn't, keep parsing.
        - hard terminator   - Must terminate the sentence and produce a Sentence as a
                              new child of the current context. If it doesn't terminate
                              the sentence, then error.

        Additional Features:
        - terminator (decl) - Terminates the sentence template and produces a Declaration.
                              If the value/sentence after the declaration point is
                              incomplete or otherwise invalid, then error.
                              Requires the "declaration" additional feature.
        - placeholder       - Represents itself. Requires the "declaration" additional
                              feature.
        */

        // The collection of all declarations lexically 'above' this nestable node.
        const outerDecls = this.getDeclarations(nestableNode.parent);

        // Value is:
        // - true if a declaration operator is allowed next.
        // - false if a declaration operator is not allowed next.
        // - a repr.Declaration if next complete sentence is the value of a decl.
        let declTemplate = is.hasDeclarations(nestableNode);

        // Utility for the previous one. If it's not boolean, then it must be the
        // relevant Repr.
        const isImpossible = (value) => value === false;
        const isPossible = (value) => value === true;
        const isActual = (value) => value !== true && value !== false;

        // A buffer for collected nodes until a valid syntactic construct is found
        // (eg. a complete sentence, declaration operator, association operator, etc.),
        // or until this sentence-parsing context's content is judged to be malformed.
        let candidateNodes = [];

        // The collation of all valid sentences.
        const finalChildren = [];

        /**
         * Utility (must be done for each soft/hard terminator, including the implicit one
         * at the end of the context).
         * 
         * Check if nodes up to this point form a complete sentence based on all
         * outer declarations and all declarations in this scope so far, and if
         * so, flush the sentence to final children.
         */
        const terminateSentence = (isHardTerminator) => {
            const sentence = this.parseSentence(candidateNodes, outerDecls.concat(nestableNode.decls != null ? nestableNode.decls : []));
            if (sentence !== null) {
                if (isActual(declTemplate)) {
                    const decl = new repr.Declaration(declTemplate, sentence);
                    nestableNode.decls.push(decl);
                    declTemplate = true;

                    this.log.output.push(<Message type="info">New Declaration: {decl.toString()}</Message>);

                } else {
                    finalChildren.push(sentence);

                    this.log.output.push(<Message type="info">New Sentence: {sentence.toString()}</Message>);
                }

                // Parse nested nodes (recurse into non-nestable child nodes as needed).
                //
                // Doing it here - after the Declaration has been added to this namespace,
                // and not during sentence parsing - makes this language support recursive
                // blocks without faffing with mutable maps.
                // 
                // The alternative, eg. define a sentence template as an empty mutable map,
                // then add a block to it that references the sentence template - the sentence
                // template will exist by the time the block is defined, and the map will
                // contain the block by the time the block is run.
                this.parseNestedNodes(sentence);

                candidateNodes = [];

            } else if (isHardTerminator) {
                this.log.success = false;
                this.log.output.push(
                    <Message type="error">
                        Incomplete Sentence: {format.nodeListToString(candidateNodes)}
                    </Message>
                );
            }
        }

        // Parse Children
        for (const child of nestableNode.children) {
            let isHardTerminator = false;

            if (is.declarationOp(child)) {
                // Both 'defs not supported'/'multi-line template' (isImpossible())
                // and 'decl in def' (isActual()) are invalid.
                if (!isPossible(declTemplate)) {
                    candidateNodes.push(child); // Push the decl operator for the error
                    this.log.success = false;

                    // Error messages - be precise
                    if (!is.hasDeclarations(nestableNode)) {
                        this.log.output.push(
                            <Message type="error">
                                Declaration operator found outside of a block (at the end of {format.nodeListToString(candidateNodes)})
                            </Message>
                        );
                    } else if (isImpossible(declTemplate)) {
                        this.log.output.push(
                            <Message type="error">
                                Multi-line sentence templates are not supported ({format.nodeListToString(candidateNodes)})
                            </Message>
                        );
                    } else {
                        this.log.output.push(
                            <Message type="error">
                                Declaration operator found inside of another declaration's value (at end of {format.nodeListToString(candidateNodes)})
                            </Message>
                        );
                        this.log.output.push(
                            <Message type="info">Declaration chaining is not supported.</Message>
                        );
                    }

                    return []; // Block/map content is malformed - no children
                }

                // Templates consisting of only placeholders are invalid
                if (!candidateNodes.some(is.sentenceFragment)) {
                    this.log.success = false;
                    this.log.output.push(
                        <Message type="error">
                            Sentence templates consists only of placeholders ({format.nodeListToString(candidateNodes)})
                        </Message>
                    );
                    return []; // Block/map content is malformed - no children
                }

                // Templates may only contain fragments and placeholders
                else if (!candidateNodes.every(
                    (node) => is.sentenceFragment(node) || is.placeholderOp(node)
                )) {
                    this.log.success = false;
                    this.log.output.push(
                        <Message type="error">
                            Sentence templates must not consist only of placeholders ({format.nodeListToString(candidateNodes)})
                        </Message>
                    );
                    return []; // Block/map content is malformed - no children
                }

                declTemplate = candidateNodes;
                candidateNodes = [];

            } else if (is.terminator(child)) {
                if (is.associationOp(child)) isHardTerminator = true;

                // Drop the soft terminator itself (ie. don't push it to candidate nodes)

                terminateSentence(isHardTerminator);

            } else {
                // Otherwise, keep the input and continue
                candidateNodes.push(child);
            }
        }

        // The end of the sentence parsing context is an implicit hard terminator,
        // but ignore it if we only just terminated the last sentence.
        if (candidateNodes.length > 0) terminateSentence(true);

        // Assign transformed children
        nestableNode.children = finalChildren;
    }

    /**
     * Parse the sentences of the given nestable node, or all nestable nodes
     * found within the given node.
     * 
     * Recurses into any non-nestable non-terminal nodes to find nestable nodes.
     * Assumes that all applicable declarations in parents (and the 'current'
     * declaration, if applicable) have been created for the nestable node's
     * sentences to match against.
     * 
     * @param {Repr} node The node to recursively search for nestable nodes (maps
     *   and blocks).
     */
    parseNestedNodes = (node) => {
        // Note: this is above parseSentence(), regardless of the order of usage,
        //       because it's related to high-level processing of nodes.

        // Base case
        if (is.nestable(node)) {
            let nestableNode = node;
            // A parameter has-a Map, not is-a Map, so special-case it
            if (is.parameter(node)) nestableNode = node.extraction;

            this.parseSentences(nestableNode);
        }

        // Recursive case
        if (is.sentence(node)) {
            for (const param of node.params) {
                this.parseNestedNodes(param);
            }
        }

        // Nothing to parse (eg. a non-nestable literal).
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
            this.log.output.push(<Message type="info">{indentStr}{message}</Message>);
        };

        log("Parse Sentence: " + format.nodeListToString(sentence));

        // 1) If it's a value (literal or parameter), return it directly (no sentence parsing).
        if (sentence.length === 1 && is.value(sentence[0])) {
            return sentence[0];
        }

        // 1) Get a list of all possible matches of a sentence template (as an array of
        //    [decl, [Repr, ...]] pairs), ignoring recursion.
        log("In-Scope Declarations:");
        allDecls.forEach(decl => log(decl.toString()));

        const sortedTemplateMatches = allDecls
            // Merge the lists of template matches for each declaration, while preserving the matched declaration
            .reduce((allSentenceCandidates, decl) => {
                this.getAllTemplateMatches(sentence, decl.template).forEach(
                    sentenceCandidate => allSentenceCandidates.push([decl, sentenceCandidate])
                );
                return allSentenceCandidates;
            }, [])
            // Remove non-matching declarations
            .filter(([_, sentenceCandidate]) => sentenceCandidate.length !== 0);

        // 2) For each sentence candidate, try to get a match. First match is the best match of this sentence.
        log("Match Against Declarations:");
        for (const [decl, sentenceCandidate] of sortedTemplateMatches) {
            // 2.1) Recursive Case: Try to parse each argument of the sentence (to get the
            //      best matching sub-sentence) to form a full sentence.
            let fullSentence = new repr.Sentence(decl.ref, []);
            for (const node of sentenceCandidate) {
                if (node === null) {
                    fullSentence = null;
                    break;

                } else if (is.argument(node)) {
                    const parsedSentence = this.parseSentence(node.children, allDecls, indent + 2);
                    if (parsedSentence !== null) {
                        fullSentence.params.push(parsedSentence)

                    // If any argument could not be parsed (ie. had no matching sentence template),
                    // then skip this sentence candidate.
                    } else {
                        fullSentence = null;
                        break;
                    }
                }
            }

            // 2.2) If it makes a full sentence, return it (the first full sentence found wins)
            if (is.sentence(fullSentence)) {
                log(decl + " -- MATCH");
                return fullSentence;
            } else {
                log(decl + " -- NO MATCH");
            }
        }

        // 3) Base Case: No matching sentence found
        return null;
    }

    /**
    Match the given sentence to the given template.

    Uses a recursive implementation. Upon finding a match against the current
    template fragment, it recurses twice (a "binary fork") with different
    parameters to try to find:

    1) The next match of this fragment.
    2) The first match of the next fragment after the position of this
       match of this fragment.

    Ie. (where the number (-N-) represents trying to find a match for the Nth
    fragment in the template):

    ```txt
            /-3- ...
        /-2-+
        |   \-2- ...
    -1-+            <-- Note: This requires there to be at least one fragment.
        |   /-2- ...
        \-1-+
            \-1- ...
    ```

    Note: The sentenceInfo and templateNodeIndex parameters are internally used for
    recursion. They should not be used by the top-level caller, and their values or
    names may be changed or they may be removed altogether without notice or a major
    or minor version bump.

    @param {array<Repr>} sentence The input sentence to match against the template.
    @param {array<Repr>} template The template to match against.
    @return {array<array<Repr>>} The list of possible combinations of sentences
      (as Reprs).
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
        // to align the remaining sentence to (placeholder, fragment) pairs. The last item being a placeholder
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
                remainingSentenceFragment,
                ,
                remainingStart
            ] = newInitSentenceFragments;

            // These are needed for the first part of the binary fork
            let nextNodeIndex = sentenceInfo.nodeIndex;
            let nextStrIndex = remainingStart;

            // The part of the fragment after the template fragment match, if not empty
            let remainingSentenceFragmentList = []; // Exclude remaining fragment if it has no content
            if (remainingSentenceFragment.content !== "") {
                remainingSentenceFragmentList = [remainingSentenceFragment];
            } else {
                // If we've reached the end of the fragment, start at the next node
                nextNodeIndex++;
                nextStrIndex = 0;
            }
            const remainingNodes = [
                ...remainingSentenceFragmentList,
                ...sentence.slice(sentenceInfo.nodeIndex + 1)  // Every node after this fragment node
            ];

            // 3.5) Fail if match is not at the first character
            if (initialSentenceFragment.content !== "") return matches; // Ie. return empty array

            // 3.6) Base Case: Return sentence as it stands
            const remainingNodesLength = remainingNodes.reduce((accum, node) => accum + node.length(), 0);
            if (remainingNodesLength === 0) return [[templateNode]];

            // 3.7) Recursive Case: Binary fork (as described above)
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

            // 3.6) Return everything (this is the top-level return if this condition is hit)
            return matches;
        }

        /* 4. Final node is a placeholder - consume all remaining input
        -------------------- */

        // If there is not a corresponding template fragment for the last placeholder, then consume all remaining
        // input. If there is any remaining input, match it (a placeholder must match at least one 'thing' - a
        // single character of sentence fragment, or a literal or other node).
        if (template.length <= 1) { // 2+ nodes required (placeholder, fragment)
            const remainingNodes = sentence.slice(sentenceInfo.nodeIndex);
            const remainingNodesLength = remainingNodes.reduce((accum, node) => accum + node.length(), 0)
            if (remainingNodesLength >= 1) {
                matches.push([new repr.Argument(remainingNodes)]);
            }
            return matches;
        }

        /* 5. Nodes are (placeholder [n-1], fragment [n]) pairs - consume until match, then binary fork
        -------------------- */

        /*
        Now we have effectively stripped the leading fragment and trailing placeholder,
        the remaining input will be (placeholder, fragment) pairs, where the fragment is
        at index N and the placeholder at index N-1 in `template`.

        Next, consume all input until this template fragment (index N) matches, then
        binary fork & return the matches.
        */

        // Keep consuming input until the first fragment match
        let sentenceSplice = null;
        while (sentenceInfo.nodeIndex < sentence.length) {
            // Update sentence/template node variables
            sentenceNode = sentence[sentenceInfo.nodeIndex];
            templateNode = template[1]; // The fragment
            sentenceInfo.strIndex = is.sentenceFragment(sentenceNode) ? 0 : null;

            // 5.1) If not a sentence fragment, it cannot match the template fragment, so skip it.
            if (!is.sentenceFragment(sentenceNode)) {
                sentenceInfo.nodeIndex++;
                continue;
            }

            // 5.2) Attempt to match the next template fragment
            sentenceSplice = this.spliceTemplateFragment(
                templateNode, sentenceNode, sentenceInfo.strIndex
            );

            // 5.3) If no match, iterate to next sentence node; if found a match, continue out of the loop.
            if (sentenceSplice === null) {
                sentenceInfo.nodeIndex++;
                continue;
            } else {
                break;
            }
        }

        // 5.4) Fail if there were no matches in the rest of the sentence
        if (sentenceSplice === null) return matches;

        // 5.5) Reorganise the sentence into the consumed part and the remaining part
        const [
            initialSentenceFragment,
            remainingSentenceFragment,
            ,
            remainingStart
        ] = sentenceSplice;

        const consumedNodes = [
            ...sentence.slice(0, sentenceInfo.nodeIndex), // Every node before this fragment node,
            ...(                                          // Plus the part of the fragment before the template fragment match if not empty.
                initialSentenceFragment.content !== "" ?
                    [initialSentenceFragment] :
                    []
            )
        ];

        // These are needed for the first part of the binary fork
        let nextNodeIndex = sentenceInfo.nodeIndex;
        let nextStrIndex = remainingStart;

        // The part of the fragment after the template fragment match, if not empty
        let remainingSentenceFragmentList = []; // Exclude remaining fragment if it has no content
        if (remainingSentenceFragment.content !== "") {
            remainingSentenceFragmentList = [remainingSentenceFragment];
        } else {
            // If we've reached the end of the fragment, start at the next node
            nextNodeIndex++;
            nextStrIndex = 0;
        }
        const remainingNodes = [
            ...remainingSentenceFragmentList,
            ...sentence.slice(sentenceInfo.nodeIndex + 1)  // Every node after this fragment node
        ];

        // 5.6) Fail if the placeholder match is a zero-length match
        const consumedNodesLength = consumedNodes.reduce((accum, node) => accum + node.length(), 0);
        if (consumedNodesLength === 0) {
            return matches; // Did not match placeholder
        }

        // 5.7) Construct Repr for this placeholder match
        const argument = new repr.Argument(consumedNodes);

        // 5.8) Base Case: Return sentence as it stands
        const remainingNodesLength = remainingNodes.reduce((accum, node) => accum + node.length(), 0);
        if (remainingNodesLength === 0) return [[argument, templateNode]];

        // 5.9) Recursive Case: Binary fork (as described above)
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

    // Utilities for getAllTemplateMatches()

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

    // Return a flattened list of all declarations in the given lexical scope
    // (nestable node). A declaration is a mapping of a sentence template to
    // a bound ref object.
    getDeclarations = (nestableNode) => {
        // Base case (above the top namespace = no decls)
        if (nestableNode == null) return [];

        // Recursive case
        const decls = [...this.getDeclarations(nestableNode.parent)];            // Add decls of parent namespaces.
        if (is.hasDeclarations(nestableNode)) decls.push(...nestableNode.decls); // Then, if a namespace yourself, add your decls (possibly hiding parent decls).
        return decls;
    }
}
