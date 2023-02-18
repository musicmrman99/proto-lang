import react from 'react';
import './BuildLogPanel.css';

import Message from '../utils/Message';

export default class BuildLogPanel extends react.Component {
  render() {
    return (
      <div id="build-log-panel" className="panel">
        <div className={
          "codebox " + {
            [null]: "awaiting",
            [true]: "valid",
            [false]: "invalid"
          }[this.props.buildLog.success]
        }>
          {this.props.buildLog.output.map((message, i) => (
            <Message type={message.type} key={i}>
              {message.content}
            </Message>
          ))}
        </div>
      </div>
    );
  }
}
