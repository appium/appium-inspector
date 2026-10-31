import {IconBraces} from '@tabler/icons-react';
import {Button, Card, Modal, Select, Space} from 'antd';
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
      <Button icon={<IconBraces size={18} />} onClick={() => setOpen(true)}>
        {t('Use Template')}
      </Button>
      <Modal
        open={open}
        title={t('Capability Templates')}
        okText={t('Use Template')}
        cancelText={t('Cancel')}
        okButtonProps={{disabled: !template}}
        onOk={loadTemplate}
        onCancel={close}
      >
        <Space orientation="vertical" size="middle" style={{width: '100%'}}>
          <span>{t('capabilityTemplateReplacement')}</span>
          <Select
            aria-label={t('Select a Template')}
            placeholder={t('Select a Template')}
            style={{width: '100%'}}
            value={templateId}
            onChange={setTemplateId}
            options={CAPABILITY_TEMPLATES.map(({id, name}) => ({value: id, label: name}))}
          />
          {template && (
            <Card size="small">
              <pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>{JSON.stringify(template.caps, null, 2)}</pre>
            </Card>
          )}
          {template && <span>{t('capabilityTemplateSetup')}</span>}
          {template && (
            <Button type="link" onClick={() => openLink(template.documentation)}>
              {template.name}
            </Button>
          )}
        </Space>
      </Modal>
    </>
  );
};

export default CapabilityTemplates;
