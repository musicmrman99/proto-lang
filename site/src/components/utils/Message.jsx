import react from 'react';
import './Message.css';

import Button from './Button';

/**
 * A graphical message.
 * 
 * If a type is given, the CSS class of the message is set as `{type}-message`.
 * Any styles for this class must be applied by the component that created the message.
 * This class comes with no message styles. It is recommended to scope the styles to the
 * caller only, as other components  may use this component.
 * 
 * If the message contains multiple elements (eg. is a JS array) or lines (ie. contains
 * newline characters), each element and line will be placed in a paragraphs indented
 * under the type paragraph, each with the CSS class `message-line`. There is a default
 * style for this class, but it may be overriden.
 * 
 * Note that the props of a message should be *immutable* - once a message is given, it
 * cannot be un-given. As such, if they are needed at all, keys for Messages must always
 * be UUIDs.
 * 
 * @prop {string} type The optional type of the message.
 * @prop {string} children The message contents.
 */
export default class Message extends react.Component {
  constructor(props) {
    super(props);

    const splitChildren = this.getSplitChildren(this.props.children);
    this.state = {
      expanded: splitChildren.length > 1
    };
  }

  render() {
    const typeComponent = this.props.type != null ? (
      <span className={this.props.type+" message-type"}>
        {this.props.type.toUpperCase()}
      </span>
    ) : null;

    const splitChildren = this.getSplitChildren(this.props.children);

    return [
      splitChildren.length > 1 ? (
        <Button
          className="message-control"
          showLabel="only" iconLocation="bottom" inline compact
          label={this.state.expanded ? <>&darr;</> : <>&rarr;</>}
          onClick={() => this.setState({ expanded: !this.state.expanded })}
        ></Button>
      ) : (
        <span />
      ),

      <p className="message-type">{typeComponent}</p>,

      <div className="message-content">
        {splitChildren.map((child) => (
          <p>{child}</p>
        ))}
      </div>
    ];
  }

  getSplitChildren = (children) => react.Children.toArray(children)
    .flatMap((child) => typeof child === "string" ? child.split("\n") : [child]);
}
