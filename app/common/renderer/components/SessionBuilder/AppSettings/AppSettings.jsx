import {IconSettings} from '@tabler/icons-react';
import {Button, Checkbox, Form, Modal, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {PREFER_SOURCE_FIRST} from '../../../../shared/setting-defs.js';
import {getSetting, setSetting} from '../../../polyfills.js';
import ChangeLanguage from './ChangeLanguage.jsx';
import ToggleTheme from './ToggleTheme.jsx';

const AppSettings = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [preferSourceFirst, setPreferSourceFirst] = useState(false);
  const {t} = useTranslation();
  const appSettingsLabel = t('App Settings');

  const openSettings = async () => {
    const saved = await getSetting(PREFER_SOURCE_FIRST).catch(() => false);
    setPreferSourceFirst(saved === true);
    setModalOpen(true);
  };

  const changeRefreshOrder = async (event) => {
    const checked = event.target.checked;
    await setSetting(PREFER_SOURCE_FIRST, checked);
    setPreferSourceFirst(checked);
  };

  return (
    <>
      <Tooltip title={appSettingsLabel}>
        <Button aria-label={appSettingsLabel} icon={<IconSettings size={18} />} onClick={openSettings} />
      </Tooltip>

      <Modal
        title={appSettingsLabel}
        styles={{title: {fontSize: '18px'}}}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        centered
      >
        <Form styles={{label: {fontSize: '16px'}}} layout="vertical">
          <ToggleTheme />
          <ChangeLanguage />
          <Form.Item>
            <Checkbox checked={preferSourceFirst} onChange={changeRefreshOrder}>
              {t('Request page source before screenshot')}
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AppSettings;
