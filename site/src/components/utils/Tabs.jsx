import react from "react";
import './Tabs.css';

export const TabsContext = react.createContext();

/**
 * Show a tabbed pane.
 * 
 * Assumes its children are `<Tab />` instances, or otherwise accept the same props.
 */
export class Tabs extends react.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false // For showLabel="hover"
    };
  }

  render() {
    if (react.Children.count(this.props.children) === 0) return null;

    return (
      <div
        className="tabs"
        onMouseEnter={this.hoveredIn}
        onMouseLeave={this.hoveredOut}
      >
        {react.Children.map(this.props.children, (tab) => react.cloneElement(tab, {
          defaultShowLabel: this.props.showLabel,
          defaultIconLocation: this.props.iconLocation,
          defaultActivateEvent: this.props.activateEvent,
          defaultDectivateEvent: this.props.deactivateEvent
        }))}
      </div>
    );
  }

  /* Actions
  -------------------- */

  hoveredIn = () => {
    this.setState({hovered: true});
  }
  hoveredOut = () => {
    this.setState({hovered: false});
  }
}

/**
 * Placeholder for a tab's metadata (the tabs are actually rendered by Tabs).
 * @prop {string} tabid The ID for this tab. Must be unique across all tabs in this group of Tabs.
 * @prop {string} label The label for this tab. Will be shown on the tab itself.
 */
export class Tab extends react.Component {
  render() {
    const iconLocation = this.getIconLocation();

    const labelElem = this.getLabelComponent();
    const iconElem = this.getIconComponent();

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

    return (
      <TabsContext.Consumer>
        {(tabs) => {
          return (
            <button {...{
              "key": this.props.tabid,
              "id": this.props.id,
              "className": (
                // Our classes
                "tab" +
                this.getClassForActiveState(tabs) +
                this.getClassForIconLocation(iconLocation) +

                // Given classes
                (this.props.className != null ? " "+this.props.className : "")
              ),

              [this.getActivateEvent()]: this.getActivateFn(tabs),
              [this.getDeactivateEvent()]: this.getDeactivateFn(tabs)
            }}>
              {content}
            </button>
          );
        }}
      </TabsContext.Consumer>
    );
  }

  /* Actions
  -------------------- */

  /**
   * Toggle the active status of the given tab.
   * 
   * Used instead of activateEvent and deactivateEvent if they are the same event.
   * 
   * @param {string} tabid The ID of the tab to toggle the active status of.
   */
  toggleActive = (tabs, tabid) => {
    if (tabs.active.includes(tabid)) {
      tabs.deactivate(tabid);
    } else {
      tabs.activate(tabid);
    }
  }

  /* Utils
  -------------------- */

  /* Props
  ---------- */

  getActivateEvent = () => {
    if (this.props.activateEvent != null) return this.props.activateEvent;
    if (this.props.defaultActivateEvent != null) return this.props.defaultActivateEvent;
    return "onClick";
  }

  getDeactivateEvent = () => {
    if (this.props.deactivateEvent != null) return this.props.deactivateEvent;
    if (this.props.defaultDectivateEvent != null) return this.props.defaultDectivateEvent;
    return "onClick";
  }

  getShowLabel = () => {
    if (this.props.showLabel != null) return this.props.showLabel;
    if (this.props.defaultShowLabel != null) return this.props.defaultShowLabel;
    return "always";
  }

  getIconLocation = () => {
    if (this.props.iconLocation != null) return this.props.iconLocation;
    if (this.props.defaultIconLocation != null) return this.props.defaultIconLocation;
    return "left";
  };

  /* Activation and Deactivation Functions
  ---------- */

  // Ensure mutual exclusion of activate and deactivate functions if
  // the events they run on are the same.

  getActivateFn = (tabs) => (
    this.getActivateEvent() === this.getDeactivateEvent() ?
      () => this.toggleActive(tabs, this.props.tabid) :
      () => tabs.activate(this.props.tabid)
  )
  getDeactivateFn = (tabs) => (
    this.getActivateEvent() === this.getDeactivateEvent() ?
      () => this.toggleActive(tabs, this.props.tabid) :
      () => tabs.deactivate(this.props.tabid)
  )

  /* Component Factories
  ---------- */

  getLabelComponent = () => {
    const showLabel = this.getShowLabel();

    if (
      showLabel === "always" ||
      showLabel === "only" ||
      (showLabel === "hover" && this.state.hovered)
    ) {
      return (<span key="label">{this.props.label}</span>)
    }
    return null;
  }

  getIconComponent = () => {
    const icon = this.props.icon != null ? this.props.icon : null;
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

  /* Class Determiners
  ---------- */

  getClassForIconLocation = (iconLocation) => {
    return {
      "top": " icon-location-vertical",
      "left": "",
      "bottom": " icon-location-vertical",
      "right": ""
    }[iconLocation];
  }

  getClassForActiveState = (tabs) => (
    tabs.active.includes(this.props.tabid) ?
      " active" :
      ""
  );
}

/**
 * Simple enable/disable switch for tab content based on active status of the tab.
 * 
 * This component may be embedded in multiple locations in the component tree to allow
 * multiple components to be the content for a single logical tab.
 * 
 * Requires being in a TabsContext.
 * 
 * @prop {string} tabid The ID of the tab this is content for.
 */
export class TabContent extends react.Component {
  render() {
    return (
      <div className="tab-content">
        <TabsContext.Consumer>
          {(tabs) => tabs.active.includes(this.props.tabid) ? this.props.children : null}
        </TabsContext.Consumer>
      </div>
    );
  }
}
