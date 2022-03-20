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
              <p>Build Config:</p>
              <textarea id="execution-space-input" value={this.input} onChange={(e) => this.props.setInput(e.target.value)}></textarea>

              <div id="execution-space-actions">
                <button id="build-action" onClick={this.build}>Build</button>
              </div>

              <p>Build Log:</p>
              <div id="execution-space-output"></div>
            </div>
          </Tab>

          <Tab tabid="run" name="Run">
            <div id="execution-space-main">
              <p>Program Input:</p>
              <textarea id="execution-space-input" value={this.input} onChange={(e) => this.props.setInput(e.target.value)}></textarea>

              <div id="execution-space-actions">
                <button id="run-action" onClick={this.run}>Run</button>
              </div>

              <p>Program Output:</p>
              <div id="execution-space-output"></div>
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
