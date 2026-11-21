import {IconSettings} from '@tabler/icons-react';
import {Button, Checkbox, Form, Modal, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {PREFER_SOURCE_FIRST} from '../../../../shared/setting-defs.js';
import {getSetting, setSetting} from '../../../polyfills.js';
import {notification} from '../../../utils/notification.js';
import ChangeLanguage from './ChangeLanguage.jsx';
import ToggleTheme from './ToggleTheme.jsx';

const AppSettings = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [preferSourceFirst, setPreferSourceFirst] = useState(false);
  const [savingRefreshOrder, setSavingRefreshOrder] = useState(false);
  const {t} = useTranslation();
  const appSettingsLabel = t('App Settings');

  const openSettings = async () => {
    try {
      setPreferSourceFirst(await getSetting(PREFER_SOURCE_FIRST));
      setModalOpen(true);
    } catch (error) {
      notification.error({title: t('Error'), description: error.message});
    }
  };

  const changeRefreshOrder = async (event) => {
    const checked = event.target.checked;
    setSavingRefreshOrder(true);
    try {
      await setSetting(PREFER_SOURCE_FIRST, checked);
      setPreferSourceFirst(checked);
    } catch (error) {
      notification.error({title: t('Error'), description: error.message});
    } finally {
      setSavingRefreshOrder(false);
    }
  };

  return (
    <>
      <Tooltip title={appSettingsLabel}>
        <Button
          aria-label={appSettingsLabel}
          disabled={savingRefreshOrder}
          icon={<IconSettings size={18} />}
          onClick={openSettings}
        />
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
            <Checkbox checked={preferSourceFirst} disabled={savingRefreshOrder} onChange={changeRefreshOrder}>
              {t('Request page source before screenshot')}
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AppSettings;
