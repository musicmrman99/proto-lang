import react from 'react';
import './Toolbar.css';

import Button from './utils/Button';
import Separator from './utils/Separator';
import { Tabs, Tab } from "./utils/Tabs";

import commands from '../lang/Commands';

export default class Toolbar extends react.Component {
  render() {
    return (
      <div className="toolbar">
        <div id="brand">
          <img id="logo" src="/proto-48.png" alt="Proto Logo" />
          <h1 id="title">Proto<br />IDE</h1>
        </div>

        <Separator spacing="none" />
        <Separator spacing="medium" transparent />

        <h2>Tools</h2>
        <Button
          label="Build" icon="construction"
          iconLocation="top"
          onClick={() => this.props.onBuild(...commands.build(this.props.buildConfig, this.props.protoSource))}
        />
        <Button
          label="Run" icon="settings"
          iconLocation="top"
          onClick={() => this.props.onRun(...commands.run(this.props.ast, this.props.programInput))}
        />

        <Separator spacing="medium" />

        <h2>Panes</h2>
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
