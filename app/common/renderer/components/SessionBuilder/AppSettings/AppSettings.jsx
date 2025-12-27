import {SettingOutlined} from '@ant-design/icons';
import {Button, Form, Modal, Tooltip} from 'antd';
import {useState} from 'react';

import ChangeLanguage from './ChangeLanguage.jsx';
import ToggleTheme from './ToggleTheme.jsx';

const AppSettings = ({t}) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Tooltip title={t('App Settings')}>
        <Button icon={<SettingOutlined />} onClick={() => setModalOpen(true)} />
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
          <ToggleTheme t={t} />
          <ChangeLanguage t={t} />
        </Form>
      </Modal>
    </>
  );
};

export default AppSettings;
