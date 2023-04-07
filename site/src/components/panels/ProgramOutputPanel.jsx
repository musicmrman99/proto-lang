import react from 'react';
import './ProgramOutputPanel.css';

import Panel from './Panel';

import Message from '../utils/Message';

export default class ProgramOutputPanel extends react.Component {
  render() {
    return (
      <Panel id="program-output-panel">
        <div className="codebox">
          {this.props.programOutput.map((message, i) => (
            <Message type={message.type} key={i}>
              {message.content}
            </Message>
          ))}
        </div>
      </Panel>
    );
  }
}
