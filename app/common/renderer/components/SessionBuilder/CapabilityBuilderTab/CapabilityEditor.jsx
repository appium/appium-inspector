import {IconPlus, IconTrash} from '@tabler/icons-react';
import {Button, Checkbox, Col, Form, Input, Row, Select, Space, Splitter, Tooltip} from 'antd';
import {useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {CAPABILITY_TYPES} from '../../../constants/session-builder.js';
import CapabilityJSON from '../CapabilityJSON/CapabilityJSON.jsx';
import CapabilityControl from './CapabilityControl.jsx';

import styles from './CapabilityBuilderTab.module.css';

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
    isNarrow,
    setCapabilityParam,
    caps,
    addCapability,
    removeCapability,
    isEditingDesiredCaps,
    setAddVendorPrefixes,
    addVendorPrefixes,
  } = props;

  const {t} = useTranslation();
  const addLabel = t('Add');
  const deleteLabel = t('Delete');

  const latestCapFieldRef = useRef(null);

  // if we have more than one cap and the most recent cap name is empty,
  // it means we've just added a new cap field, so focus that input element
  useEffect(() => {
    if (caps.length > 1 && latestCapFieldRef.current && !latestCapFieldRef.current.input.value) {
      latestCapFieldRef.current.focus();
    }
  }, [caps.length, latestCapFieldRef]);

  return (
    <Splitter orientation={isNarrow ? 'vertical' : 'horizontal'}>
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
                    options={[
                      {value: CAPABILITY_TYPES.TEXT, label: t('text')},
                      {value: CAPABILITY_TYPES.BOOL, label: t('boolean')},
                      {value: CAPABILITY_TYPES.NUM, label: t('number')},
                      {value: CAPABILITY_TYPES.OBJECT, label: t('JSON object')},
                    ]}
                  />
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
                    <Tooltip title={deleteLabel} placement="right">
                      <Button
                        aria-label={deleteLabel}
                        {...{disabled: caps.length <= 1 || isEditingDesiredCaps}}
                        icon={<IconTrash size={18} />}
                        onClick={() => removeCapability(cap.id)}
                      />
                    </Tooltip>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          ))}
          <Row gutter={8}>
            <Col span={21}>
              <Checkbox
                styles={{root: {minHeight: '32px', alignItems: 'center'}}}
                checked={addVendorPrefixes}
                onChange={(e) => setAddVendorPrefixes(e.target.checked)}
              >
                {t('autoAddPrefixes')}
              </Checkbox>
            </Col>
            <Col span={3}>
              <Tooltip title={addLabel} placement="right">
                <Button
                  aria-label={addLabel}
                  disabled={isEditingDesiredCaps}
                  id="btnAddDesiredCapability"
                  icon={<IconPlus size={18} />}
                  onClick={addCapability}
                  className={styles.addCapabilityButton}
                />
              </Tooltip>
            </Col>
          </Row>
        </Form>
      </Splitter.Panel>
      <Splitter.Panel collapsible>
        <CapabilityJSON {...props} />
      </Splitter.Panel>
    </Splitter>
  );
};

export default CapabilityEditor;
