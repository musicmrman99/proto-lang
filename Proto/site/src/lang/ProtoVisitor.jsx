import ProtoParserVisitor from './build/ProtoParserVisitor';

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

    // Remove null and undefined values from the top level of the program
	visitProgram = (ctx) => this.visitChildren(ctx).filter((child) => child != null);

    // Bypass expression_atom tokens
    visitExpression_atom = (ctx) => this.visitChildren(ctx)[0];

    // Discard comments and unimportant whitespace
	visitComment = () => null;
	visitAny_whitespace = () => null;

	// Convert basic values into their JS equivalents
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
}
