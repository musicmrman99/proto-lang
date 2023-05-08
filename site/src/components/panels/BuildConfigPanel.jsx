import react from 'react';
import './BuildConfigPanel.css';

import jsonschema from 'json-schema';
import { configSchema } from "../../core/Config";

import Panel from './Panel';
import { Trees, insertAtPath, resolvePath } from '../../utils/trees';
import Button from '../utils/Button';

export default class BuildConfigPanel extends react.Component {
  constructor(props) {
    super(props);

    this.state = {
      buildConfigOverrideStr: this.props.buildConfigOverride != null ?
        JSON.stringify(this.props.buildConfigOverride, null, 2) :
        "",

      selectedConfigOption: this.props.buildConfig != null ?
        Object.keys(this.flattenPaths(this.props.buildConfig, "."))[0] :
        "" // Won't exist, but HTML will ignore it
    };
  }

  render() {
    return (
      <Panel id="build-config-panel">
        <div id="add-config-option-form">
          <label id="add-config-option-label" htmlFor="add-config-option">Add a config option:</label>

          <select
            id="add-config-option-dropdown"
            value={this.state.selectedConfigOption}
            onChange={(e) => this.setState({selectedConfigOption: e.target.value})
          }>
            {this.props.buildConfig != null ?
              Object.keys(this.flattenPaths(this.props.buildConfig, ".")).map((path) => (
                <option key={path} value={path}>{path}</option>
              )) :
              null
            }
          </select>

          <Button
            id="add-config-option-button"
            label="Add" icon="add"
            showLabel="never"
            onClick={() => this.addConfigOverrideOption(this.state.selectedConfigOption)}
          />
        </div>

        <textarea
          className={"codebox " + (this.props.buildConfigOverride != null ? "valid" : "invalid")}
          value={this.state.buildConfigOverrideStr}
          onChange={(e) => this.setConfigOverrideStr(e.target.value)}
        ></textarea>
      </Panel>
    );
  }

  /* Actions
  -------------------- */

  addConfigOverrideOption = (path) => {
    if (this.props.buildConfigOverride == null) {
      alert("Build config must be in a valid state to be able to add a configuration item automatically.");
      return;
    }

    const newConfigOverride = this.parseConfig(this.state.buildConfigOverrideStr); // Deep copy of buildConfigOverride
    const pathArray = this.state.selectedConfigOption.split(".");
    insertAtPath(newConfigOverride, pathArray, resolvePath(this.props.buildConfig, pathArray), true);

    this.setState({buildConfigOverrideStr: JSON.stringify(newConfigOverride, null, 2)});
    this.props.onBuildConfigOverrideChange(newConfigOverride);
  }

  setConfigOverrideStr = (configOverrideStr) => {
    this.setState({buildConfigOverrideStr: configOverrideStr});
    this.props.onBuildConfigOverrideChange(this.parseConfig(configOverrideStr));
  }

  /* Utils
  -------------------- */

  parseConfig = (configOverrideStr) => {
    // Parse JSON
    let configOverride = null;
    try {
      configOverride = JSON.parse(configOverrideStr);
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e; // If it's not a syntax error, re-throw
    }

    // Validate JSON;
    let result = jsonschema.validate(configOverride, configSchema);
    if (!result.valid) configOverride = null;

    return configOverride
  }

  flattenPaths = (tree, pathSep) => {
    function flattenPathsReducer(accum, mtn) {
      if (mtn.isLeaf) {
        accum[mtn.parentPath.concat(mtn.key).join(pathSep)] = mtn.values[0];
      }
      return accum;
    }

    return Trees.reduce([tree], flattenPathsReducer);
  }
}
