import React from 'react';
import {createRoot} from 'react-dom/client';

import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Root from './containers/Root';
import store from './store';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <Root store={store} />
  </ErrorBoundary>,
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default;
    root.render(
      <ErrorBoundary>
        <NextRoot store={store} />
      </ErrorBoundary>,
    );
  });
}
