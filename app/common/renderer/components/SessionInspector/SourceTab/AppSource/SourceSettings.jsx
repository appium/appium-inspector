import {IconSettings} from '@tabler/icons-react';
import {Button, Modal, Select, Space, Tooltip} from 'antd';
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
        <Space orientation="vertical">
          <label htmlFor="sourceExpansionDepth">{t('Source Expansion Depth')}</label>
          <Select
            id="sourceExpansionDepth"
            aria-label={t('Source Expansion Depth')}
            value={expansionDepth}
            options={Array.from({length: MAX_SOURCE_EXPANSION_DEPTH}, (_, index) => ({
              value: index + 1,
              label: String(index + 1),
            }))}
            onChange={updateExpansionDepth}
          />
          <span>{t('sourceExpansionDepthDescription')}</span>
          <span>{t('Customize Visible Attributes')}</span>
          <span>{t('importantAttributesDescription')}</span>
          <Select
            aria-label={t('Customize Visible Attributes')}
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
      </Modal>
    </>
  );
};

export default SourceSettings;
