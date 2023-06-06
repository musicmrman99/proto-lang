import RuntimeError from "../utils/RuntimeError";

import { repr, is } from "./Representations";

import Message from "../utils/Message";

import antlr4 from 'antlr4';
import ProtoLexer from '../lang/build/ProtoLexer.js';
import ProtoParser from '../lang/build/ProtoParser.js';
import ProtoVisitor from '../lang/ProtoVisitor';             // Custom
import ProtoErrorListener from "../lang/ProtoErrorListener"; // Custom
const { CommonTokenStream, InputStream } = antlr4;

const state = {
  stackHead: null
};

const evaluate = (astNode, context) => {
  // If a literal, create it's runtime representation
  if (is.number(astNode))  return new repr.RuntimeNumber(astNode);
  if (is.text(astNode))    return new repr.RuntimeText(astNode);
  if (is.logical(astNode)) return new repr.RuntimeLogical(astNode);

  if (is.map(astNode)) {
    // TODO
    return new repr.RuntimeMap(astNode, astNode.children.map((child) => evaluate(child, context)));
  }

  if (is.block(astNode)) {
    return new repr.RuntimeBlock(astNode, context);
  }

  // If a parameter, get value from args
  if (is.parameter(astNode)) {
    if (context.args.length < astNode.index) {
      throw new RuntimeError(
        `Parameter ${astNode.index} requested, `+
        `but only ${context.args.length} arguments were given in:\n`+
        context.getStackTraceStr()
      );
    }

    // TODO: This is where the extraction/windowing/typechecking algo would be run
    return context.args[astNode.index - 1];
  }

  // If a declaration, evaluate its sentence and bind the resulting value
  if (is.declaration(astNode)) {
    context.decls.set(astNode, evaluate(astNode.sentence, context));
    return null;
  }

  // If a sentence, get value from context declarations
  if (is.sentence(astNode)) {
    let value = context.decls.get(astNode.decl);

    // If its value is a block, evaluate its arguments and run it
    if (is.runtimeBlock(value)) {
      const args = astNode.params.map((param) => evaluate(param, context));
      value = runBlock(value, args);
    }

    return value;
  }
}

const runBlock = (block, args) => {
  // Setup
  let ret = null;
  block.setupRun(state.stackHead, args);
  state.stackHead = block;

  // Evaluate each child of block
  for (const node of block.astBlock.children) {
    const value = evaluate(node, state.stackHead);
    if (value != null) ret = value;
  }

  // Teardown
  state.stackHead = state.stackHead.parent;
  block.teardownRun();
  return ret;
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
        const result = runBlock(new repr.RuntimeBlock(ast), [repr.RuntimeText.fromRaw(programInput)]); // The root block (ie. the program)

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
