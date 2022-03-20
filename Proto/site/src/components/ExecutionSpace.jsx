import react from "react";
import './ExecutionSpace.css'

export default class ExecutionSpace extends react.Component {
  render() {
    return (
      <div id="execution-space">
        <div id="execution-space-header">
          <h2>Execution Space</h2>
          <p>... and configure, compile, and run it here.</p>
        </div>
        
        <textarea id="execution-space-input"></textarea>
        <div id="execution-space-actions">
          <button id="run-action" onClick={this.run}>Run</button>
          <button id="build-action" onClick={this.build}>Build</button>
          <button id="configure-action" onClick={this.configure}>Configure</button>
        </div>
        <div id="execution-space-output"></div>
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
