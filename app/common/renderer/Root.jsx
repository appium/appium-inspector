import {Suspense} from 'react';
import {Provider} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router';

import Spinner from './components/Spinner/Spinner.jsx';
import SessionBuilderPage from './containers/SessionBuilderPage.js';
import SessionInspectorPage from './containers/SessionInspectorPage.js';
import i18n from './i18next.js';
import {ipcRenderer} from './polyfills.js';
import {ThemeProvider} from './providers/ThemeProvider.jsx';

ipcRenderer.on('appium-language-changed', (event, message) => {
  if (i18n.language !== message.language) {
    i18n.changeLanguage(message.language);
  }
});

const Root = ({store}) => (
  <Provider store={store}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<SessionBuilderPage />} />
            <Route path="/session" element={<SessionBuilderPage />} />
            <Route path="/inspector" element={<SessionInspectorPage />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    </ThemeProvider>
  </Provider>
);

export default Root;
