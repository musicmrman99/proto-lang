import react from 'react';
import './BuildLogPanel.css';

import Message from '../utils/Message';

import Panel from './Panel';

export default class BuildLogPanel extends react.Component {
  render() {
    return (
      <Panel id="build-log-panel">
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
      </Panel>
    );
  }
}
