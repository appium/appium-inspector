import {IconSettings} from '@tabler/icons-react';
import {Button, Form, InputNumber, Modal, Select, Space, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {IMPORTANT_SOURCE_ATTRS} from '../../../../../shared/setting-defs.js';
import {MAX_SOURCE_EXPANSION_DEPTH} from '../../../../utils/source-tree-expansion.js';

/**
 * Settings for the app source, including expansion depth and visible element attributes.
 */
const SourceSettings = ({importantAttrs, updateImportantAttrs, expansionDepth, updateExpansionDepth}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const {t} = useTranslation();
  const settingsLabel = t('Source Settings');
  const expansionDepthLabel = t('Source Expansion Depth');
  const customizeAttrsLabel = t('Customize Visible Attributes');
  const availableAttrs = [...new Set([...IMPORTANT_SOURCE_ATTRS, ...importantAttrs])].sort();

  return (
    <>
      <Tooltip title={settingsLabel}>
        <Button aria-label={settingsLabel} icon={<IconSettings size={18} />} onClick={() => setModalOpen(true)} />
      </Tooltip>
      <Modal
        title={settingsLabel}
        styles={{title: {fontSize: '18px'}}}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        centered
      >
        <Form styles={{label: {fontSize: '16px'}}} layout="vertical">
          <Form.Item label={expansionDepthLabel}>
            <Space orientation="vertical">
              <span>{t('sourceExpansionDepthDescription')}</span>
              <InputNumber
                aria-label={expansionDepthLabel}
                mode="spinner"
                min={1}
                max={MAX_SOURCE_EXPANSION_DEPTH}
                precision={0}
                value={expansionDepth}
                onChange={updateExpansionDepth}
                changeOnWheel
              />
            </Space>
          </Form.Item>
          <Form.Item label={customizeAttrsLabel}>
            <Space orientation="vertical">
              <span>{t('importantAttributesDescription')}</span>
              <Select
                aria-label={customizeAttrsLabel}
                mode="tags"
                value={importantAttrs}
                options={availableAttrs.map((value) => ({value}))}
                onChange={updateImportantAttrs}
                tokenSeparators={[',']}
                allowClear
              />
              <Button onClick={() => updateImportantAttrs(IMPORTANT_SOURCE_ATTRS)}>
                {t('Restore Default Attributes')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SourceSettings;
