import react from 'react';
import './App.css';

import LanguageSpace from './LanguageSpace';
import ExecutionSpace from './ExecutionSpace';

export default class App extends react.Component {
  constructor(props) {
    super(props);

    this.state = {
      protoInput: ""
    };
  }

  render() {
    return (
      <div className="app">
        <LanguageSpace protoInput={this.state.protoInput} onProtoInputChange={(protoInput) => this.setState({protoInput: protoInput})} />
        <ExecutionSpace protoInput={this.state.protoInput} />
      </div>
    );
  }
}
