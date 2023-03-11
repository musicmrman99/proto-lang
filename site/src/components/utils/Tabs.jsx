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
      active: null,
      hovered: false // For the purposes of showLabel="hover"
    };
  }

  render() {
    const location = this.getLocation();

    const tabsElem = (<react.Fragment key="tabs-header">{this.getTabs(location)}</react.Fragment>);
    const activeTabContentsElem = (<react.Fragment key="tab-content">{this.getActiveTabContents()}</react.Fragment>);

    let content = [];
    switch (location) {
      case "top":
      case "left":
        content = [tabsElem, activeTabContentsElem]; break;

      case "bottom":
      case "right":
        content = [activeTabContentsElem, tabsElem]; break;

      default:
    }

    return (
      <div className={"tabs" + this.getClassForLocation(location)}>
        {content}
      </div>
    );
  }

  // Get the list of tab components, if any.
  getTabs = (location) => {
    // No children
    if (react.Children.count(this.props.children) === 0) return null;

    return (
      <div
        className={"tabs-header" + this.getClassForLocation(location)}
        onMouseEnter={this.hoveredIn}
        onMouseLeave={this.hoveredOut}
      >
        {react.Children.map(this.props.children, this.getTab)}
      </div>
    );
  }

  getTab = (child) => {
    const iconLocation = this.getIconLocation();

    const labelElem = this.getLabelComponentFor(child);
    const iconElem = this.getIconComponentFor(child);

    let content = [];
    switch (iconLocation) {
      case "top":
      case "left":
        content = [iconElem, labelElem]; break;

      case "bottom":
      case "right":
        content = [labelElem, iconElem]; break;

      default:
    }

    const tabProps = {
      "key": child.props.tabid,
      "id": child.props.id,
      "className": (
        // Our classes
        "tab" +
        this.getClassForActiveState(child) +
        this.getClassForIconLocation(iconLocation) +

        // Given classes
        (child.props.className != null ? " "+child.props.className : "")
      ),
      [this.props.swapEvent]: () => this.activateTab(child.props.tabid)
    };

    return (
      <button {...tabProps}>
        {content}
      </button>
    );
  }

  // Get the content of the active tab, if any.
  getActiveTabContents = () => {
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

  /* Actions
  -------------------- */

  // Active the tab with the given tab ID
  activateTab = (tabid) => {
    this.setState({active: tabid});
  }

  hoveredIn = () => {
    this.setState({hovered: true});
  }
  hoveredOut = () => {
    this.setState({hovered: false});
  }

  /* Utils
  -------------------- */

  /* Props
  ---------- */

  getShowLabel = () => (
    this.props.showLabel != null ?
      this.props.showLabel :
      "always"
  )

  getLocation = () => (
    this.props.location != null ?
      this.props.location :
      "top"
  );

  getIconLocation = () => (
    this.props.iconLocation != null ?
      this.props.iconLocation :
      this.getLocation() // Default to same as location
  );

  /* Coupled Props
  ---------- */

  getIconFor = (child) => (
    child.props.icon != null ?
      child.props.icon :
      null // Undefined -> Null
  )

  /* Class Determiners
  ---------- */

  getClassForLocation = (location) => {
    return {
      "top": "",
      "left": " location-vertical",
      "bottom": "",
      "right": " location-vertical"
    }[location];
  }

  getClassForIconLocation = (iconLocation) => {
    return {
      "top": " icon-location-vertical",
      "left": "",
      "bottom": " icon-location-vertical",
      "right": ""
    }[iconLocation];
  }

  getClassForActiveState = (child) => (
    child.props.tabid === this.state.active ?
      " active" :
      ""
  );

  /* Component Factories
  ---------- */

  getLabelComponentFor = (child) => {
    const showLabel = this.getShowLabel();

    if (
      showLabel === "always" ||
      showLabel === "only" ||
      (showLabel === "hover" && this.state.hovered)
    ) {
      return (<span key="label">{child.props.label}</span>)
    }
    return null;
  }

  getIconComponentFor = (child) => {
    const icon = this.getIconFor(child);
    const showLabel = this.getShowLabel();

    if (showLabel !== "only") {
      return (
        // Show even if icon is null to allow for space-between alignment, but drop the padding
        <span key="icon" className={icon != null ? "icon material-symbols-outlined" : ""}>
          {icon}
        </span>
      );
    }
    return null;
  };
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
