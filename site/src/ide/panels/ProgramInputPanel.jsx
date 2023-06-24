import react from 'react';
import './ProgramInputPanel.css';

import Panel from './Panel';

export default class ProgramInputPanel extends react.Component {
  render() {
    return (
      <Panel id="program-input-panel">
        <textarea
          className="codebox"
          value={this.props.programInput}
          onChange={(e) => this.props.onProgramInputChange(e.target.value)}
        ></textarea>
      </Panel>
    );
  }
}
