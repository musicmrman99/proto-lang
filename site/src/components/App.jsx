import react from 'react';
import './App.css';

import { configDefault } from '../core/Config';

import Toolbar from './Toolbar';
import LanguageSpace from './LanguageSpace';
import ExecutionSpace from './ExecutionSpace';

export default class App extends react.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Build Input
      protoSource: "",

      // Build Config
      buildConfig: configDefault, // null = invalid config

      // Build Output
      buildLog: {
        success: null,
        output: []
      },
      ast: null, // null = not yet built, OR failed to build

      // Run Input
      programInput: "",

      // Run Output
      programOutput: []
    };
  }

  render() {
    return (
      <div id="app">
        <header>
          <Toolbar
            protoSource={this.state.protoSource}
            buildConfig={this.state.buildConfig}
            ast={this.state.ast}
            programInput={this.state.programInput}

            onBuild={(ast, buildLog) => this.setState({ast: ast, buildLog: buildLog})}
            onRun={(programOutput) => this.setState({programOutput: programOutput})}
          />
        </header>

        <main>
          <LanguageSpace
            protoSource={this.state.protoSource}

            onProtoSourceChange={(protoSource) => this.setState({protoSource: protoSource})}
          />

          <ExecutionSpace
            buildConfig={this.state.buildConfig}
            ast={this.state.ast}
            buildLog={this.state.buildLog}
            programInput={this.state.programInput}
            programOutput={this.state.programOutput}

            onBuildConfigChange={(buildConfig) => this.setState({buildConfig: buildConfig})}
            onProgramInputChange={(programInput) => this.setState({programInput: programInput})}
          />
        </main>
      </div>
    );
  }
}
