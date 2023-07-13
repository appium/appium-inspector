import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './containers/Root';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import store from './store';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <Root store={store} />
  </ErrorBoundary>
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default;
    root.render(
      <AppContainer>
        <NextRoot store={store} />
      </AppContainer>
    );
  });
}
