import react from 'react';
import './ProgramOutputPanel.css';

import Message from '../utils/Message';

export default class ProgramOutputPanel extends react.Component {
  render() {
    return (
      <div id="program-output-panel" className="panel">
        <div className="codebox">
          {this.props.programOutput.map((message, i) => (
            <Message type={message.type} key={i}>
              {message.content}
            </Message>
          ))}
        </div>
      </div>
    );
  }
}
