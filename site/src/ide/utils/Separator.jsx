import react from 'react';
import './Separator.css';

export default class Separator extends react.Component {
  render() {
    return (
      <div className={
        "separator" +
        this.getClassForOrientation(this.getOrientation()) +
        this.getClassForTransparent(this.getTransparent()) +
        this.getClassForSpacing(this.getSpacing())
      }>
        {this.getSpacing() !== "none" ? (<div className="spacer" />) : null}
        <div className="bar" />
        {this.getSpacing() !== "none" ? (<div className="spacer" />) : null}
      </div>
    );
  }

  /* Utils
  -------------------- */

  /* Props
  ---------- */

  getOrientation = () => {
    return this.props.orientation != null ?
      this.props.orientation :
      "cross-axis"
  }

  getSpacing = () => {
    return this.props.spacing != null ?
      this.props.spacing :
      "none"
  }

  getTransparent = () => {
    return this.props.transparent != null ?
      true :
      false
  }

  /* Class Determiners
  ---------- */

  getClassForOrientation = (orientation) => {
    return orientation === "main-axis" ?
      " main-axis" :
      ""
  }

  getClassForSpacing = (spacing) => {
    return {
      "expand": " expand",
      "large": " large",
      "medium": " medium",
      "small": " small",
      "none": ""
    }[spacing];
  }

  getClassForTransparent = (transparent) => {
    return transparent === true ?
      " transparent" :
      ""
  }
}
