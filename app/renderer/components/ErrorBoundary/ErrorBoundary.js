import React from 'react';
import ErrorMessage from './ErrorMessage';

export default class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError (error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  render () {
    const { error } = this.state;
    if (error) {
      return <ErrorMessage error={error}/>;
    }
    return this.props.children;
  }
}
