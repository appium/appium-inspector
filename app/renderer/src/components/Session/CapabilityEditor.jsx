import {DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Checkbox, Col, Form, Input, Modal, Row, Select, Tooltip} from 'antd';
import React, {useEffect, useRef} from 'react';

import {ROW} from '../../constants/antd-types';
import CapabilityControl from './CapabilityControl.jsx';
import FormattedCaps from './FormattedCaps.jsx';
import SessionStyles from './Session.module.css';

const whitespaces = /^\s|\s$/;

const whitespaceMsg = (value, t) => {
  const leadingSpace = /^\s/.test(value);
  const trailingSpace = /\s$/.test(value);

  if (leadingSpace || trailingSpace) {
    return t('whitespaceDetected');
  }
};

// Callback when the type of a capability is changed
const handleSetType = (setCapabilityParam, caps, index, type) => {
  setCapabilityParam(index, 'type', type);

  // Translate the current value to the new type
  let translatedValue = caps[index].value;
  switch (type) {
    case 'boolean':
      if (translatedValue === 'true') {
        translatedValue = true;
      } else if (translatedValue === 'false') {
        translatedValue = false;
      } else {
        translatedValue = !!translatedValue;
      }
      break;
    case 'number':
      translatedValue = parseInt(translatedValue, 10) || 0;
      break;
    case 'text':
    case 'json_object':
    case 'object':
      translatedValue = translatedValue + '';
      break;
    case 'file':
      translatedValue = '';
      break;
    default:
      break;
  }
  setCapabilityParam(index, 'value', translatedValue);
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

  const onSaveAsOk = () => saveSession(server, serverType, caps, {name: saveAsText});
  const latestCapField = useRef();

  // if we have more than one cap and the most recent cap name is empty, it means we've just
  // added a new cap field, so focus that input element. But only do this once, so we don't annoy
  // the user if they decide to unfocus and do something else.
  useEffect(() => {
    if (
      caps.length > 1 &&
      !latestCapField.current.input.value &&
      !latestCapField.current.__didFocus
    ) {
      latestCapField.current.focus();
      latestCapField.current.__didFocus = true;
    }
  }, [caps.length, latestCapField]);

  return (
    <Row type={ROW.FLEX} align="top" justify="start" className={SessionStyles.capsFormRow}>
      <Col order={1} span={12} className={SessionStyles.capsFormCol}>
        <Form className={SessionStyles.newSessionForm}>
          {caps.map((cap, index) => (
            <Row gutter={8} key={index}>
              <Col span={7}>
                <Form.Item>
                  <Tooltip title={whitespaceMsg(cap.name, t)} open={whitespaces.test(cap.name)}>
                    <Input
                      disabled={isEditingDesiredCaps}
                      id={`desiredCapabilityName_${index}`}
                      placeholder={t('Name')}
                      value={cap.name}
                      onChange={(e) => setCapabilityParam(index, 'name', e.target.value)}
                      ref={index === caps.length - 1 ? latestCapField : ''}
                      className={SessionStyles.capsBoxFont}
                    />
                  </Tooltip>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item>
                  <Select
                    disabled={isEditingDesiredCaps}
                    defaultValue={cap.type}
                    onChange={(val) => handleSetType(setCapabilityParam, caps, index, val)}
                  >
                    <Select.Option value="text">{t('text')}</Select.Option>
                    <Select.Option value="boolean">{t('boolean')}</Select.Option>
                    <Select.Option value="number">{t('number')}</Select.Option>
                    <Select.Option value="object">{t('JSON object')}</Select.Option>
                    <Select.Option value="file">{t('filepath')}</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item>
                  <Tooltip title={whitespaceMsg(cap.value, t)} open={whitespaces.test(cap.value)}>
                    <CapabilityControl
                      {...props}
                      cap={cap}
                      id={`desiredCapabilityValue_${index}`}
                      onSetCapabilityParam={(value) => setCapabilityParam(index, 'value', value)}
                      onPressEnter={index === caps.length - 1 ? addCapability : () => {}}
                    />
                  </Tooltip>
                </Form.Item>
              </Col>
              <Col span={2}>
                <div className={SessionStyles.btnDeleteCap}>
                  <Form.Item>
                    <Button
                      {...{disabled: caps.length <= 1 || isEditingDesiredCaps}}
                      icon={<DeleteOutlined />}
                      onClick={() => removeCapability(index)}
                    />
                  </Form.Item>
                </div>
              </Col>
            </Row>
          ))}
          <Row>
            <Col span={22}>
              <Form.Item>
                <Checkbox
                  checked={addVendorPrefixes}
                  onChange={(e) => setAddVendorPrefixes(e.target.checked)}
                >
                  {t('autoAddPrefixes')}
                </Checkbox>
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item>
                <Button
                  disabled={isEditingDesiredCaps}
                  id="btnAddDesiredCapability"
                  icon={<PlusOutlined />}
                  onClick={addCapability}
                  className={SessionStyles['add-desired-capability-button']}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Col>
      <Col order={2} span={12} className={SessionStyles.capsFormattedCol}>
        <FormattedCaps {...props} />
        <Modal
          open={showSaveAsModal}
          title={t('Save Capability Set As')}
          okText={t('Save')}
          cancelText={t('Cancel')}
          onCancel={hideSaveAsModal}
          onOk={onSaveAsOk}
        >
          <Input
            onChange={(e) => setSaveAsText(e.target.value)}
            addonBefore={t('Name')}
            value={saveAsText}
            onPressEnter={onSaveAsOk}
            status={isDuplicateCapsName ? 'error' : ''}
          />
          {isDuplicateCapsName && (
            <p className={SessionStyles.errorMessage}> {t('duplicateCapabilityNameError')}</p>
          )}
        </Modal>
      </Col>
    </Row>
  );
};

export default CapabilityEditor;
