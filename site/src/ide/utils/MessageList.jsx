import react from 'react';
import './MessageList.css';

export default class MessageList extends react.Component {
  render() {
    return (
      <div className={"message-list" + (this.props.className != null ? " "+this.props.className : "")}>
        {this.props.children}
      </div>
    );
  }
}
