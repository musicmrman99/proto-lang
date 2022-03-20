import react from "react";
import './ExecutionSpace.css'

export default class ExecutionSpace extends react.Component {
  render() {
    return (
      <div id="execution-space">
        <div id="execution-space-header">
          <h2>Execution Space</h2>
          <p>... and compile/run it here.</p>
        </div>
        
        <textarea id="execution-space-input"></textarea>
        <div id="execution-space-actions">
          
        </div>
        <div id="execution-space-output"></div>
      </div>
    );
  }
}
