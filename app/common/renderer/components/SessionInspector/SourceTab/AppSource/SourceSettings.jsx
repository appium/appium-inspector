import {IconSettings} from '@tabler/icons-react';
import {Button, Form, InputNumber, Modal, Select, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {IMPORTANT_SOURCE_ATTRS} from '../../../../../shared/setting-defs.js';
import {MAX_SOURCE_EXPANSION_DEPTH} from '../../../../utils/source-tree-expansion.js';

/** Configure source expansion and which attributes remain visible in the compact tree. */
const SourceSettings = ({importantAttrs, updateImportantAttrs, expansionDepth, updateExpansionDepth}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const {t} = useTranslation();
  const label = t('Source Settings');
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
        <Form styles={{label: {fontSize: '16px'}}} layout="vertical">
          <Form.Item
            label={t('Source Expansion Depth')}
            htmlFor="sourceExpansionDepth"
            extra={t('sourceExpansionDepthDescription')}
          >
            <InputNumber
              id="sourceExpansionDepth"
              aria-label={t('Source Expansion Depth')}
              min={1}
              max={MAX_SOURCE_EXPANSION_DEPTH}
              precision={0}
              value={expansionDepth}
              onChange={updateExpansionDepth}
            />
          </Form.Item>
          <Form.Item label={t('Customize Visible Attributes')} extra={t('importantAttributesDescription')}>
            <Select
              aria-label={t('Customize Visible Attributes')}
              mode="tags"
              value={importantAttrs}
              options={availableAttrs.map((value) => ({value}))}
              onChange={updateImportantAttrs}
              tokenSeparators={[',']}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button onClick={() => updateImportantAttrs(IMPORTANT_SOURCE_ATTRS)}>
              {t('Restore Default Attributes')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SourceSettings;
