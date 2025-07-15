import {createRoot} from 'react-dom/client';

import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import Root from './Root.jsx';
import store from './store.js';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <Root store={store} />
  </ErrorBoundary>,
);
