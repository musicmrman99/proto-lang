import react from 'react';
import './App.css';

import { configDefault } from '../core/Config';

import Toolbar from './Toolbar';
import LanguageSpace from './LanguageSpace';
import ExecutionSpace from './ExecutionSpace';
import { TabsContext } from './utils/Tabs';
import { Trees, TraversalConflictPriority, Selectors } from '../utils/trees';

export default class App extends react.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Build Input
      protoSource: "",

      // Build Config
      buildConfig: configDefault,
      buildConfigOverride: {}, // null = invalid config

      // Build Output
      buildLog: {
        success: null,
        output: []
      },
      ast: null, // null = not yet built, OR failed to build

      // Run Input
      programInput: "",

      // Run Output
      programOutput: [],

      // Active tabs
      activeTabs: []
    };
  }

  render() {
    const activeTabsManager = {
      active: this.state.activeTabs,
      activate: (tab) => this.setState({
        activeTabs: this.state.activeTabs.concat([tab])
      }),
      deactivate: (tab) => this.setState({activeTabs:
        this.state.activeTabs.filter((eachTab) => eachTab !== tab)
      })
    };

    return (
      <div id="app">
        <TabsContext.Provider value={activeTabsManager}>
          <header>
            <Toolbar
              protoSource={this.state.protoSource}
              buildConfig={this.state.buildConfig}
              ast={this.state.ast}
              programInput={this.state.programInput}

              onBuild={(ast, log) => this.setState({ast: ast, buildLog: log})}
              onRun={(result, log) => this.setState({programOutput: log.output})}
            />
          </header>

          <main>
            <LanguageSpace
              protoSource={this.state.protoSource}

              onProtoSourceChange={(protoSource) => this.setState({protoSource: protoSource})}
            />

            <ExecutionSpace
              buildConfig={this.state.buildConfig}
              buildConfigOverride={this.state.buildConfigOverride}
              ast={this.state.ast}
              buildLog={this.state.buildLog}
              programInput={this.state.programInput}
              programOutput={this.state.programOutput}

              onBuildConfigOverrideChange={(buildConfigOverride) => this.setState({
                buildConfigOverride: buildConfigOverride,
                buildConfig: buildConfigOverride == null ? null : Trees.translate(
                  [buildConfigOverride, configDefault],
                  null, // no filter
                  Selectors.first,
                  {},
                  {
                    // Always use the tree with the longest path for each item
                    // (ie. ignore omitted items in earlier trees)
                    conflictPriority: TraversalConflictPriority.NON_LEAF
                  }
                )
              })}
              onProgramInputChange={(programInput) => this.setState({programInput: programInput})}
            />
          </main>
        </TabsContext.Provider>
      </div>
    );
  }
}
