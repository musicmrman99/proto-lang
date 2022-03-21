import react from 'react';
import './Message.css';

export default class Message extends react.Component {
  render() {
    return (
      <p>
        <span className={"build-"+this.props.type}>{this.props.type.toUpperCase()}:</span> {this.props.children}
      </p>
    );
  }
}
