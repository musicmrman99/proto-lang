import ProtoParserVisitor from './build/ProtoParserVisitor';

const TempType = Object.freeze({
    SENTENCE_FRAGMENT: Symbol("sentence-fragment"),
    MERGED_SENTENCE_FRAGMENT: Symbol("merged-sentence-fragment"),
    ASSOCIATION_OPERATOR: Symbol("association-operator"),
    DECLARATION_OPERATOR: Symbol("declaration-operator"),
    PLACEHOLDER_OPERATOR: Symbol("placeholder-operator"),
});

export const Type = Object.freeze({
    // number, string, boolean - use JS equivalents

    PARAMETER: Symbol("parameter"),

    MAP: Symbol("map"),
    BLOCK: Symbol("block"),

    ASSOCIATION: Symbol("association"),
    DECLARATION: Symbol("declaration"),
    PLACEHOLDER: Symbol("placeholder"),

    SENTENCE: Symbol("sentence"),
    SOFT_TERMINATOR: Symbol("soft-terminator"),
});

// This class defines a complete visitor for a parse tree produced by ProtoParser.
export default class ProtoVisitor extends ProtoParserVisitor {
    /**
     * Create an ANTLR visitor for the output of the 1st phase parser.
     * 
     * @param {{}} config The configuration to use.
     * @param {{success: boolean, log: Array}} log The logger for errors,
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
        return parseFloat(
            whole.getText() +
            (point != null ? point.getText() : "") +
            (frac != null ? frac.getText() : "")
        );
    }
	visitString_literal = (ctx) => ctx.STRING_LITERAL().getText();
	visitLogical_literal = (ctx) => ctx.LOGICAL_LITERAL().getText() === "true";

    // Translate parameters into their AST representation
    // Note: Like basic literals, parameters can appear anywhere
    visitParameter = (ctx) => {
        const index = ctx.parameter_index();
        const extraction = ctx.parameter_extraction();
        return {
            type: Type.PARAMETER,
            index: index != null ? parseInt(index.getText()) : 1,
            extraction: extraction != null ? this.visitMap_literal(extraction.map_literal()) : []
        };
    }

    /* Pre-Sentence Parsing Representations
    -------------------- */

    // Translate sentence_fragment and the various syntactic operators
    // into their pre-sentence parsing AST representations.

    // Use Type.SENTENCE for now - they'll be joined during sentence parse/link
    visitSentence_fragment = (ctx) => ({
        type: TempType.SENTENCE_FRAGMENT,
        content: ctx.getText()
        // Type.SENTENCE has a `ref` too (and its `content` is different)
    });
    visitDeclaration_operator = () => ({
        type: TempType.DECLARATION_OPERATOR
        // Type.DECLARATION has a `template` and `ref` too
    });
    visitPlaceholder_operator = () => ({
        type: TempType.PLACEHOLDER_OPERATOR
    });
    visitAssociation_operator = (ctx) => ({
        type: TempType.ASSOCIATION_OPERATOR,

        relation: {
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

        remove: ctx.ASSOCIATION().getText().includes("/")

        // Type.ASSOCIATION has a `left` and a `right` too
    });

    /* Sentence Parsing Contexts
    -------------------- */

    // Translate newline -> SOFT_TERMINATOR
    visitNewline = () => ({type: Type.SOFT_TERMINATOR});

    // Program (entry point) and Compound Literals
	visitProgram = (ctx) => ({ type: Type.BLOCK, children: this.parseSentenceDeclContext(ctx) });
    visitBlock_literal = (ctx) => ({ type: Type.BLOCK, children: this.parseSentenceDeclContext(ctx) });
    visitMap_literal = (ctx) => ({ type: Type.MAP, children: this.parseSentenceExprContext(ctx) });

    parseSentenceContext = (ctx) => {
        // Get raw children
        let children = this.visitChildren(ctx) // Expressions -> their values / representations
            .filter((child) => child != null); // Remove EOF, `{`, `}`, `[`, `]`, and dropped nodes

        // Merge SENTENCE_FRAGMENT nodes (they'll be split correctly later), while
        // passing along other node types.
        const childrenPostMerge = [];
        let mergedSentenceFragment = [];
        const pushMergedSentenceFragment = () => {
            if (mergedSentenceFragment.length > 0) {
                childrenPostMerge.push({
                    type: TempType.MERGED_SENTENCE_FRAGMENT,
                    content: mergedSentenceFragment
                        .map((sentenceFragment) => sentenceFragment.content)
                        .join("")
                });
                mergedSentenceFragment = [];
            }
        };
        for (const child of children) {
            if (child.type === TempType.SENTENCE_FRAGMENT) {
                mergedSentenceFragment.push(child);
            } else {
                pushMergedSentenceFragment();
                childrenPostMerge.push(child);
            }
        }
        pushMergedSentenceFragment();
        children = childrenPostMerge;

        // Return transformed children
        return children;
    }

    parseSentenceDeclContext = (ctx) => {
        let children = this.parseSentenceContext(ctx);

        //

        return children;
    }

    parseSentenceExprContext = (ctx) => {
        const children = this.parseSentenceContext(ctx);

        //

        return children;
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
