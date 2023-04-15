import react from 'react';
import './Button.css';

export default class Button extends react.Component {
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

    const props = Object.assign(
      // Default
      {},

      // Inherit
      this.getInheritableProps(),

      // Override
      {
        "className": (
          // Our classes
          "button" +
          this.getClassForIconLocation(iconLocation) +

          // Given classes
          (this.props.className != null ? " "+this.props.className : "")
        )
      }
    );

    return (
      <button {...props}>
        {content}
      </button>
    );
  }

  /* Utils
  -------------------- */

  /* Props
  ---------- */

  getInheritableProps = () => {
    const {children, label, icon, showLabel, iconLocation, ...otherProps} = this.props;
    return otherProps;
  }

  getShowLabel = () => (
    this.props.showLabel != null ?
      this.props.showLabel :
      "always"
  )

  getIconLocation = () => (
    this.props.iconLocation != null ?
      this.props.iconLocation :
      "left"
  )
  
  /* Component Factories
  ---------- */

  getLabelComponent = () => {
    const showLabel = this.getShowLabel();

    if (
      showLabel === "always" ||
      showLabel === "only"
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
}
