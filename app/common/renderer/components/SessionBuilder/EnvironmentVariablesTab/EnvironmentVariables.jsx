import {IconPlus, IconTrash} from '@tabler/icons-react';
import {Button, Checkbox, Col, Form, Input, Popconfirm, Row, Space, Tooltip} from 'antd';
import {useEffect, useMemo, useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {findDuplicateEnvVarNames} from '../../../utils/env-vars.js';

import builderStyles from '../SessionBuilder.module.css';
import styles from './EnvironmentVariables.module.css';

const whitespaces = /^\s|\s$/;

const getNameTooltipMsg = (name, duplicateNames, t) => {
  if (typeof name === 'string' && name.trim() && duplicateNames.has(name.trim())) {
    return t('duplicateEnvVarNameError');
  }
  if (typeof name === 'string' && whitespaces.test(name)) {
    return t('whitespaceDetected');
  }
};

const EnvironmentVariables = ({envVars = [], addEnvVar, removeEnvVar, setEnvVarParam}) => {
  const {t} = useTranslation();
  const addLabel = t('Add');
  const deleteLabel = t('Delete');
  const secretLabel = t('Secret');

  const latestEnvVarNameRef = useRef(null);
  const previousCountRef = useRef(envVars.length);

  const duplicateNames = useMemo(() => findDuplicateEnvVarNames(envVars), [envVars]);

  useEffect(() => {
    if (
      envVars.length > previousCountRef.current &&
      latestEnvVarNameRef.current &&
      !latestEnvVarNameRef.current.input?.value
    ) {
      latestEnvVarNameRef.current.focus();
    }
    previousCountRef.current = envVars.length;
  }, [envVars.length]);

  const handlePressEnter = (isLast) => {
    if (isLast) {
      addEnvVar();
    }
  };

  return (
    <Form className={styles.envVarsForm}>
      <p className={`${builderStyles.localDesc} ${styles.envVarsDescription}`}>
        {t('environmentVariablesDescription', {placeholder: '${VAR_NAME}'})}
      </p>
      {envVars.map((envVar, index) => {
        const isLast = index === envVars.length - 1;
        const trimmedName = typeof envVar.name === 'string' ? envVar.name.trim() : '';
        const isDuplicate = Boolean(trimmedName && duplicateNames.has(trimmedName));
        const nameTooltip = getNameTooltipMsg(envVar.name, duplicateNames, t);
        const ValueInput = envVar.isSecret ? Input.Password : Input;

        return (
          <Row gutter={8} key={envVar.id}>
            <Col span={7}>
              <Form.Item>
                <Tooltip title={nameTooltip} open={Boolean(nameTooltip)}>
                  <Input
                    id={`envVarName_${envVar.id}`}
                    placeholder={t('Name')}
                    value={envVar.name}
                    status={isDuplicate ? 'error' : ''}
                    onChange={(e) => setEnvVarParam(envVar.id, 'name', e.target.value)}
                    ref={isLast ? latestEnvVarNameRef : null}
                    className={styles.envVarBoxFont}
                  />
                </Tooltip>
              </Form.Item>
            </Col>
            <Col flex="1">
              <Form.Item>
                <ValueInput
                  id={`envVarValue_${envVar.id}`}
                  placeholder={t('Value')}
                  value={envVar.value}
                  onChange={(e) => setEnvVarParam(envVar.id, 'value', e.target.value)}
                  onPressEnter={() => handlePressEnter(isLast)}
                  className={styles.envVarBoxFont}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item>
                <Space>
                  <Tooltip title={t('secretEnvVarTooltip')} placement="right">
                    <Checkbox
                      aria-label={secretLabel}
                      checked={Boolean(envVar.isSecret)}
                      onChange={(e) => setEnvVarParam(envVar.id, 'isSecret', e.target.checked)}
                    >
                      {secretLabel}
                    </Checkbox>
                  </Tooltip>
                  <Tooltip title={deleteLabel} placement="right">
                    <Popconfirm
                      zIndex={4}
                      title={t('confirmDeletion')}
                      okText={t('OK')}
                      cancelText={t('Cancel')}
                      onConfirm={() => removeEnvVar(envVar.id)}
                    >
                      <Button aria-label={deleteLabel} icon={<IconTrash size={18} />} />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        );
      })}
      <Row gutter={8}>
        <Col span={24}>
          <Tooltip title={addLabel} placement="right">
            <Button
              aria-label={addLabel}
              id="btnAddEnvVar"
              icon={<IconPlus size={18} />}
              onClick={addEnvVar}
              className={styles.addEnvVarButton}
            />
          </Tooltip>
        </Col>
      </Row>
    </Form>
  );
};

export default EnvironmentVariables;
