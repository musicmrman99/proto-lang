import repr from "../reprs/all";
import RuntimeError from "../errors/RuntimeError";

const state = {
  stackHead: null
};

const evaluate = (astNode, context) => {
  // If a literal, create it's runtime representation
  if (repr.Repr.is(repr.Number, astNode))  return new repr.RuntimeNumber(astNode);
  if (repr.Repr.is(repr.Text, astNode))    return new repr.RuntimeText(astNode);
  if (repr.Repr.is(repr.Logical, astNode)) return new repr.RuntimeLogical(astNode);

  if (repr.Repr.is(repr.Map, astNode)) {
    // TODO
    return new repr.RuntimeMap(astNode, astNode.children.map((child) => evaluate(child, context)));
  }

  if (repr.Repr.is(repr.Block, astNode)) {
    const block = new repr.RuntimeBlock(astNode, context);

    if (context != null) { // If not the root of the stack
      astNode.reqEncDecls.forEach((reqEncDecl) => {
        const value = context.getStackDeclValue(reqEncDecl);
        if (value == null) {
          // Should never happen, as it should throw a build-time error,
          // but it may happen in the future if reflection is ever introduced.
          throw new RuntimeError(
            `Required enclosing declaration '${reqEncDecl.toString()}' not found in:\n`+
            block.getStackTraceStr()
          );
        }
        block.encDecls.set(reqEncDecl, value);
      });
    }

    return block;
  }

  // If a parameter, get value from args
  if (repr.Repr.is(repr.Parameter, astNode)) {
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
  if (repr.Repr.is(repr.Declaration, astNode)) {
    context.decls.set(astNode, evaluate(astNode.sentence, context));
    return null;
  }

  // If a sentence, get value from context declarations
  if (repr.Repr.is(repr.Sentence, astNode)) {
    let value = context.decls.get(astNode.decl);

    // If its value is a block, evaluate its arguments and run it
    if (repr.Repr.is(repr.RuntimeBlock, value)) {
      const args = astNode.params.map((param) => evaluate(param, context));
      value = runBlock(value, args);
    }

    return value;
  }

  // If a `using` clause, get block from context declarations
  if (repr.Repr.is(repr.Using, astNode)) {
    let value = context.decls.get(astNode.decl);

    // If its value is a block, and not all of its arguments are placeholders,
    // then evaluate its arguments and construct a block that runs it.
    // This basically generates the code that is equivalent to this recursive-case
    // of a `using` clause:
    //   x | | : {[@1, @2]} # Test declaration
    //   # This:
    //   using x | {1}
    //   # Becomes:
    //   arg1 : {1} # Numbers in sentence templates are usually illegal
    //   { x @1 using arg1 }
    if (repr.Repr.is(repr.RuntimeBlock, value) && !astNode.params.every(repr.Repr.is(repr.PlaceholderOperator))) {
      // Translate the arguments given into:
      let paramNum = 1;
      const tempContextASTDecls = [];
      const wrappedSentenceASTArgs = astNode.params.map((param) => {
        // A parameter for each non-bound argument
        if (repr.Repr.is(repr.PlaceholderOperator, param)) {
          return new repr.Parameter(paramNum++, new repr.Map());

        // Another 'using' clause of a temporary declaration for each bound argument
        } else {
          const tempContextASTDecl = new repr.Declaration(
            // Use a sentence template that helps in debugging
            [new repr.SentenceFragment(astNode.id+"-param-"+paramNum)],
            param
          );
          tempContextASTDecls.push(tempContextASTDecl);
          // Will recurse once, but always to the base-case of the `using` evaluation
          return new repr.Using(tempContextASTDecl, []);
        }
      });

      // Create a `using` block that must enclose over those temporary declarations
      const block = new repr.Block();
      block.parent = context.astNode;
      block.children.push(new repr.Sentence(astNode.decl, wrappedSentenceASTArgs));
      block.reqEncDecls.push(astNode.decl, ...tempContextASTDecls);
      // A `using` block has no declarations

      // The computed value of the `using` clause is the evaluation of the `using`
      // block in a temporarily modified context.
      const oldDecls = context.decls;
      tempContextASTDecls.forEach(
        (tempContextASTDecl) => evaluate(tempContextASTDecl, context)
      );
      value = evaluate(block, context);
      context.decls = oldDecls;
    }

    return value;
  }
}

const runBlock = (block, args) => {
  // Setup
  let ret = null;

  block.parent = state.stackHead;
  block.args = args;
  block.decls = new repr.Repr.Mapping(repr.Repr.is(repr.Declaration), repr.Repr.is(repr.Repr));
  block.decls.mergeIn(block.encDecls);

  state.stackHead = block;

  // Evaluate each child of block
  for (const node of block.astBlock.children) {
    const value = evaluate(node, state.stackHead);
    if (value != null) ret = value;
  }

  // Teardown
  state.stackHead = state.stackHead.parent;

  block.parent = null;
  block.args = null;
  block.decls = null;

  return ret;
}

/**
 * Run the Proto program based on its AST and input.
 * 
 * @param {repr.Repr} ast The AST to execute.
 * @param {string} programInput The input to the program.
 * @returns {[repr.Repr, {success: boolean, output: Array<Message>}]}
 */
const run = (ast, programInput) => {
  // Create the logging object
  const log = {
    success: true,
    output: []
  };

  // Check for build errors
  if (ast == null) {
    log.success = false;
    log.output.push(new repr.Message("error", "Cannot run program until it is successfully built"));
  }

  let result = null;
  if (log.success) {
    try {
      // Compute the root block (ie. run the program)
      result = runBlock(
        new repr.RuntimeBlock(ast),
        [repr.RuntimeText.fromRaw(programInput)]
      );

      log.output.push(new repr.Message("success", "I'm done."));
      if (result == null) {
        log.output.push(new repr.Message("info", "No result."));
      } else {
        log.output.push(new repr.Message("info", "Result: " + result.toString()));
      }

    } catch (e) {
      if (!(e instanceof RuntimeError)) throw e;

      log.success = false;
      log.output.push(
        new repr.Message("error", "Runtime Error: " + e.message)
      );
    }
  }

  return [result, log];
}
export default run;
