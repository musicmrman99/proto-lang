import Message from '../components/utils/Message';
import ProtoParserVisitor from './build/ProtoParserVisitor';

/* Representations
-------------------------------------------------- */

class Repr {}

/* Intermediate Representations
-------------------- */

class SentenceFragmentRepr extends Repr {
    constructor(content) {
        super();
        this.content = content;
    }

    length = () => this.content.length;
}
class SoftTerminatorRepr extends Repr {
    length = () => 0;
}

class AssociationOperatorRepr extends Repr {
    constructor(relation, remove) {
        super();
        this.relation = relation;
        this.remove = remove;
    }

    length = () => 3;
}

class DeclarationOperatorRepr extends Repr {
    length = () => 1;
}
class PlaceholderOperatorRepr extends Repr {
    length = () => 1;
}

// Used to represent arguments to a sentence template, ie. the
// values (or possibly sub-sentences) that fill in placeholders.
class ArgumentRepr extends Repr {
    constructor(children = []) {
        super();
        this.children = children;
    }

    length = () => this.children.length;
}

/* Final Representations
-------------------- */

class NumberRepr extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }

    length = () => this.value.toString().length;
}
class StringRepr extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }
    
    length = () => this.value.length + 2; // for the quotes
}
class LogicalRepr extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }

    length = () => this.value.toString().length;
}
class ParameterRepr extends Repr {
    constructor(index, extraction) {
        super();
        this.index = index;
        this.extraction = extraction;
    }

    length = () => 1 + this.index.toString().length + this.extraction.length();
}
class MapRepr extends Repr {
    constructor(children) {
        super();
        this.children = children;
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
}
class BlockRepr extends Repr {
    constructor(children) {
        super();
        this.children = children;
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
}

// AssociationRepr - not needed, because they're put into the containing map

class SentenceRepr extends Repr {
    constructor(ref, params) {
        super();
        this.ref = ref;
        this.params = params;
    }

    length = () => this.parts.reduce((accum, part) => accum + part.length(), 0);
}

class DeclarationRepr extends Repr {
    constructor(template, ref) {
        super();
        this.template = template;
        this.ref = ref;
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
}

/* Utils
-------------------- */

// Values
const isLiteral = (node) => (
    [
        NumberRepr,
        StringRepr,
        LogicalRepr,
        MapRepr,
        BlockRepr
    ].includes(node.constructor)
);
const isParameter = (node) => node.constructor === ParameterRepr;
const isValue = (node) => isLiteral(node) || isParameter(node);

// Sentences
const isArgument = (node) => node.constructor === ArgumentRepr;
const isSentence = (node) => node.constructor === SentenceRepr;
const isSentenceFragment = (node) => node.constructor === SentenceFragmentRepr;

// Declarations
const isPlaceholderOp = (node) => node.constructor === PlaceholderOperatorRepr;
const isDeclarationOp = (node) => node.constructor === DeclarationOperatorRepr;

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
        return new NumberRepr(parseFloat(
            whole.getText() +
            (point != null ? point.getText() : "") +
            (frac != null ? frac.getText() : "")
        ));
    }
	visitString_literal = (ctx) => new StringRepr(ctx.STRING_LITERAL().getText().substring(1, -1)); // Remove the quotes
	visitLogical_literal = (ctx) => new LogicalRepr(ctx.LOGICAL_LITERAL().getText() === "true");

    // Translate parameters into their AST representation
    // Note: Like basic literals, parameters can appear anywhere
    visitParameter = (ctx) => {
        const index = ctx.parameter_index();
        const extraction = ctx.parameter_extraction();
        return new ParameterRepr(
            index != null ? parseInt(index.getText()) : 1,
            extraction != null ? this.visitMap_literal(extraction.map_literal()) : []
        );
    }

    /* Pre-Sentence Parsing Representations
    -------------------- */

    // Translate sentence_fragment and the various syntactic operators
    // into their pre-sentence parsing AST representations.

