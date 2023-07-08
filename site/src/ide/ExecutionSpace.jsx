import react from "react";
import './ExecutionSpace.css'

import { TabContent } from "./utils/Tabs";

import BuildConfigPanel from "./panels/BuildConfigPanel";
import BuildLogPanel from "./panels/BuildLogPanel";
import ProgramInputPanel from "./panels/ProgramInputPanel";
import ProgramOutputPanel from "./panels/ProgramOutputPanel";

// Main class
export default class ExecutionSpace extends react.Component {
  render() {
    return (
      <div id="execution-space">
        <TabContent tabid="build-config">
          <BuildConfigPanel
            buildConfig={this.props.buildConfig}
            buildConfigOverride={this.props.buildConfigOverride}
            onBuildConfigOverrideChange={this.props.onBuildConfigOverrideChange}
          />
        </TabContent>

        <TabContent tabid="build-log">
          <BuildLogPanel buildLog={this.props.buildLog} />
        </TabContent>

        <TabContent tabid="program-input">
          <ProgramInputPanel programInput={this.props.programInput} onProgramInputChange={this.props.onProgramInputChange} />
        </TabContent>

        <TabContent tabid="program-output">
          <ProgramOutputPanel programOutput={this.props.programOutput} />
        </TabContent>
      </div>
    );
  }
}
