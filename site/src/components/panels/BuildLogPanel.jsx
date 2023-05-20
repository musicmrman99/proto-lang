import react from 'react';
import './BuildLogPanel.css';

import Message from '../utils/Message';

import Panel from './Panel';
import MessageList from '../utils/MessageList';

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
          <MessageList>
            {this.props.buildLog.output.map((message) => (
              <Message type={message.type} id={message.id} key={message.id}>
                {message.content}
              </Message>
            ))}
          </MessageList>
        </div>
      </Panel>
    );
  }
}