        // Type.SENTENCE has a `ref` too (and its `content` is different)
    visitSentence_fragment = (ctx) => new SentenceFragmentRepr(ctx.getText());
        // Type.DECLARATION has a `template` and `ref` too
    visitDeclaration_operator = () => new DeclarationOperatorRepr();
    visitPlaceholder_operator = () => new PlaceholderOperatorRepr();
    visitAssociation_operator = (ctx) => new AssociationOperatorRepr(
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
    visitNewline = () => new SoftTerminatorRepr();

    // Program (entry point) and Compound Literals
    visitProgram = (ctx) => new BlockRepr(this.parseSentenceDeclContext(ctx));
    visitBlock_literal = (ctx) => new BlockRepr(this.parseSentenceDeclContext(ctx));
    visitMap_literal = (ctx) => new MapRepr(this.parseSentenceExprContext(ctx));

    /* Sentence Parsing Algorithm
    -------------------- */

    parseSentenceDeclContext = (ctx) => {
        ctx.decls = [
            new DeclarationRepr(
                [
                    new SentenceFragmentRepr("Hello "),
                    new PlaceholderOperatorRepr(),
                    new SentenceFragmentRepr(".")
                ],
                new StringRepr("hello |.")
            ),
            new DeclarationRepr(
                [
                    new SentenceFragmentRepr("Mr "),
                    new PlaceholderOperatorRepr()
                ],
                new StringRepr("mr |")
            ),
            new DeclarationRepr(
                [
                    new SentenceFragmentRepr("Logan")
                ],
                new StringRepr("logan")
            ),
            new DeclarationRepr(
                [
                    new PlaceholderOperatorRepr(),
                    new SentenceFragmentRepr(" + "),
                    new PlaceholderOperatorRepr()
                ],
                new StringRepr("| + |")
            )
        ];

        let children = this.getNormalisedChildren(ctx);
        return this.parseSentences(ctx, children, ["declaration"]);
    }

    parseSentenceExprContext = (ctx) => {
        let children = this.getNormalisedChildren(ctx);
        return this.parseSentences(ctx, children, ["assocation"]);
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
                newChildren.push(new SentenceFragmentRepr(
                    mergedSentenceFragment
                        .map((sentenceFragment) => sentenceFragment.content)
                        .join("")
                ));
                mergedSentenceFragment = [];
            }
        };

