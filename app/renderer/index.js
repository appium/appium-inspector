import React from 'react';
import { render } from 'react-dom';
import Root from './containers/Root';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import configureStore from './store';

const { store, history } = configureStore();

render(
  <ErrorBoundary>
    <Root store={store} history={history} />
  </ErrorBoundary>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
