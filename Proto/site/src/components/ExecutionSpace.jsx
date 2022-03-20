import react from "react";
import './ExecutionSpace.css'

import { Tabs, Tab } from "./utils/Tabs";

export default class ExecutionSpace extends react.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Build I/O
      buildConfig: {},
      buildLog: [],

      // Build result
      ast: null,

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
                  className="codebox"
                  value={this.input}
                  onChange={(e) => this.props.setInput(e.target.value)}
                ></textarea>
              </div>

              <div className="execution-space-actions">
                <button id="build-action" onClick={this.build}>Build</button>
              </div>

              <div className="execution-space-output">
                <p>Build Log:</p>
                <div id="build-output" className="codebox"></div>
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
                  value={this.input}
                  onChange={(e) => this.props.setInput(e.target.value)}
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

  configure() {
    //
  }

  build() {
    //
  }

  run() {
    //
  }
}
