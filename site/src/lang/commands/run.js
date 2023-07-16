import repr from "../reprs/all";

const namespaceFrom = (stack, declarations) => {
  const namespace = new repr.Repr.Mapping(repr.Repr.is(repr.Declaration), repr.Repr.is(repr.RuntimeRepr));
  declarations.forEach((decl) => {
    const value = stack.getDeclValue(decl);
    if (value == null) {
      throw new repr.ComputeError(
        `Required enclosing declaration '${decl.toString()}' not found in:\n`+
        stack.getTraceStr()
      );
    }
    namespace.set(decl, value);
  });
  return namespace;
}

const evaluate = (stack, astNode) => {
  // If a literal, create it's runtime representation
  if (repr.Repr.is(repr.Number, astNode))  return new repr.RuntimeNumber(astNode);
  if (repr.Repr.is(repr.Text, astNode))    return new repr.RuntimeText(astNode);
  if (repr.Repr.is(repr.Logical, astNode)) return new repr.RuntimeLogical(astNode);

  if (repr.Repr.is(repr.Map, astNode)) {
    // TODO
    return new repr.RuntimeMap(astNode, astNode.children.map((child) => evaluate(stack, child)));
  }

  if (repr.Repr.is(repr.AbstractBlock, astNode)) {
    const block = repr.Repr.is(repr.Block, astNode) ?
      new repr.ProtoRuntimeBlock(astNode) :
      new repr.NativeRuntimeBlock(astNode);

    block.encDecls.mergeIn(namespaceFrom(stack, astNode.reqEncDecls));
    return block;
  }

  // If a parameter, get value from args
  if (repr.Repr.is(repr.Parameter, astNode)) {
    if (stack.head.args.length < astNode.index) {
      throw new repr.ComputeError(
        `Parameter ${astNode.index} requested, `+
        `but only ${stack.head.args.length} arguments were given in:\n`+
        stack.getTraceStr()
      );
    }

    // TODO: This is where the extraction/windowing/typechecking algo would be run
    return stack.head.args[astNode.index - 1];
  }

  // If a declaration, evaluate its sentence and bind the resulting value
  if (repr.Repr.is(repr.Declaration, astNode)) {
    stack.head.decls.set(astNode, evaluate(stack, astNode.sentence));
    return null;
  }

  // If a sentence, get value from context declarations
  if (repr.Repr.is(repr.Sentence, astNode)) {
    let value = stack.head.decls.get(astNode.decl);

    // If its value is a block, evaluate its arguments and run it
    if (repr.Repr.is(repr.RuntimeBlock, value)) {
      const args = astNode.params.map((param) => evaluate(stack, param));
      value = runBlock(stack, value, args);
    }

    return value;
  }

  // If a `using` clause, get block from context declarations
  if (repr.Repr.is(repr.Using, astNode)) {
    let value = stack.head.decls.get(astNode.decl);

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
      block.parent = stack.head.astNode;
      block.children.push(new repr.Sentence(astNode.decl, wrappedSentenceASTArgs));
      block.reqEncDecls.push(astNode.decl, ...tempContextASTDecls);
      // A `using` block has no declarations

      // The computed value of the `using` clause is the evaluation of the `using`
      // block in a temporarily modified context.
      const oldDecls = stack.head.decls;
      tempContextASTDecls.forEach(
        (tempContextASTDecl) => evaluate(stack, tempContextASTDecl)
      );
      value = evaluate(stack, block);
      stack.head.decls = oldDecls;
    }

    return value;
  }
}

const runBlock = (stack, block, args) => {
  // Setup
  let ret = null;

  block.parent = stack.head;
  block.args = args;
  block.decls = new repr.Repr.Mapping(repr.Repr.is(repr.Declaration), repr.Repr.is(repr.RuntimeRepr));
  block.decls.mergeIn(block.encDecls);

  stack.head = block;

  if (repr.Repr.is(repr.ProtoRuntimeBlock, block)) {
    // Evaluate each child of block
    for (const node of block.astBlock.children) {
      const value = evaluate(stack, node);
      if (value != null) ret = value;
    }
  }

  if (repr.Repr.is(repr.NativeRuntimeBlock, block)) {
    // Evaluate function of native block, passing the stack and itself
    ret = block.astNativeBlock.function_(stack, block);
  }

  // Teardown
  stack.head = stack.head.parent;

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
  const log = new repr.Log();

  // Check for build errors
  if (ast == null) {
    log.success = false;
    log.output.push(new repr.Message("error", "Cannot run program until it is successfully built"));
  }

  const stack = new repr.Stack();
  let result = null;
  if (log.success) {
    try {
      // Compute the root block (ie. run the program)
      result = runBlock(
        stack,
        new repr.ProtoRuntimeBlock(ast),
        [repr.RuntimeText.fromNative(programInput)]
      );

      // Show Result
      if (result == null) {
        log.output.push(new repr.Message("info", "No result."));
      } else {
        log.output.push(new repr.Message("info", "Result: " + result.toString()));
      }

    } catch (e) {
      log.success = false;
      log.errors.push(e);

      if (e instanceof repr.ComputeError || e instanceof repr.Repr.Error) {
        // Proto Error
        log.output.push(new repr.Message("error", "Compute Error: " + e.message));
      } else {
        // Native Error (eg. stack overflow, out of memory, etc.)
        log.output.push(new repr.Message("error", "Native Error: " + e.message+"\n" + e.stack));
      }
    }
  }

  // Output success/failure
  if (log.success) {
    log.output.push(new repr.Message("success", "I'm done."));
  } else {
    log.output.push(new repr.Message("error", "Compute Failed."));
  }

  return [result, log];
}
export default run;
