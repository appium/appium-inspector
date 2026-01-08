import {Checkbox, Col, Collapse, Form, Input, Row} from 'antd';

import {SERVER_ADVANCED_PARAMS, SERVER_TYPES} from '../../../constants/session-builder.js';
import styles from './ServerDetails.module.css';

const AdvancedServerParams = ({server, setServerParam, serverType, t}) => (
  <Row gutter={8}>
    <Col className={styles.advancedSettingsContainerCol}>
      <div className={styles.advancedSettingsContainer}>
        <Collapse
          items={[
            {
              label: t('Advanced Settings'),
              children: (
                <Row>
                  {serverType !== 'lambdatest' && (
                    <Col span={7}>
                      <Form.Item>
                        <Checkbox
                          checked={!!server.advanced.allowUnauthorized}
                          onChange={(e) =>
                            setServerParam(
                              SERVER_ADVANCED_PARAMS.ALLOW_UNAUTHORIZED,
                              e.target.checked,
                              SERVER_TYPES.ADVANCED,
                            )
                          }
                        >
                          {t('allowUnauthorizedCerts')}
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={5} align="right">
                    <Form.Item>
                      <Checkbox
                        checked={!!server.advanced.useProxy}
                        onChange={(e) =>
                          setServerParam(
                            SERVER_ADVANCED_PARAMS.USE_PROXY,
                            e.target.checked,
                            SERVER_TYPES.ADVANCED,
                          )
                        }
                      >
                        {t('Use Proxy')}
                      </Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item>
                      <Input
                        disabled={!server.advanced.useProxy}
                        onChange={(e) =>
                          setServerParam(
                            SERVER_ADVANCED_PARAMS.PROXY,
                            e.target.value,
                            SERVER_TYPES.ADVANCED,
                          )
                        }
                        placeholder={t('Proxy URL')}
                        value={server.advanced.proxy}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </div>
    </Col>
  </Row>
);

export default AdvancedServerParams;
