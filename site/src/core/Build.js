import Message from "../utils/Message";

import antlr4 from 'antlr4';
import ProtoLexer from '../lang/build/ProtoLexer.js';
import ProtoParser from '../lang/build/ProtoParser.js';
import ProtoVisitor from '../lang/ProtoVisitor';             // Custom
import ProtoErrorListener from "../lang/ProtoErrorListener"; // Custom
const { CommonTokenStream, InputStream } = antlr4;

/**
 * Build an AST from the given Proto source code.
 * 
 * @param {object} buildConfig The configuration to use to build the source code.
 * @param {string} protoSource The source code to build.
 * @returns {[repr.Repr, {success: boolean, output: Array<Message>}]} The built AST and the build log.
 */
const build = (buildConfig, protoSource) => {
  // Create the logging object
  const log = {
    success: true,
    output: []
  };

  // Check for configuration errors
  if (buildConfig == null) {
    log.success = false;
    log.output.push(new Message("error", "Build Configuration is invalid - please correct it, then try building again."));
  }

  // Run lexer / 1st phase parser
  let tree = null;
  if (log.success) {
    const chars = new InputStream(protoSource, true);

    const errorListener = new ProtoErrorListener(buildConfig, log);

    const lexer = new ProtoLexer(chars);
    lexer.removeErrorListeners();
    lexer.addErrorListener(errorListener);
    const tokens  = new CommonTokenStream(lexer);

    const parser = new ProtoParser(tokens);
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);
    tree = parser.program();
  }

  // Run 2nd phase parser / linker
  let ast = null;
  if (log.success) {
    const protoLang = new ProtoVisitor(buildConfig, log);
    ast = protoLang.visit(tree);
  }

  // Output success/failure
  if (log.success) {
    log.output.push(new Message("success", "Ready to Run"));
  } else {
    log.output.push(new Message("error", "Errors Found (see above)"));
  }

  return [ast, log];
}
export default build;
