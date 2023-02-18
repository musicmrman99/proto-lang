import react from 'react';
import './BuildConfigPanel.css';

import jsonschema from 'json-schema';
import { configSchema } from "../../core/Config";

export default class BuildConfigPanel extends react.Component {
  constructor(props) {
    super(props);

    this.state = {
      buildConfigStr: JSON.stringify(this.props.buildConfig),
    };
  }

  render() {
    return (
      <div id="build-config-panel" className="panel">
        <textarea
          className={"codebox " + (this.props.buildConfig != null ? "valid" : "invalid")}
          value={this.state.buildConfigStr}
          onChange={(e) => this.setConfig(e.target.value)}
        ></textarea>
      </div>
    );
  }
  
  setConfig = (configStr) => {
    // Parse JSON
    let config = null;
    try {
      config = JSON.parse(configStr);
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e; // If it's not a syntax error, re-throw
    }

    // Validate JSON;
    let result = jsonschema.validate(config, configSchema);
    if (!result.valid) config = null;

    // Set State
    this.setState({buildConfigStr: configStr});
    this.props.onBuildConfigChange(config);
  }
}
