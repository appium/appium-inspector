import React, { Suspense } from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import SessionPage from './containers/SessionPage';
import InspectorPage from './containers/InspectorPage';
import Spinner from './components/Spinner/Spinner';
import { ipcRenderer } from './polyfills';
import i18n from '../configs/i18next.config.renderer';

ipcRenderer.on('appium-language-changed', (event, message) => {
  if (i18n.language !== message.language) {
    i18n.changeLanguage(message.language);
  }
});

export default () => (
  <Suspense fallback={<Spinner />}>
    <App>
      <Switch>
        <Route exact path="/">
          <SessionPage />
        </Route>
        <Route path="/session">
          <SessionPage />
        </Route>
        <Route path="/inspector">
          <InspectorPage />
        </Route>
      </Switch>
    </App>
  </Suspense>
);
