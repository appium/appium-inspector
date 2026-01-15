import {IconSettings} from '@tabler/icons-react';
import {Button, Form, Modal, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import ChangeLanguage from './ChangeLanguage.jsx';
import ToggleTheme from './ToggleTheme.jsx';

const AppSettings = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const {t} = useTranslation();

  return (
    <>
      <Tooltip title={t('App Settings')}>
        <Button icon={<IconSettings size={18} />} onClick={() => setModalOpen(true)} />
      </Tooltip>

      <Modal
        title={t('App Settings')}
        styles={{title: {fontSize: '18px'}}}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        centered
      >
        <Form styles={{label: {fontSize: '16px'}}} layout="vertical">
          <ToggleTheme />
          <ChangeLanguage />
        </Form>
      </Modal>
    </>
  );
};

export default AppSettings;
