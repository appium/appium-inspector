import {IconLinkPlus, IconRefresh} from '@tabler/icons-react';
import {Button, Input, Space} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';

import styles from './AttachToSession.module.css';

/**
 * Input field and button for manually entering a session ID to attach to,
 * as well as a button to refresh the list of discovered sessions.
 */
const ManualIdInputAndRefreshBtn = ({loadNewSession, getRunningSessions}) => {
  const {t} = useTranslation();
  const [manualSessionId, setManualSessionId] = useState(null);

  return (
    <div className={styles.discoveredSessionsListControls}>
      <Space.Compact style={{width: '550px'}}>
        <Input
          placeholder={t('enterSessionID')}
          allowClear={true}
          onChange={(e) => setManualSessionId(e.target.value)}
        />
        <Button
          type={BUTTON.PRIMARY}
          disabled={!manualSessionId || manualSessionId.trim() === ''}
          onClick={() => loadNewSession(null, manualSessionId)}
          icon={<IconLinkPlus size={18} />}
        >
          {t('attachToSession')}
        </Button>
      </Space.Compact>
      <Button onClick={getRunningSessions} icon={<IconRefresh size={18} />}>
        {t('refreshDiscoveredSessions')}
      </Button>
    </div>
  );
};

export default ManualIdInputAndRefreshBtn;