        // Merge adjacent sentence fragments
        for (const child of children) {
            if (child instanceof SentenceFragmentRepr) {
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
     * Parses all sentences and any additional features specified from the given
     * children, given the context.
     * 
     * @param {Object} ctx The context object provided by ANTLR Runtime.
     * @param {Array<Repr>} children The children to parse into sentences (and
     *   other things).
     * @param {Array<String>} additionalFeatures An array of strings indicating
     *   which features in addition to sentences are allowed to be interpreted
     *   in this context. The following features are supported:
     *   - "declaration" - Parses any declarations it finds.
     * @returns {Array<SentenceRepr|DeclarationRepr|LiteralRepr>}
     */
    parseSentences = (ctx, children, additionalFeatures) => {
        /*
        Details of the algorithm:

        +--------------------------------------------------------------------------------------+
        |                                    |                     Effect                      |
        +              Symbol(s)             +-------------------------------------------------+
        |                                    |          Expr          |          Decl          |
        |--------------------------------------------------------------------------------------|
        | fragment                           | buffer + continue      | buffer + continue      |
        | number, string, logical, parameter | hard nesting           | ERROR                  |
        | map, block                         | hard nesting           | ERROR                  |
        | association operator               | hard terminator (expr) | ERROR                  |
        | soft terminator                    | soft terminator        | ERROR                  |
        | placeholder operator               | ERROR                  | placeholder            |
        | declaration operator               | ERROR                  | hard terminator (decl) |
        +--------------------------------------------------------------------------------------+

        "Effect" Key
        --------------------

        Base:
        - buffer + continue      - Add to the list of candidate nodes, then move to next token.
        - hard nesting           - Must either appear on its own, or fit into a placeholder as
                                   a sentence argument.
        - soft terminator        - May terminate the sentence. If it doesn't, keep parsing.
        - hard terminator (expr) - Must terminate the sentence and produce a SentenceRepr as a
                                   new child of the current context. If it doesn't terminate
                                   the sentence, then error.

        Additional Features:
        - hard terminator(decl) - Terminates the sentence template and produces a
                                  DeclarationRepr. If the value/sentence after the declaration
                                  point is incomplete or otherwise invalid, then error.
                                  Requires the "declaration" additional feature.
        - placeholder           - Represents itself. Requires the "declaration" additional
                                  feature.
        */

        const allDecls = this.getDeclarations(ctx);
        const finalChildren = [];

        // Set up variables and utilities
        let candidateNodes = [];
        const terminateSentence = (isHardTerminator) => {
            const sentence = this.parseSentence(candidateNodes, allDecls);
            if (sentence !== null) {
                finalChildren.push(sentence);
            } else if (isHardTerminator) {
                this.log.success = false;
                this.log.output.push(
                    <Message type="error">
                        Incomplete Sentence: `{candidateNodes.toString()}`
                    </Message>
                );
            }
            candidateNodes = [];
        }

        // Parse Children
        for (const child of children) {
            let isHardTerminator = false;
            switch (child.constructor) {
                case AssociationOperatorRepr:
                    if (!additionalFeatures.includes("association")) {
                        candidateNodes.push(child);
                        this.log.success = false;
                        this.log.output.push(
                            <Message type="error">
                                Association operator found outside of a map (at end of `{candidateNodes.toString()}`)
                            </Message>
                        );
                        return []; // No children
                    }

                    isHardTerminator = true;
                    // fallthrough

                case SoftTerminatorRepr:
                    // Flush previous sentence (up to this point) to final children and drop the soft terminator
                    terminateSentence(isHardTerminator);
                    break;

                // TODO: Deal with placeholders and declarations later (ie. mode switching).

                default:
                    candidateNodes.push(child);
            }
        }

        // The end of the sentence parsing context is another hard terminator,
        // but ignore it if we only just terminated the last sentence.
        if (candidateNodes.length > 0) terminateSentence(true);

        // Return children
        return finalChildren;
    }

    /**
     * Try to create a SentenceRepr from the given set of nodes.
     * 
     * Return null if the sentence is incomplete.
     * 
     * @param {Array<Repr>} sentence The sentence to parse.
     * @param {Array<DeclarationRepr>} allDecls An array containing all in-scope
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

        log("Sentence: " + JSON.stringify(sentence));

        // 1) If it's a value (literal or parameter), return it directly (no sentence parsing).
        if (sentence.length === 1 && isValue(sentence[0])) {
            return sentence[0];
        }

        // 2) Get a list of all possible matches of a sentence template (as an array of
        //    [decl, [Repr, ...]] pairs), ignoring recursion.
        log("In-Scope Declarations:");
        allDecls.forEach(decl => log("| "+JSON.stringify(decl.template)));

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

        // 3) For each sentence candidate, try to get a match. First match is the best match of this sentence.
        log("Match Declaration Candidates:");
        for (const [decl, sentenceCandidate] of sortedTemplateMatches) {
            // 3.1) Recursive Case: Try to parse each argument of the sentence (to get the
            //      best matching sub-sentence) to form a full sentence.
            let fullSentence = new SentenceRepr(decl.ref, []);
            for (const node of sentenceCandidate) {
                if (node === null) {
                    fullSentence = null;
                    break;

                } else if (isArgument(node)) {
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

            // 3.2) If it makes a full sentence, return it (the first full sentence found wins)
            if (isSentence(fullSentence)) {
                log(JSON.stringify(decl.template) + " -- MATCH");
                return fullSentence;
            } else {
                log(JSON.stringify(decl.template) + " -- NO MATCH");
            }
        }

        // 4) Base Case: No matching sentence found
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
        if (isSentenceFragment(templateNode)) {
            // 3.1) Fail if not a sentence fragment (as it cannot match the template fragment)
            if (!isSentenceFragment(sentenceNode)) return matches; // Ie. return empty array

            // 3.2) Attempt to match the first template fragment
            const newInitSentenceFragments = this.spliceTemplateFragment(
                templateNode, sentenceNode, sentenceInfo.strIndex
            );

            // 3.3) Fail if no match
            if (newInitSentenceFragments === null) return matches; // Ie. return empty array

            // 3.4) Reorganise the sentence into the consumed part and the remaining part
            const [initialSentenceFragment, remainingSentenceFragment] = newInitSentenceFragments;

            const remainingNodes = [
                ...(                                           // The part of the fragment after the template fragment match if not empty,
                    remainingSentenceFragment.content !== "" ?
                        [remainingSentenceFragment] :
                        [] // Exclude remaining fragment if it has no content
                ),
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
                    remainingNodes,              // Check the remaining sentence nodes
                    template.slice(),            // Keep looking for the same template fragment
                    { nodeIndex: 0, nodePos: 0 } // Check from the beginning of the remaining sentence nodes
                ).map(
                    (match) => [templateNode, ...match] // Prepend the matched fragment to every sub-match
                )
            );

                // Advance to next placeholder/fragment pair
            matches.push(
                ...this.getAllTemplateMatches(
                    remainingNodes,               // Check the remaining sentence nodes
                    template.slice(1),            // Slice off the matched template fragment
                    { nodeIndex: 0, strIndex: 0 } // Start looking at the beginning of the remaining sentence fragment
                ).map(
                    (match) => [templateNode, ...match] // Prepend the matched fragment to every sub-match
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
                matches.push([new ArgumentRepr(remainingNodes)]);
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
        let newInitSentenceFragments = null;
        while (sentenceInfo.nodeIndex < sentence.length) {
            // Update sentence/template node variables
            sentenceNode = sentence[sentenceInfo.nodeIndex];
            templateNode = template[1]; // The fragment
            sentenceInfo.strIndex = isSentenceFragment(sentenceNode) ? 0 : null;

            // 5.1) If not a sentence fragment, it cannot match the template fragment, so skip it.
            if (!isSentenceFragment(sentenceNode)) {
                sentenceInfo.nodeIndex++;
                continue;
            }

            // 5.2) Attempt to match the next template fragment
            newInitSentenceFragments = this.spliceTemplateFragment(
                templateNode, sentenceNode, sentenceInfo.strIndex
            );

            // 5.3) If no match, iterate to next sentence node; if found a match, continue out of the loop.
            if (newInitSentenceFragments === null) {
                sentenceInfo.nodeIndex++;
                continue;
            } else {
                break;
            }
        }

        // 5.4) Fail if there were no matches in the rest of the sentence
        if (newInitSentenceFragments === null) return matches;

        // 5.5) Reorganise the sentence into the consumed part and the remaining part
        const [initialSentenceFragment, remainingSentenceFragment] = newInitSentenceFragments;

        const consumedNodes = [
            ...sentence.slice(0, sentenceInfo.nodeIndex), // Every node before this fragment node,
            ...(                                          // Plus the part of the fragment before the template fragment match if not empty.
                initialSentenceFragment.content !== "" ?
                    [initialSentenceFragment] :
                    []
            )
        ];

        const remainingNodes = [
            ...(                                           // The part of the fragment after the template fragment match if not empty,
                remainingSentenceFragment.content !== "" ?
                    [remainingSentenceFragment] :
                    [] // Exclude remaining fragment if it has no content
            ),
            ...sentence.slice(sentenceInfo.nodeIndex + 1)  // Every node after this fragment node
        ];

        // 5.6) Fail if the placeholder match is a zero-length match
        const consumedNodesLength = consumedNodes.reduce((accum, node) => accum + node.length(), 0);
        if (consumedNodesLength === 0) {
            return matches; // Did not match placeholder
        }

        // 5.7) Construct Repr for this placeholder match
        const argument = new ArgumentRepr(consumedNodes);

        // 5.8) Base Case: Return sentence as it stands
        const remainingNodesLength = remainingNodes.reduce((accum, node) => accum + node.length(), 0);
        if (remainingNodesLength === 0) return [[argument, templateNode]];

        // 5.9) Recursive Case: Binary fork (as described above)
            // Continue checking for this fragment
        matches.push(
            ...this.getAllTemplateMatches(
                remainingNodes,              // Check the remaining sentence nodes
                template.slice(),            // Keep looking for the same template fragment
                { nodeIndex: 0, nodePos: 0 } // Check from the beginning of the remaining sentence nodes
            ).map(
                // eslint-disable-next-line no-loop-func -- the closure over templateNode is never used outside or across iterations of the loop
                (match) => [argument, templateNode, ...match] // Prepend the matched argument and fragment to every sub-match
            )
        );

            // Advance to next placeholder/fragment pair
        matches.push(
            ...this.getAllTemplateMatches(
                remainingNodes,               // Check the remaining sentence nodes
                template.slice(2),            // Slice off the matched template placeholder and fragment
                { nodeIndex: 0, strIndex: 0 } // Check from the beginning of the remaining sentence nodes
            ).map(
                // eslint-disable-next-line no-loop-func -- the closure over templateNode is never used outside or across iterations of the loop
                (match) => [argument, templateNode, ...match] // Prepend the matched fragment to every sub-match
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
            new SentenceFragmentRepr(sentenceNode.content.substring(0, matchPos)),
            new SentenceFragmentRepr(sentenceNode.content.substring(matchPos + templateNode.content.length))
        ];
    }

    // Return a flattened object containing a mapping of all sentence template
    // declarations in the given lexical scope (context) to their bound ref objects.
    getDeclarations = (ctx) => {
        // Base case (above the top namespace = no decls)
        if (ctx == null) return [];

        // Recursive case
        const decls = [...this.getDeclarations(ctx.parentCtx)]; // Add decls of parent namespaces.
        if (ctx.decls != null) decls.push(...ctx.decls);        // Then, if a namespace yourself, add your decls (possibly hiding parent decls).
        return decls;
    }

    /* Utils
    -------------------------------------------------- */

    //

    /*
    Remaining:

  | map_literal
  | block_literal

    association_operator (map only)
  | declaration_operator
  | placeholder_operator

  | sentence_fragment
    */
}
