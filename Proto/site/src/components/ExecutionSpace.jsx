import react from "react";
import './ExecutionSpace.css'

import jsonschema from 'json-schema';

import { Tabs, Tab } from "./utils/Tabs";

export default class ExecutionSpace extends react.Component {
  constructor(props) {
    super(props);
    
    this.configSchema = {
      type: "object",
      properties: {},
      additionalProperties: false
    }

    this.state = {
      // Build I/O
      buildConfigStr: "{}",
      buildConfig: {}, // null = invalid config
      buildLog: [],

      // Build result
      ast: null, // null = not yet built

      // Run I/O
      programInput: "",
      programOutput: ""
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
                <div id="build-output" className="codebox">
                  {this.state.buildLog.map((entry) => (<p>{entry}</p>))}
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
                <div id="run-output" className="codebox"></div>
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
    // Configuration error
    if (this.state.buildConfig == null) {
      this.setState({buildLog: [
        <span className="build-error">BUILD FAILED</span>,
        <span><span className="build-error">ERROR:</span> Configuration is invalid - please correct it, then try building again.</span>
      ]});
      return;
    }

    // Build
    const log = [];
    log.push(<span className="build-success">BUILD SUCCESSFUL</span>);
    this.setState({buildLog: log});
  }

  run = () => {
    //
  }
}
