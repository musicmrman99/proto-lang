import react from "react";
import './LanguageSpace.css'

export default class LanguageSpace extends react.Component {
  render() {
    return (
      <div id="language-space">
        <div id="language-space-header">
          <h2>Language Space</h2>
          <p>Input your proto source code here ...</p>
        </div>

        <textarea
          id="language-space-input"
          className="codebox"
          value={this.props.protoSource}
          onChange={(e) => this.props.onProtoSourceChange(e.target.value)}
        ></textarea>
      </div>
    );
  }
}
