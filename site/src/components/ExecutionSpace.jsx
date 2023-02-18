import react from "react";
import './ExecutionSpace.css'

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
        <Tabs tabLocation="top" tabOrientation="top" swapEvent="onMouseEnter">
          <Tab tabid="build-config" name="Build Config">
            <BuildConfigPanel buildConfig={this.props.buildConfig} onBuildConfigChange={this.props.onBuildConfigChange} />
          </Tab>

          <Tab tabid="build-log" name="Build Log">
            <BuildLogPanel buildLog={this.props.buildLog} />
          </Tab>

          <Tab tabid="program-input" name="Program Input">
            <ProgramInputPanel programInput={this.props.programInput} onProgramInputChange={this.props.onProgramInputChange} />
          </Tab>

          <Tab tabid="program-output" name="Program Output">
            <ProgramOutputPanel programOutput={this.props.programOutput} />
          </Tab>
        </Tabs>
      </div>
    );
  }
}
