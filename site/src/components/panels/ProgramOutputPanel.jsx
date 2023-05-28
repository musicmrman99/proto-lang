import react from 'react';
import './ProgramOutputPanel.css';

import Panel from './Panel';

import Message from '../utils/Message';
import MessageList from '../utils/MessageList';

export default class ProgramOutputPanel extends react.Component {
  render() {
    return (
      <Panel id="program-output-panel">
        <div className="codebox">
          <MessageList>
            {this.props.programOutput.map((message) => (
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
