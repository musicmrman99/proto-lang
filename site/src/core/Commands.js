import RuntimeError from "../utils/RuntimeError";

import { is } from "./Representations";

import Message from "../utils/Message";

import antlr4 from 'antlr4';
import ProtoLexer from '../lang/build/ProtoLexer.js';
import ProtoParser from '../lang/build/ProtoParser.js';
import ProtoVisitor from '../lang/ProtoVisitor';             // Custom
import ProtoErrorListener from "../lang/ProtoErrorListener"; // Custom
const { CommonTokenStream, InputStream } = antlr4;

const runBlock = (astBlock, args) => {
  let ret = null; // Void
  for (const node of astBlock.children) {
    ret = evaluate(node, { args: args, block: astBlock });
  }
  return ret;
}

const evaluate = (astNode, context) => {
  // If a parameter, extract from args
  if (is.parameter(astNode)) {
    if (context.args.length < astNode.index) {
      throw new RuntimeError(
        `Parameter ${astNode.index} requested, `+
        `but only ${context.args.length} arguments were given `+
        `(in block ${context.block.toString()})`
      );
    }
    // This is where the extraction algo would be run
    return context.args[astNode.index - 1];
  }

  // If a sentence, evaluate it
  if (is.sentence(astNode)) {
    let value = evaluate(astNode.ref, context);

    // If its ref is a block, run it
    if (is.block(value)) {
      const args = astNode.params.map((param) => evaluate(param, context));
      value = runBlock(value, args);
    }

    return value;
  }

  // If not a sentence, then return it verbatim
  return astNode;
}

const commands = {
  /**
   * Build an AST from the given Proto source code.
   * 
   * @param {string} source The source code to build.
   * @returns {[Repr, {success: boolean, output: Array<Message>}]} The built AST and the build log.
   */
  build: (protoSource, buildConfig) => {
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
  },

  /**
   * Run the Proto program based on its AST and input.
   * 
   * @param {Repr} ast The AST to execute.
   * @param {string} programInput The input to the program.
   */
  run: (ast, programInput) => {
    const output = [];
    if (ast == null) {
      output.push(
        new Message("error", "Cannot run program until it is successfully built")
      );

    } else {
      try {
        const result = runBlock(ast, [programInput]); // The root block (ie. the program)

        output.push(new Message("success", "I'm done."));
        if (result == null) {
          output.push(new Message("info", "No result."));
        } else {
          output.push(new Message("info", "Result: " + result.toString()));
        }

      } catch (e) {
        if (!(e instanceof RuntimeError)) throw e;

        output.push(
          new Message("error", "Runtime Error: " + e.message)
        );
      }
    }

    return output;
  }
};
export default commands;
