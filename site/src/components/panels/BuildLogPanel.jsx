import react from 'react';
import './BuildLogPanel.css';

export default class BuildLogPanel extends react.Component {
  render() {
    return (
      <div id="build-log-panel" className="panel">
        <div id="build-output" className={
          "codebox " + {
            [null]: "awaiting",
            [true]: "valid",
            [false]: "invalid"
          }[this.props.buildLog.success]
        }>
          {this.props.buildLog.output.map((message, i) => react.cloneElement(message, {key: i}))}
        </div>
      </div>
    );
  }
}
