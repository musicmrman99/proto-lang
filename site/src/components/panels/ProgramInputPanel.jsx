import react from 'react';
import './ProgramInputPanel.css';

export default class ProgramInputPanel extends react.Component {
  render() {
    return (
      <div id="program-input-panel" className="panel">
        <textarea
          id="run-input"
          className="codebox"
          value={this.props.programInput}
          onChange={(e) => this.props.onProgramInputChange(e.target.value)}
        ></textarea>
      </div>
    );
  }
}
