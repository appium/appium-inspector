import {IconSettings} from '@tabler/icons-react';
import {Button, Modal, Select, Space, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {IMPORTANT_SOURCE_ATTRS} from '../../../../../shared/setting-defs.js';

/** Choose which source attributes remain visible when the full attribute list is hidden. */
const SourceAttributeSettings = ({importantAttrs, updateImportantAttrs}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const {t} = useTranslation();
  const label = t('Customize Visible Attributes');
  const availableAttrs = [...new Set([...IMPORTANT_SOURCE_ATTRS, ...importantAttrs])].sort();

  return (
    <>
      <Tooltip title={label}>
        <Button
          aria-label={label}
          id="btnImportantAttrs"
          icon={<IconSettings size={18} />}
          onClick={() => setModalOpen(true)}
        />
      </Tooltip>
      <Modal
        title={label}
        styles={{title: {fontSize: '18px'}}}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        centered
      >
        <Space orientation="vertical" style={{width: '100%'}}>
          <span>{t('importantAttributesDescription')}</span>
          <Select
            mode="tags"
            value={importantAttrs}
            options={availableAttrs.map((value) => ({value}))}
            onChange={updateImportantAttrs}
            tokenSeparators={[',']}
            style={{width: '100%'}}
            allowClear
          />
          <Button onClick={() => updateImportantAttrs([...IMPORTANT_SOURCE_ATTRS])}>
            {t('Restore Default Attributes')}
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default SourceAttributeSettings;
