import react from "react";
import './LanguageSpace.css'

export default class LanguageSpace extends react.Component {
  render() {
    return (
      <div className="language-space">
        <div className="language-space-header">
          <h2>Proto Input</h2>
          <p>Input your proto source code here ...</p>
        </div>
        <textarea className="language-space-input"></textarea>
      </div>
    );
  }
}
