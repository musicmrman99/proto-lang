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
    let content = [];
    switch (this.props.tabLocation) {
      case "top": content = [this.getTabs(), this.getActiveTabContents()]; break;
      case "left": content = [this.getTabs(), this.getActiveTabContents()]; break;
      case "bottom": content = [this.getActiveTabContents(), this.getTabs()]; break;
      case "right": content = [this.getActiveTabContents(), this.getTabs()]; break;
      default: throw new Error(`No such tab location: '${this.props.tabLocation}'`);
    }

    const locationClass = {
      "top": "",
      "left": " vertical-location",
      "bottom": "",
      "right": " vertical-location"
    }[this.props.tabLocation];

    return (
      <div className={"tabs" + locationClass}>
        {content}
      </div>
    );
  }

  // Get the list of tab components, if any.
  getTabs() {
    // No children
    if (react.Children.count(this.props.children) === 0) return null;

    const locationClass = {
      "top": "",
      "left": " vertical-location",
      "bottom": "",
      "right": " vertical-location"
    }[this.props.tabLocation];

    const orientationClass = {
      "top": "",
      "left": " left-orientation",
      "right": " right-orientation"
    }[this.props.tabOrientation];

    return (
      <div className={"tabs-header" + locationClass + orientationClass}>
        {react.Children.map(this.props.children, (child) => {
          const tabProps = {
            "key": child.props.tabid,
            "className": (
              "tab" +
              (child.props.tabid === this.state.active ? " active" : "") +
              (child.props.className != null ? " "+child.props.className : "")
            ),
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
    if (react.Children.count(this.props.children) === 0) return null;

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
