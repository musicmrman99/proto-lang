import react from 'react';
import './Toolbar.css';

import { Tabs, Tab } from "./utils/Tabs";

import commands from '../core/Commands';

export default class Toolbar extends react.Component {
  render() {
    return (
      <div class="toolbar">
        <h2>Tools</h2>
        <button onClick={() => this.props.onBuild(...commands.build(this.props.protoSource, this.props.buildConfig))}>
          <span class="material-symbols-outlined">construction</span>
          <br />
          Build
        </button>

        <button onClick={() => this.props.onRun(commands.run(this.props.ast, this.props.programInput))}>
          <span class="material-symbols-outlined">settings</span>
          <br />
          Run
        </button>

        <Tabs iconLocation="top" showLabel="always" activateEvent="onClick" deactivateEvent="onClick">
          <Tab tabid="build-config" label="Build Config" icon="build" />
          <Tab tabid="build-log" label="Build Log" icon="receipt_long" />
          <Tab tabid="program-input" label="Program Input" icon="input" />
          <Tab tabid="program-output" label="Program Output" icon="output" />
        </Tabs>
      </div>
    );
  }
}
