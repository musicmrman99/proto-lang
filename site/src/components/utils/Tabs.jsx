import react from "react";
import './Tabs.css';
import Button from "./Button";

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
          defaultDectivateEvent: this.props.deactivateEvent,

          tabsHovered: this.state.hovered
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
    return (
      <TabsContext.Consumer>
        {(tabs) => {
          return (
            <Button
              id={this.props.id}
              key={this.props.tabid}

              label={this.getLabel()}
              icon={this.getIcon()}
              showLabel={this.getShowLabel()}
              iconLocation={this.getIconLocation()}

              className={(
                // Our classes
                "tab" +
                this.getClassForActiveState(tabs) +

                // Given classes
                (this.props.className != null ? " "+this.props.className : "")
              )}

              {...{
                [this.getActivateEvent()]: this.getActivateFn(tabs),
                [this.getDeactivateEvent()]: this.getDeactivateFn(tabs)
              }}
            />
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
    let showLabel = "always";
    if (this.props.defaultShowLabel != null) showLabel = this.props.defaultShowLabel;
    if (this.props.showLabel != null) showLabel = this.props.showLabel;

    // Extra functionality of Tabs over plain Buttons
    if (showLabel === "hover") {
      showLabel = "never";
      if (this.props.tabsHovered) showLabel = "always";
    }

    return showLabel;
  }

  getIconLocation = () => {
    if (this.props.iconLocation != null) return this.props.iconLocation;
    if (this.props.defaultIconLocation != null) return this.props.defaultIconLocation;
    return "left";
  }

  getLabel = () => (
    this.props.label != null ?
      this.props.label :
      null // Undefined -> null
  )

  getIcon = () => (
    this.props.icon != null ?
      this.props.icon :
      null // Undefined -> null
  )

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

  /* Class Determiners
  ---------- */

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
