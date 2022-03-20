import react from 'react';
import './App.css';

import LanguageSpace from './LanguageSpace';

export default class App extends react.Component {
  render() {
    return (
      <div className="app">
        <LanguageSpace />
      </div>
    );
  }
}
