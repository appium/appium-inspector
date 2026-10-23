import './i18next.js';
import {Alert} from 'antd';
import {Suspense, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Provider, useDispatch} from 'react-redux';
import {MemoryRouter} from 'react-router';

import {attachToExternalSession} from './actions/SessionBuilder.js';
import SessionInspectorPage from './components/SessionInspector/SessionInspector.jsx';
import Spinner from './components/Spinner/Spinner.jsx';
import {ELEMENT_ANALYSIS_TYPES} from './embedded/element-explorer-client.js';
import {
  EMBEDDED_MESSAGE_TYPES,
  EmbeddedProtocolError,
  createEmbeddedBridge,
  resolveHostOrigin,
  setEmbeddedBridge,
  validateHostMessage,
} from './embedded/protocol.js';
import {ThemeProvider} from './providers/ThemeProvider.jsx';
import store from './store.js';

const EmbeddedInspector = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState({connected: false, error: null});

  useEffect(() => {
    let hostOrigin;
    try {
      hostOrigin = resolveHostOrigin(window.location.href, import.meta.env.VITE_EMBEDDED_HOST_ORIGIN);
    } catch (error) {
      setStatus({connected: false, error: error.message});
      return;
    }

    const bridge = createEmbeddedBridge(window.parent, hostOrigin);
    setEmbeddedBridge(bridge);
    let connectionStarted = false;

    const onMessage = async (event) => {
      // The explorer validates these replies against its own parent, origin and request.
      if (event.data?.type === ELEMENT_ANALYSIS_TYPES.UPDATE) {
        return;
      }
      let payload;
      try {
        payload = validateHostMessage(event, window.parent, hostOrigin);
      } catch (error) {
        if (error instanceof EmbeddedProtocolError && !['INVALID_SOURCE', 'INVALID_ORIGIN'].includes(error.code)) {
          bridge.post(EMBEDDED_MESSAGE_TYPES.ERROR, {code: error.code, message: error.message});
        }
        return;
      }

      if (connectionStarted) {
        bridge.post(EMBEDDED_MESSAGE_TYPES.ERROR, {
          code: 'ALREADY_CONNECTED',
          message: 'The embedded Inspector accepts exactly one connection handshake',
        });
        return;
      }
      connectionStarted = true;

      try {
        await dispatch(attachToExternalSession(payload));
        setStatus({connected: true, error: null});
        bridge.post(EMBEDDED_MESSAGE_TYPES.CONNECTED, {sessionId: payload.sessionId});
      } catch (error) {
        connectionStarted = false;
        setStatus({connected: false, error: error.message});
        bridge.post(EMBEDDED_MESSAGE_TYPES.ERROR, {code: 'ATTACH_FAILED', message: error.message});
      }
    };

    window.addEventListener('message', onMessage);
    bridge.post(EMBEDDED_MESSAGE_TYPES.READY);
    return () => {
      window.removeEventListener('message', onMessage);
      setEmbeddedBridge(null);
    };
  }, [dispatch]);

  if (status.error) {
    return <Alert type="error" showIcon message="Embedded Inspector error" description={status.error} />;
  }
  return status.connected ? <SessionInspectorPage /> : <Spinner />;
};

const container = document.getElementById('root');

createRoot(container).render(
  <Provider store={store}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/embedded']}>
        <Suspense fallback={<Spinner />}>
          <EmbeddedInspector />
        </Suspense>
      </MemoryRouter>
    </ThemeProvider>
  </Provider>,
);
