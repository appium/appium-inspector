import {Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router';

import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import Spinner from './components/Spinner/Spinner.jsx';
import SessionBuilderPage from './containers/SessionBuilderPage.js';
import SessionInspectorPage from './containers/SessionInspectorPage.js';
import {ThemeProvider} from './providers/ThemeProvider.jsx';
import store from './store.js';

const container = document.getElementById('root');

createRoot(container).render(
  <ErrorBoundary>
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
  </ErrorBoundary>,
);
