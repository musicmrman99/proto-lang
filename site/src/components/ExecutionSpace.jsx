import react from "react";
import './ExecutionSpace.css'

import commands from "../core/Commands";

import { Tabs, Tab } from "./utils/Tabs";

import BuildConfigPanel from "./panels/BuildConfigPanel";
import BuildLogPanel from "./panels/BuildLogPanel";
import ProgramInputPanel from "./panels/ProgramInputPanel";
import ProgramOutputPanel from "./panels/ProgramOutputPanel";

// Main class
export default class ExecutionSpace extends react.Component {
  render() {
    return (
      <div id="execution-space">
        <div id="execution-space-header">
          <h2>Execution Space</h2>
          <p>... and configure, compile, and run it here.</p>
        </div>

        <Tabs swapEvent="onMouseEnter">
          <Tab tabid="build" name="Build">
            <div id="execution-space-main">
              <div className="execution-space-actions">
                <button id="build-action" onClick={() => this.props.onBuild(...commands.build(this.props.protoSource, this.props.buildConfig))}>Build</button>
              </div>

              <BuildConfigPanel buildConfig={this.props.buildConfig} onBuildConfigChange={this.props.onBuildConfigChange} />
              <BuildLogPanel buildLog={this.props.buildLog} />
            </div>
          </Tab>

          <Tab tabid="run" name="Run">
            <div id="execution-space-main">
              <div className="execution-space-actions">
                <button id="run-action" onClick={() => this.props.onRun(commands.run(this.props.ast, this.props.programInput))}>Run</button>
              </div>

              <ProgramInputPanel programInput={this.props.programInput} onProgramInputChange={this.props.onProgramInputChange} />
              <ProgramOutputPanel programOutput={this.props.programOutput} />
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  }
}
