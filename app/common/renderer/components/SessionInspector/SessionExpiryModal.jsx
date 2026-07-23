import {Modal} from 'antd';
import {useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {SESSION_EXPIRY_PROMPT_TIMEOUT} from '../../constants/session-inspector.js';

/**
 * Modal shown when the session is about to expire due to inactivity.
 */
const SessionExpiryModal = ({
  showKeepAlivePrompt,
  keepSessionAlive,
  quitSessionAndReturn,
  setUserWaitTimeout,
}) => {
  const {t} = useTranslation();

  // Ref to persist session expiry timeout without resetting on re-renders
  const sessionExpiryTimeoutRef = useRef(null);

  // If session expiry prompt is shown, start timeout until session is automatically quit.
  // Timeout should remain active until it fires or user acts (keep alive / quit).
  useEffect(() => {
    if (showKeepAlivePrompt) {
      // Create timeout only once while prompt is visible
      if (!sessionExpiryTimeoutRef.current) {
        sessionExpiryTimeoutRef.current = setTimeout(() => {
          quitSessionAndReturn({reason: t('Session closed due to inactivity'), manualQuit: false});
        }, SESSION_EXPIRY_PROMPT_TIMEOUT);
        setUserWaitTimeout(sessionExpiryTimeoutRef.current);
      }
    } else if (sessionExpiryTimeoutRef.current) {
      // Prompt dismissed by user action; clear timeout
      clearTimeout(sessionExpiryTimeoutRef.current);
      sessionExpiryTimeoutRef.current = null;
      setUserWaitTimeout(null);
    }
  }, [quitSessionAndReturn, setUserWaitTimeout, showKeepAlivePrompt, t]);

  return (
    <Modal
      title={t('Session Inactive')}
      open={showKeepAlivePrompt}
      onOk={() => keepSessionAlive()}
      onCancel={() => quitSessionAndReturn()}
      okText={t('Keep Session Running')}
      cancelText={t('Quit Session')}
    >
      <p>{t('Your session is about to expire')}</p>
    </Modal>
  );
};

export default SessionExpiryModal;
