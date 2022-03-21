import ProtoParserListener from './build/ProtoParserListener'

// This class defines a complete listener for a parse tree produced by ChatParser.
export default class ProtoListener extends ProtoParserListener {
    /**
     * Create an ANTLR listener for the output of the 1st phase parser.
     * 
     * @param {{}} config The configuration to use.
     * @param {{program: {}}} ast The blank AST object to populate.
     * @param {{success: boolean, log: Array}} log The logger for errors,
     *   warnings, and other messages.
     */
    constructor(config, ast, log) {
        super();

        this.config = config;
        this.ast = ast;
        this.log = log;
    }

    // Enter a parse tree produced by ProtoParser#program.
    enterProgram(ctx) {
        this.ast.program = {children: ["hello"]};
    }

    // Exit a parse tree produced by ProtoParser#program.
    exitProgram(ctx) {
        this.ast.program.children.push("goodbye");
    }
}
