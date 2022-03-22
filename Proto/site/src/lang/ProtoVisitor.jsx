import Message from '../components/utils/Message';
import ProtoParserVisitor from './build/ProtoParserVisitor';

// Repr
class Repr {}

// Intermediate Representations
class SentenceFragmentRepr extends Repr {
    constructor(content) {
        super();
        this.content = content;
    }
}
class SoftTerminatorRepr extends Repr {}

class AssociationOperatorRepr extends Repr {
    constructor(relation, remove) {
        super();
        this.relation = relation;
        this.remove = remove;
    }
}
class DeclarationOperatorRepr extends Repr {}
class PlaceholderOperatorRepr extends Repr {}

// Final Representations
class NumberRepr extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }
}
class StringRepr extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }
}
class LogicalRepr extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }
}
class ParameterRepr extends Repr {
    constructor(index, extraction) {
        super();
        this.index = index;
        this.extraction = extraction;
    }
}
class MapRepr extends Repr {
    constructor(children) {
        super();
        this.children = children;
    }
}
class BlockRepr extends Repr {
    constructor(children) {
        super();
        this.children = children;
    }
}

// AssociationRepr - not sure what this will have yet

class SentenceRepr extends Repr {
    constructor(ref, params) {
        super();
        this.ref = ref;
        this.params = params;
    }
}
class DeclarationRepr extends Repr {
    constructor(template, ref) {
        super();
        this.template = template;
        this.ref = ref;
    }
}

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
	visitString_literal = (ctx) => new StringRepr(ctx.STRING_LITERAL().getText());
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
        ctx.decls = {
            "hello | b | c | d | e | f": 5  // TEMPORARY
        };
        return this.parseSentenceContext(ctx);
    }

    parseSentenceExprContext = (ctx) => {
        return this.parseSentenceContext(ctx);
    }

    parseSentenceContext = (ctx) => {
        // Get raw children
        let children = this.visitChildren(ctx) // Expressions -> their values / representations
            .filter((child) => child != null); // Remove EOF, `{`, `}`, `[`, `]`, and dropped nodes

        // Merge sentence fragments
        children = this.mergeSentenceFragments(children);

        // Parse sentences and link
        children = this.parseSentences(ctx, children);

        // Return transformed children
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

    parseSentences = (ctx, children) => {
        /*
        The sentence parsing algorithm.

        This uses a left-recursive longest-match algo, with constant precedence and
        left associativity for all sentence definitions.
        */

        //              symbol(s)             |      expr mode         |       decl mode
        // ------------------------------------------------------------------------------------
        // fragment                           | continue               | continue
        // number, string, logical, parameter | hard nesting           | ERROR
        // map, block                         | hard nesting           | ERROR
        // placeholder operator               | shift mode             > placeholder
        // declaration operator               | shift mode             > V
        //                                    |                        < hard terminator (decl)
        // association operator               | hard terminator (expr) | ERROR
        // soft terminator                    | soft terminator        | continue

        // Top-level sentences must be terminated with a soft or hard terminator.

        const allDecls = this.getDeclarations(ctx);

        const finalChildren = [];
        let sentenceCandidateNodes = [];
        for (const child of children) {
            let hardTerminator = false;
            switch (child.constructor) {
                case AssociationOperatorRepr:
                    hardTerminator = true; // fallthrough
                case SoftTerminatorRepr:
                    // Check if this is a full sentence.
                    const sentence = this.terminateSentence(sentenceCandidateNodes, allDecls);
                    if (sentence !== null) {
                        finalChildren.push(sentence);
                    } else if (hardTerminator) {
                        this.log.success = false;
                        this.log.output.push(<Message type="error"></Message>);
                    }
                    break;

                default:
                    sentenceCandidateNodes.push(child);
            }
        }

        return finalChildren;
    }

    // Return a flattened object containing a mapping of all sentence template
    // declarations in the given lexical scope (context) to their bound ref objects.
    getDeclarations = (ctx) => {
        // Base case (above the top namespace = no decls)
        if (ctx == null) return {};

        // Recursive case
        const decls = Object.assign({}, this.getDeclarations(ctx.parentCtx)); // Add decls of parent namespaces.
        if (ctx.decls != null) Object.assign(decls, ctx.decls);               // Then, if a namespace yourself, add your decls (possibly hiding parent decls).
        return decls;
    }

    // Terminate the sentence if possible.
    // TEMPORARY - this is way too basic for the real algo
    terminateSentence = (sentenceCandidateNodes, allDecls) => {
        // Convert to the template string
        let template = "";
        let params = [];
        for (const node of sentenceCandidateNodes) {
            switch (node.constructor) {
                // Sentence fragment
                case SentenceFragmentRepr:
                    template += node.content;
                    break;

                // Values (parameters)
                case NumberRepr:
                case StringRepr:
                case LogicalRepr:
                case ParameterRepr:
                case BlockRepr:
                case MapRepr:
                    template += "|";
                    params.push(node);
                    break;

                // Any other node - ERROR
                default:
                    this.log.success = false;
                    this.log.output.push(<Message type="error">A sentence cannot include a {node.constructor.name}</Message>);
            }
        }

        // Match against the teplate string
        let sentence = null;
        const def = allDecls[template];
        if (def !== undefined) sentence = new SentenceRepr(def, params);
        return sentence;
    }

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
