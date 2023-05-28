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
          key={this.props.id+"-control"}
          className="message-control"
          showLabel="only" iconLocation="bottom" inline compact
          label={this.state.expanded ? <>&darr;</> : <>&rarr;</>}
          onClick={() => this.setState({ expanded: !this.state.expanded })}
        ></Button>
      ) : (
        <span key={this.props.id+"-control"} />
      ),

      (
        <p
          className="message-type"
          key={this.props.id+"-type"}
        >
          {typeComponent}
        </p>
      ),

      (
        <div
          className="message-content"
          key={this.props.id+"-content"}
        >
          {this.state.expanded ? (
            // Show all children
            splitChildren.map((child) => (
              <p key={child.toString()}>{child}</p>
            ))
          ) : (
            // Show only first child (if any children)
            <p>{splitChildren[0] != null ? splitChildren[0] : null}</p>
          )
          }
        </div>
      )
    ];
  }

  getSplitChildren = (children) => react.Children.toArray(children)
    .flatMap((child) =>
      child.toString() // If child is not a string, convert it to a string
        .split("\n")   // Split lines
        .flatMap(      // Split long lines
          (childStr) => this.splitter(childStr, 50)
        )
    );

  // Based on: https://stackoverflow.com/a/7624821
  splitter = (str, maxLen, breakAfterChars, breakRemChars) => {
    if (str == null) throw new Error("splitter(): must provide a string to split");
    if (maxLen == null) throw new Error("splitter(): must provide a maximum length to split using");
    if (breakAfterChars == null) breakAfterChars = "()[]{}<>-/\\|:,."; // Not [_]
    if (breakRemChars == null) breakRemChars = " \t\n";

    console.log(breakRemChars);
    const breakAfterCharsArr = breakAfterChars.match(/(.|\n){1}/g);
    const breakRemCharsArr = breakRemChars.match(/(.|\n){1}/g);

    const strs = [];
    while (str.length > maxLen) {
      // Find the next position to take the string up to
      const splitStr = str.substring(0, maxLen);
      const breakAfterPos = Math.max(...breakAfterCharsArr.map((char) => splitStr.lastIndexOf(char)));
      const breakRemPos = Math.max(...breakRemCharsArr.map((char) => splitStr.lastIndexOf(char)));

      let highestBreakPos = Math.max(breakAfterPos, breakRemPos);
      if (highestBreakPos < 0) highestBreakPos = null; // Don't match any of them if none are found

      // If any matches are found, pick the longest match in order of precedence,
      // then cut off the matched part according to its char type.
      let [breakPos, continuePos] = [maxLen, maxLen];
      if (breakRemPos >= 0 && highestBreakPos === breakRemPos) {
        [breakPos, continuePos] = [breakRemPos, breakRemPos+1]
      } else if (breakAfterPos >= 0 && highestBreakPos === breakAfterPos) {
        [breakPos, continuePos] = [breakAfterPos+1, breakAfterPos+1]
      }
      strs.push(str.substring(0, breakPos));
      str = str.substring(continuePos);
    }
    strs.push(str);

    return strs;
  }
}
