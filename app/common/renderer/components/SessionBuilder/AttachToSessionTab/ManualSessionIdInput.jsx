import {IconLinkPlus} from '@tabler/icons-react';
import {Button, Col, Form, Input, Row} from 'antd';
import _ from 'lodash';
import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';

/**
 * Input field and button for manually entering a session ID to attach to.
 */
const ManualSessionIdInput = ({loadNewSession}) => {
  const {t} = useTranslation();
  const [manualSessionId, setManualSessionId] = useState(null);
  const debouncedSetManualSessionId = useRef(
    _.debounce((value) => setManualSessionId(value), 200),
  ).current;

  return (
    <Form.Item>
      <Row gutter={8}>
        <Col span={8} offset={6}>
          <Input
            placeholder={t('enterSessionID')}
            allowClear={true}
            onChange={(e) => debouncedSetManualSessionId(e.target.value)}
          />
        </Col>
        <Col span={4}>
          <Button
            type={BUTTON.PRIMARY}
            disabled={!manualSessionId || manualSessionId.trim() === ''}
            onClick={() => loadNewSession(null, manualSessionId)}
            icon={<IconLinkPlus size={18} />}
          >
            {t('attachToSession')}
          </Button>
        </Col>
      </Row>
    </Form.Item>
  );
};

export default ManualSessionIdInput;
