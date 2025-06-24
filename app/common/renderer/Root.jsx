import {App, ConfigProvider, Layout, theme} from 'antd';
import {Suspense} from 'react';
import {Provider} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router';

import Notification from './components/Notification';
import Spinner from './components/Spinner/Spinner.jsx';
import InspectorPage from './containers/InspectorPage';
import SessionPage from './containers/SessionPage';
import i18n from './i18next';
import {ipcRenderer} from './polyfills';

ipcRenderer.on('appium-language-changed', (event, message) => {
  if (i18n.language !== message.language) {
    i18n.changeLanguage(message.language);
  }
});

const getTheme = () => ({
  algorithm: theme.defaultAlgorithm,
  token: {
    fontSize: 12,
  },
  components: {
    Tabs: {
      titleFontSize: 14,
    },
  },
});

const Root = ({store}) => (
  <Provider store={store}>
    <ConfigProvider theme={getTheme()}>
      <App>
        <Layout>
          <MemoryRouter initialEntries={['/']}>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<SessionPage />} />
                <Route path="/session" element={<SessionPage />} />
                <Route path="/inspector" element={<InspectorPage />} />
              </Routes>
            </Suspense>
          </MemoryRouter>
        </Layout>
        <Notification />
      </App>
    </ConfigProvider>
  </Provider>
);

export default Root;
