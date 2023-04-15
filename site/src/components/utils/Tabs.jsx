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
        {react.Children.map(this.props.children, this.getTab)}
      </div>
    );
  }

  getTab = (tab) => {
    const iconLocation = this.getIconLocation();

    const labelElem = this.getLabelComponentFor(tab);
    const iconElem = this.getIconComponentFor(tab);

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
          // Ensure mutual exclusion of activate and deactivate functions if
          // the events they run on are the same.
          let activateFn = () => tabs.activate(tab.props.tabid);
          let deactivateFn = () => tabs.deactivate(tab.props.tabid);
          if (this.props.activateEvent === this.props.deactivateEvent) {
            activateFn = () => this.toggleActive(tabs, tab.props.tabid);
            deactivateFn = () => this.toggleActive(tabs, tab.props.tabid);
          }

          return (
            <button {...{
              "key": tab.props.tabid,
              "id": tab.props.id,
              "className": (
                // Our classes
                "tab" +
                this.getClassForActiveState(tabs, tab) +
                this.getClassForIconLocation(iconLocation) +

                // Given classes
                (tab.props.className != null ? " "+tab.props.className : "")
              ),

              [this.props.activateEvent]: activateFn,
              [this.props.deactivateEvent]: deactivateFn
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

  getIconLocation = () => (
    this.props.iconLocation != null ?
      this.props.iconLocation :
      "left"
  );

  /* Coupled Props
  ---------- */

  getIconFor = (tab) => (
    tab.props.icon != null ?
      tab.props.icon :
      null // Undefined -> Null
  )

  /* Component Factories
  ---------- */

  getLabelComponentFor = (tab) => {
    const showLabel = this.getShowLabel();

    if (
      showLabel === "always" ||
      showLabel === "only" ||
      (showLabel === "hover" && this.state.hovered)
    ) {
      return (<span key="label">{tab.props.label}</span>)
    }
    return null;
  }

  getIconComponentFor = (tab) => {
    const icon = this.getIconFor(tab);
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

  getClassForActiveState = (tabs, tab) => (
    tabs.active.includes(tab.props.tabid) ?
      " active" :
      ""
  );
}

/**
 * Placeholder for a tab's metadata (the tabs are actually rendered by Tabs).
 * @prop {string} tabid The ID for this tab. Must be unique across all tabs in this group of Tabs.
 * @prop {string} label The label for this tab. Will be shown on the tab itself.
 */
export class Tab extends react.Component {
  render() {
    return null;
  }
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
