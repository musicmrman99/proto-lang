import react from 'react';
import './Toolbar.css';

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
      </div>
    );
  }
}
