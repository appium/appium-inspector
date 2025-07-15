import {Checkbox, Col, Collapse, Form, Input, Row} from 'antd';

import {SERVER_TYPES} from '../../constants/session-builder';
import styles from './Session.module.css';

const AdvancedServerParams = ({server, setServerParam, serverType, t}) => (
  <Row gutter={8}>
    <Col className={styles.advancedSettingsContainerCol}>
      <div className={styles.advancedSettingsContainer}>
        <Collapse bordered={true}>
          <Collapse.Panel header={t('Advanced Settings')}>
            <Row>
              {serverType !== 'lambdatest' && (
                <Col span={7}>
                  <Form.Item>
                    <Checkbox
                      checked={!!server.advanced.allowUnauthorized}
                      onChange={(e) =>
                        setServerParam('allowUnauthorized', e.target.checked, SERVER_TYPES.ADVANCED)
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
                      setServerParam('useProxy', e.target.checked, SERVER_TYPES.ADVANCED)
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
                    onChange={(e) => setServerParam('proxy', e.target.value, SERVER_TYPES.ADVANCED)}
                    placeholder={t('Proxy URL')}
                    value={server.advanced.proxy}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Collapse.Panel>
        </Collapse>
      </div>
    </Col>
  </Row>
);

export default AdvancedServerParams;
