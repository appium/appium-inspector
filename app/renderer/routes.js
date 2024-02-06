import React, {Suspense} from 'react';
import {Route, Routes} from 'react-router-dom';

import i18n from '../configs/i18next.config.renderer';
import Spinner from './components/Spinner/Spinner';
import InspectorPage from './containers/InspectorPage';
import SessionPage from './containers/SessionPage';
import {ipcRenderer} from './polyfills';

ipcRenderer.on('appium-language-changed', (event, message) => {
  if (i18n.language !== message.language) {
    i18n.changeLanguage(message.language);
  }
});

const AllRoutes = () => (
  <Suspense fallback={<Spinner />}>
    <Routes>
      <Route path="/" element={<SessionPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/inspector" element={<InspectorPage />} />
    </Routes>
  </Suspense>
);

export default AllRoutes;
