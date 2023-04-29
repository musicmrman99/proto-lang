import react from 'react';
import './Panel.css';

export default class Panel extends react.Component {
  render() {
    return (
      <div id={this.props.id} className="panel">
        {this.props.children}
      </div>
    );
  }
}
