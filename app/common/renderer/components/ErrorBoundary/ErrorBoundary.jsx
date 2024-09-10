import {Component} from 'react';

import {copyToClipboard} from '../../polyfills';
import ErrorMessage from './ErrorMessage.jsx';

const copyTrace = (trace) => {
  copyToClipboard(trace);
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {error};
  }

  render() {
    const {error} = this.state;
    if (error) {
      return <ErrorMessage error={error} copyTrace={copyTrace} />;
    }
    return this.props.children;
  }
}
