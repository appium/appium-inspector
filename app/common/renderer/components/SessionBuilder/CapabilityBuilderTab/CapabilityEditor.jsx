import {DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Splitter,
  Tooltip,
} from 'antd';
import {useEffect, useRef} from 'react';

import {CAPABILITY_TYPES} from '../../../constants/session-builder.js';
import CapabilityJSON from '../CapabilityJSON/CapabilityJSON.jsx';
import builderStyles from '../SessionBuilder.module.css';
import styles from './CapabilityBuilderTab.module.css';
import CapabilityControl from './CapabilityControl.jsx';

const whitespaces = /^\s|\s$/;

const whitespaceMsg = (value, t) => {
  const leadingSpace = /^\s/.test(value);
  const trailingSpace = /\s$/.test(value);

  if (leadingSpace || trailingSpace) {
    return t('whitespaceDetected');
  }
};

// Callback when the type of a capability is changed
const handleSetType = (setCapabilityParam, cap, typeVal) => {
  setCapabilityParam(cap.id, 'type', typeVal);

  // Translate the current value to the new type
  let translatedValue = cap.value;
  switch (typeVal) {
    case CAPABILITY_TYPES.BOOL:
      if (translatedValue === 'true') {
        translatedValue = true;
      } else if (translatedValue === 'false') {
        translatedValue = false;
      } else {
        translatedValue = !!translatedValue;
      }
      break;
    case CAPABILITY_TYPES.NUM:
      translatedValue = parseInt(translatedValue, 10) || 0;
      break;
    case CAPABILITY_TYPES.TEXT:
    case CAPABILITY_TYPES.OBJECT:
      translatedValue = translatedValue + '';
      break;
    default:
      break;
  }
  setCapabilityParam(cap.id, 'value', translatedValue);
};

const CapabilityEditor = (props) => {
  const {
    setCapabilityParam,
    caps,
    addCapability,
    removeCapability,
    saveSession,
    hideSaveAsModal,
    saveAsText,
    showSaveAsModal,
    setSaveAsText,
    isEditingDesiredCaps,
    t,
    setAddVendorPrefixes,
    addVendorPrefixes,
    server,
    serverType,
    isDuplicateCapsName,
  } = props;

  const onSaveAsOk = () => saveSession({server, serverType, caps, name: saveAsText}, true);
  const latestCapFieldRef = useRef(null);

  // if we have more than one cap and the most recent cap name is empty,
  // it means we've just added a new cap field, so focus that input element
  useEffect(() => {
    if (caps.length > 1 && latestCapFieldRef.current && !latestCapFieldRef.current.input.value) {
      latestCapFieldRef.current.focus();
    }
  }, [caps.length, latestCapFieldRef]);

  return (
    <Splitter>
      <Splitter.Panel collapsible resizable={false}>
        <Form className={styles.newSessionForm}>
          {caps.map((cap, index) => (
            <Row gutter={8} key={cap.id}>
              <Col span={7}>
                <Form.Item>
                  <Tooltip title={whitespaceMsg(cap.name, t)} open={whitespaces.test(cap.name)}>
                    <Input
                      disabled={isEditingDesiredCaps}
                      id={`desiredCapabilityName_${cap.id}`}
                      placeholder={t('Name')}
                      value={cap.name}
                      onChange={(e) => setCapabilityParam(cap.id, 'name', e.target.value)}
                      ref={index === caps.length - 1 ? latestCapFieldRef : null}
                      className={styles.capsBoxFont}
                    />
                  </Tooltip>
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item>
                  <Select
                    disabled={isEditingDesiredCaps}
                    value={cap.type}
                    onChange={(val) => handleSetType(setCapabilityParam, cap, val)}
                  >
                    <Select.Option value={CAPABILITY_TYPES.TEXT}>{t('text')}</Select.Option>
                    <Select.Option value={CAPABILITY_TYPES.BOOL}>{t('boolean')}</Select.Option>
                    <Select.Option value={CAPABILITY_TYPES.NUM}>{t('number')}</Select.Option>
                    <Select.Option value={CAPABILITY_TYPES.OBJECT}>
                      {t('JSON object')}
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item>
                  <Tooltip title={whitespaceMsg(cap.value, t)} open={whitespaces.test(cap.value)}>
                    <CapabilityControl
                      {...props}
                      cap={cap}
                      id={`desiredCapabilityValue_${cap.id}`}
                      onSetCapabilityParam={(value) => setCapabilityParam(cap.id, 'value', value)}
                      onPressEnter={index === caps.length - 1 ? addCapability : () => {}}
                    />
                  </Tooltip>
                </Form.Item>
              </Col>
              <Col>
                <Form.Item>
                  <Space>
                    <Tooltip title={t('Enable')} placement="right">
                      <Checkbox
                        disabled={isEditingDesiredCaps}
                        checked={cap.enabled}
                        onChange={(e) => setCapabilityParam(cap.id, 'enabled', e.target.checked)}
                      />
                    </Tooltip>
                    <Tooltip title={t('Delete')} placement="right">
                      <Button
                        {...{disabled: caps.length <= 1 || isEditingDesiredCaps}}
                        icon={<DeleteOutlined />}
                        onClick={() => removeCapability(cap.id)}
                      />
                    </Tooltip>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          ))}
          <Row gutter={8}>
            <Col flex="auto">
              <Form.Item>
                <Checkbox
                  checked={addVendorPrefixes}
                  onChange={(e) => setAddVendorPrefixes(e.target.checked)}
                >
                  {t('autoAddPrefixes')}
                </Checkbox>
              </Form.Item>
            </Col>
            <Col flex="40px">
              <Form.Item>
                <Tooltip title={t('Add')} placement="right">
                  <Button
                    disabled={isEditingDesiredCaps}
                    id="btnAddDesiredCapability"
                    icon={<PlusOutlined />}
                    onClick={addCapability}
                    className={styles.addCapabilityButton}
                  />
                </Tooltip>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Splitter.Panel>
      <Splitter.Panel collapsible>
        <CapabilityJSON {...props} />
        <Modal
          open={showSaveAsModal}
          title={t('Save Capability Set As')}
          okText={t('Save')}
          cancelText={t('Cancel')}
          onCancel={hideSaveAsModal}
          onOk={onSaveAsOk}
        >
          <Space.Compact block>
            <Space.Addon>{t('Name')}</Space.Addon>
            <Input
              onChange={(e) => setSaveAsText(e.target.value)}
              value={saveAsText}
              onPressEnter={onSaveAsOk}
              status={isDuplicateCapsName ? 'error' : ''}
            />
          </Space.Compact>
          {isDuplicateCapsName && (
            <p className={builderStyles.errorMessage}> {t('duplicateCapabilityNameError')}</p>
          )}
        </Modal>
      </Splitter.Panel>
    </Splitter>
  );
};

export default CapabilityEditor;
