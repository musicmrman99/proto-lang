import react from 'react';
import './ProgramOutputPanel.css';

export default class ProgramOutputPanel extends react.Component {
  render() {
    return (
      <div id="program-output-panel" className="panel">
        <div className="codebox">
          {this.props.programOutput.map((line, i) => react.cloneElement(line, {key: i}))}
        </div>
      </div>
    );
  }
}
