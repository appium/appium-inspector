import {Button, Modal, Select, Typography} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {CAPABILITY_TEMPLATES} from '../../../constants/capability-templates.js';
import {openLink} from '../../../polyfills.js';

const CapabilityTemplates = ({loadCapabilityTemplate}) => {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState();
  const template = CAPABILITY_TEMPLATES.find(({id}) => id === templateId);

  const close = () => {
    setOpen(false);
    setTemplateId(undefined);
  };

  const loadTemplate = () => {
    if (template) {
      loadCapabilityTemplate(template.id);
      close();
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('Use a Template')}</Button>
      <Modal
        open={open}
        title={t('Capability Templates')}
        okText={t('Use Template')}
        cancelText={t('Cancel')}
        okButtonProps={{disabled: !template}}
        onOk={loadTemplate}
        onCancel={close}
      >
        <Typography.Paragraph>{t('capabilityTemplateReplacement')}</Typography.Paragraph>
        <Select
          aria-label={t('Select a Template')}
          placeholder={t('Select a Template')}
          style={{width: '100%', marginBottom: 16}}
          value={templateId}
          onChange={setTemplateId}
          options={CAPABILITY_TEMPLATES.map(({id, name}) => ({value: id, label: name}))}
        />
        {template && <pre>{JSON.stringify(template.caps, null, 2)}</pre>}
        <Typography.Paragraph type="secondary">{t('capabilityTemplateSetup')}</Typography.Paragraph>
        {CAPABILITY_TEMPLATES.map(({id, name, documentation}) => (
          <Button key={id} type="link" onClick={() => openLink(documentation)}>
            {name}
          </Button>
        ))}
      </Modal>
    </>
  );
};

export default CapabilityTemplates;
