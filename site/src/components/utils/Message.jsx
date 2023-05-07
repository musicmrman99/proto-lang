import react from 'react';
import './Message.css';

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
 * @prop {string} type The optional type of the message.
 * @prop {string} children The message contents.
 */
export default class Message extends react.Component {
  render() {
    const typeComponent = this.props.type != null ? (
      <span className={this.props.type+" message-type"}>
        {this.props.type.toUpperCase()}
      </span>
    ) : null;

    const splitChildren = react.Children.toArray(this.props.children)
      .flatMap((child) => typeof child === "string" ? child.split("\n") : [child]);

    return (
      <div className="message">
        <p>{typeComponent}
          {(splitChildren.length === 1 ? (<> &rarr; {this.props.children}</>) : null)}
          {(splitChildren.length > 1 ? (<> &darr;</>) : null)}
        </p>
        {splitChildren.length > 1 ? splitChildren.map((child) => (
          <p className="message-line">{child}</p>
        )) : null}
      </div>
    );
  }
}
