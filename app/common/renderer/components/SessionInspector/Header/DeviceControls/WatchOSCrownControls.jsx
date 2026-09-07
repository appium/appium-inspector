import {IconRotateClockwise2} from '@tabler/icons-react';
import {Button, Form, Input, Popover, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON, INPUT} from '../../../../constants/antd-types.js';

const onRotateCrownSubmit = (values, executeInteraction) => {
  const delta = parseFloat(values.rotations);
  const velocity = values.velocity ? parseFloat(values.velocity) : undefined;
  executeInteraction('mobile:rotateDigitalCrown', {delta, velocity});
};

/**
 * Contents of the popover with parameters for executing 'mobile: rotateDigitalCrown'.
 */
const WatchOSCrownPopoverContents = ({executeInteraction}) => {
  const {t} = useTranslation();

  return (
    <Form
      styles={{content: {textAlign: 'center'}}}
      onFinish={(values) => onRotateCrownSubmit(values, executeInteraction)}
    >
      <Form.Item name="rotations" rules={[{required: true, message: ''}]} style={{marginBottom: '8px'}}>
        <Input placeholder={t('Rotations')} type={INPUT.NUMBER} />
      </Form.Item>
      <Form.Item name="velocity" style={{marginBottom: '8px'}}>
        <Input placeholder={t('Velocity')} type={INPUT.NUMBER} />
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
 * Button + popover to execute 'mobile: rotateDigitalCrown' in watchOS sessions.
 */
const WatchOSCrownControls = ({executeInteraction}) => {
  const {t} = useTranslation();
  const rotateCrownLabel = t('rotateDigitalCrown');

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Tooltip title={rotateCrownLabel} open={showTooltip} onOpenChange={setShowTooltip}>
      <Popover
        styles={{root: {width: '120px'}}}
        content={<WatchOSCrownPopoverContents executeInteraction={executeInteraction} />}
        trigger="click"
        onOpenChange={() => setShowTooltip(false)}
      >
        <Button aria-label={rotateCrownLabel} icon={<IconRotateClockwise2 size={18} />} />
      </Popover>
    </Tooltip>
  );
};

export default WatchOSCrownControls;
