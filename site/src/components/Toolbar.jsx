import react from 'react';
import './Toolbar.css';

import Button from './utils/Button';
import { Tabs, Tab } from "./utils/Tabs";

import commands from '../core/Commands';

export default class Toolbar extends react.Component {
  render() {
    return (
      <div className="toolbar">
        <h2>Tools</h2>
        <Button
          label="Build" icon="construction"
          iconLocation="top"
          onClick={() => this.props.onBuild(...commands.build(this.props.protoSource, this.props.buildConfig))}
        />
        <Button
          label="Run" icon="settings"
          iconLocation="top"
          onClick={() => this.props.onRun(commands.run(this.props.ast, this.props.programInput))}
        />

        <Tabs iconLocation="top">
          <Tab tabid="build-config" label="Build Config" icon="build" />
          <Tab tabid="build-log" label="Build Log" icon="receipt_long" />
          <Tab tabid="program-input" label="Program Input" icon="input" />
          <Tab tabid="program-output" label="Program Output" icon="output" />
        </Tabs>
      </div>
    );
  }
}
