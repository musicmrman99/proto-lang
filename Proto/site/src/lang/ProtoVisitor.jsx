import ProtoParserVisitor from './build/ProtoParserVisitor';

export const Token = Object.freeze({
    HARD_BREAK: Symbol("hard-break"),
    SOFT_BREAK: Symbol("soft-break")
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

    // Remove null/undefined, and translate EOF to a HARD_BREAK
	visitProgram = (ctx) =>
        this.visitChildren(ctx)           // Expressions -> their values / representations
        .filter((child) => child != null) // Remove EOF and other null/undefined values
        .concat(Token.HARD_BREAK);        // Translate EOF -> HARD_BREAK

    // Translate important whitespace to SOFT_BREAKs
    visitNewline = () => Token.SOFT_BREAK;

    // Bypass expression_atom tokens
    visitExpression_atom = (ctx) => this.visitChildren(ctx)[0];

    // Discard comments and unimportant whitespace
	visitComment = () => null;
	visitAny_whitespace = () => null;

	// Translate basic values into their JS equivalents
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

    /*
    Remaining:

  | map_literal
      association_operator (map only)
  | block_literal
  | parameter

  | declaration_operator
  | placeholder_operator

  | sentence_fragment
    */
}
