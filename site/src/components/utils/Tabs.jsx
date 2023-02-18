import react from "react";
import './Tabs.css';

/**
 * Show a tabbed pane.
 * 
 * Assumes its children are `<Tab />` instances, or otherwise accept the same props.
 */
export class Tabs extends react.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: null
    };
  }

  render() {
    return (
      <div className="tabs">
        {this.getTabs()}
        {this.getActiveTabContents()}
      </div>
    );
  }

  // Get the list of tab components, if any.
  getTabs() {
    if (react.Children.count(this.props.children) === 0) return null;

    return (
      <div className="tabs-header">
        {react.Children.map(this.props.children, (child) => {
          const tabProps = {
            "key": child.props.tabid,
            "className": "tab" + (child.props.className != null ? " "+child.props.className : ""),
            "id": child.props.id,
            [this.props.swapEvent]: () => this.activateTab(child.props.tabid)
          };

          return (
            <button {...tabProps}>
              {child.props.name}
            </button>
          );
        })}
      </div>
    );
  }

  // Get the content of the active tab, if any.
  getActiveTabContents() {
    // No children
    if (react.Children.count(this.props.children) === 0) {
      return null;
    }

    // Nothing active (default to first child)
    if (this.state.active == null) {
      return react.Children.toArray(this.props.children)[0];
    }

    // Selected child
    const first = react.Children.toArray(this.props.children).find((tab) => tab.props.tabid === this.state.active);
    if (first !== undefined) return first;

    // Selected child does not exist (tabs have changed since last selection; reset active tab)
    this.setState({active: null});
  }

  // Active the tab with the given tab ID
  activateTab(tabid) {
    this.setState({active: tabid});
  }
}

/**
 * A wrapper for its children that requires the following props:
 * @prop {string} tabID The ID for this tab. Must be unique across all tabs in this group.
 * @prop {string} name The name for this tab. Will be shown on the tab itself.
 * 
 * The id and className props are forwarded to the underlying element.
 */
export class Tab extends react.Component {
  render() {
    return (
      <div className="tab-content">
        {this.props.children}
      </div>
    )
  }
}
