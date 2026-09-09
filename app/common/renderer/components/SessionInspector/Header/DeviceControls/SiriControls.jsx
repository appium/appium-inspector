import {IconMessageChatbot} from '@tabler/icons-react';
import {Button, Form, Input, Popover, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';

/**
 * Contents of the popover with parameters for executing 'mobile: siriCommand'.
 */
const SiriPopoverContents = ({executeInteraction}) => {
  const {t} = useTranslation();

  return (
    <Form
      styles={{content: {textAlign: 'center'}}}
      onFinish={(values) => executeInteraction('mobile:siriCommand', {text: values.input})}
    >
      <Form.Item name="input" rules={[{required: true, message: ''}]} style={{marginBottom: '8px'}}>
        <Input.TextArea placeholder={t('Command')} rows={3} />
      </Form.Item>
      <Form.Item style={{marginBottom: '0'}}>
        <Button type={BUTTON.PRIMARY} htmlType="submit">
          {t('OK')}
        </Button>
      </Form.Item>
    </Form>
  );
};

/**
 * Button + popover to execute 'mobile: siriCommand' in iOS/iPadOS/tvOS/watchOS sessions.
 */
const SiriControls = ({executeInteraction}) => {
  const {t} = useTranslation();
  const siriLabel = t('Execute Siri Command');

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Tooltip title={siriLabel} open={showTooltip} onOpenChange={setShowTooltip}>
      <Popover
        // styles={{root: {width: '150px'}}}
        content={<SiriPopoverContents executeInteraction={executeInteraction} />}
        trigger="click"
        onOpenChange={() => setShowTooltip(false)}
      >
        <Button aria-label={siriLabel} icon={<IconMessageChatbot size={18} />} />
      </Popover>
    </Tooltip>
  );
};

export default SiriControls;
