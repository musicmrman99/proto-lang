import react from "react";
import './ExecutionSpace.css'

import jsonschema from 'json-schema';

import { Tabs, Tab } from "./utils/Tabs";
import Message from "./utils/Message";

import { is } from "../lang/Representations";

import antlr4 from 'antlr4';
import ProtoLexer from '../lang/build/ProtoLexer.js';
import ProtoParser from '../lang/build/ProtoParser.js';
import ProtoVisitor from '../lang/ProtoVisitor';             // Custom
import ProtoErrorListener from "../lang/ProtoErrorListener"; // Custom
const { CommonTokenStream, InputStream } = antlr4;

// Runtime error. From: https://stackoverflow.com/a/27724419
function RuntimeError(message) {
  this.message = message;
  // Use V8's native method if available, otherwise fallback
  if ("captureStackTrace" in Error)
      Error.captureStackTrace(this, RuntimeError);
  else
      this.stack = (new Error()).stack;
}
RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.name = "RuntimeError";
RuntimeError.prototype.constructor = RuntimeError;

// Main class
export default class ExecutionSpace extends react.Component {
  constructor(props) {
    super(props);
    
    this.configSchema = {
      type: "object",
      properties: {},
      additionalProperties: false
    }

    this.state = {
      // Build Config
      buildConfigStr: "{}",
      buildConfig: {}, // null = invalid config

      // Build Output
      buildLog: {
        success: null,
        output: []
      },
      ast: null, // null = not yet built, OR failed to build

      // Run I/O
      programInput: "",
      programOutput: []
    };
  }

  render() {
    return (
      <div id="execution-space">
        <div id="execution-space-header">
          <h2>Execution Space</h2>
          <p>... and configure, compile, and run it here.</p>
        </div>
        
        <Tabs swapOn="hover">
          <Tab tabid="build" name="Build">
            <div id="execution-space-main">
              <div className="execution-space-input">
                <p>Build Config:</p>
                <textarea
                  id="build-input"
                  className={"codebox " + (this.state.buildConfig != null ? "valid" : "invalid")}
                  value={this.state.buildConfigStr}
                  onChange={(e) => this.setConfig(e.target.value)}
                ></textarea>
              </div>

              <div className="execution-space-actions">
                <button id="build-action" onClick={this.build}>Build</button>
              </div>

              <div className="execution-space-output">
                <p>Build Log:</p>
                <div id="build-output" className={
                    "codebox " + {
                      [null]: "awaiting",
                      [true]: "valid",
                      [false]: "invalid"
                    }[this.state.buildLog.success]
                  }>
                  {this.state.buildLog.output.map((message, i) => react.cloneElement(message, {key: i}))}
                </div>
              </div>
            </div>
          </Tab>

          <Tab tabid="run" name="Run">
            <div id="execution-space-main">
              <div className="execution-space-input">
                <p>Program Input:</p>
                <textarea
                  id="run-input"
                  className="codebox"
                  value={this.state.programInput}
                  onChange={(e) => this.setProgramInput(e.target.value)}
                ></textarea>
              </div>

              <div className="execution-space-actions">
                <button id="run-action" onClick={this.run}>Run</button>
              </div>

              <div className="execution-space-output">
                <p>Program Output:</p>
                <div
                  id="run-output"
                  className="codebox"
                >
                  {this.state.programOutput.map((line, i) => react.cloneElement(line, {key: i}))}
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  }

  setConfig = (configStr) => {
    // Parse JSON
    let config = null;
    try {
      config = JSON.parse(configStr);
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e; // If it's not a syntax error, re-throw
    }

    // Validate JSON;
    let result = jsonschema.validate(config, this.configSchema);
    if (!result.valid) config = null;

    // Set State
    this.setState({buildConfigStr: configStr, buildConfig: config});
  }

  setProgramInput = (programInput) => {
    this.setState({programInput: programInput});
  }

  build = () => {
    // Create the logging object
    const log = {
      success: true,
      output: []
    };

    // Check for configuration errors
    if (this.state.buildConfig == null) {
      log.success = false;
      log.output.push(<Message type="error">Build Configuration is invalid - please correct it, then try building again.</Message>);
    }

    // Run lexer / 1st phase parser
    let tree = null;
    if (log.success) {
      const chars = new InputStream(this.props.protoInput, true);
      const lexer = new ProtoLexer(chars);
      const tokens  = new CommonTokenStream(lexer);
      const parser = new ProtoParser(tokens);
      parser.removeErrorListeners();
      parser.addErrorListener(new ProtoErrorListener(this.state.buildConfig, log));
      tree = parser.program();
    }

    // Run 2nd phase parser / linker
    let ast = null;
    if (log.success) {
      const protoLang = new ProtoVisitor(this.state.buildConfig, log);
      ast = protoLang.visit(tree);
    }

    // Output success/failure and update state
    if (log.success) {
      log.output.push(<Message type="success">Ready to Run</Message>);
    } else {
      log.output.push(<Message type="error">Errors Found (see above)</Message>);
    }
    this.setState({ast: ast, buildLog: log});
  }

  run = () => {
    const output = [];
    if (this.state.ast == null) {
      output.push(
        <Message type="error">
          Cannot run program until it is successfully built
        </Message>
      );

    } else {
      try {
        const result = this.runBlock(this.state.ast, [this.state.programInput]); // The root block (ie. the program)

        output.push(<Message type="success">I'm done.</Message>);
        if (result == null) {
          output.push(<Message type="info">No result.</Message>);
        } else {
          output.push(<Message type="info">Result: {result.toString()}</Message>);
        }

      } catch (e) {
        if (!(e instanceof RuntimeError)) throw e;

        output.push(
          <Message type="error">
            Runtime Error: {e.message}
          </Message>
        );
      }
    }

    this.setState({ programOutput: output });
  }

  runBlock = (block, args) => {
    let ret = null; // Void
    for (const node of block.children) {
      ret = this.evaluate(node, { args: args, block: block });
    }
    return ret;
  }

  evaluate = (node, context) => {
    // If a parameter, extract from args
    if (is.parameter(node)) {
      if (context.args.length < node.index) {
        throw new RuntimeError(
          `Parameter ${node.index} requested, `+
          `but only ${context.args.length} arguments were given `+
          `(in block ${context.block.toString()})`
        );
      }
      // This is where the extraction algo would be run
      return context.args[node.index - 1];
    }

    // If a sentence, evaluate it
    if (is.sentence(node)) {
      let value = this.evaluate(node.ref, context);

      // If its ref is a block, run it
      if (is.block(value)) {
        const args = node.params.map((param) => this.evaluate(param, context));
        value = this.runBlock(value, args);
      }

      return value;
    }

    // If not a sentence, then return it verbatim
    return node;
  }
}
