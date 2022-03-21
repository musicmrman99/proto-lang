import ProtoParserVisitor from './build/ProtoParserVisitor';

export const Type = Object.freeze({
    SOFT_TERMINATOR: Symbol("soft-terminator"),
    PARAMETER: Symbol("parameter"),
    MAP: Symbol("map"),
    BLOCK: Symbol("block")
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

    // Remove null/undefined
	visitProgram = (ctx) =>
        this.visitChildren(ctx)           // Expressions -> their values / representations
        .filter((child) => child != null) // Remove EOF and dropped nodes

    // Translate newline -> SOFT_TERMINATOR
    visitNewline = () => ({type: Type.SOFT_TERMINATOR});

    // Discard comments and unimportant whitespace
	visitComment = () => null;
	visitAny_whitespace = () => null;

    // Bypass expression_atom and map_expression_atom nodes
    visitExpression_atom = (ctx) => this.visitChildren(ctx)[0];
    visitMap_expression_atom = (ctx) => this.visitChildren(ctx)[0];

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

    // Compound literals
    visitMap_literal = (ctx) => ({
        type: Type.MAP,
        astNodes:
            this.visitChildren(ctx)           // Expressions -> their values / representations
            .filter((child) => child != null) // Remove `[`, `]`, and dropped nodes
    });

    visitBlock_literal = (ctx) => ({
        type: Type.BLOCK,
        astNodes:
            this.visitChildren(ctx)           // Expressions -> their values / representations
            .filter((child) => child != null) // Remove `{`, `}`, and dropped nodes
    });

    /*
    Remaining:

  | map_literal
      association_operator (map only)
  | block_literal

  | declaration_operator
  | placeholder_operator

  | sentence_fragment
    */
}
