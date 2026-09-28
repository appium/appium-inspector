import {AutoComplete, Input, Modal, Space, Typography} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {isWindowHandleParameter, loadWindowHandleOptions} from '../../../utils/commands-tab.js';
import {isEmpty} from '../../../utils/common.js';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

const formatParamInputLabel = (param) => {
  const monoName = <span className={inspectorStyles.monoFont}>{param.name}</span>;
  if (param.required) {
    return (
      <>
        <Typography.Text type="danger">*</Typography.Text>&nbsp;{monoName}
      </>
    );
  }
  return monoName;
};

/**
 * Modal for entering command parameters.
 */
const CommandParametersModal = ({
  curCommandDetails,
  curCommandParamValsRef,
  prepareAndRunCommand,
  clearCurrentCommand,
  getWindowHandles,
}) => {
  const {t} = useTranslation();
  const [windowHandles, setWindowHandles] = useState({options: [], loading: false, error: false});

  useEffect(
    () => loadWindowHandleOptions(curCommandDetails, getWindowHandles, setWindowHandles),
    [curCommandDetails, getWindowHandles],
  );

  return (
    <Modal
      title={t('enterMethodParameters', {methodName: curCommandDetails.name})}
      okText={t('Execute Command')}
      open={!isEmpty(curCommandDetails.details.params)}
      onOk={() => prepareAndRunCommand(curCommandDetails)}
      onCancel={() => clearCurrentCommand()}
      footer={(_, {OkBtn}) => <OkBtn />}
    >
      {(curCommandDetails.details.params ?? []).map((param, index) => (
        <Space.Compact block key={param.name} className={styles.commandArgInputRow}>
          <Space.Addon>{formatParamInputLabel(param)}</Space.Addon>
          {isWindowHandleParameter(curCommandDetails, param) ? (
            <AutoComplete
              style={{width: '100%'}}
              options={windowHandles.options}
              onChange={(value) => (curCommandParamValsRef.current[index] = value)}
            />
          ) : (
            <Input onChange={(e) => (curCommandParamValsRef.current[index] = e.target.value)} />
          )}
        </Space.Compact>
      ))}
      {(windowHandles.loading || windowHandles.error) && (
        <Typography.Text type="secondary" role="status">
          {t(windowHandles.loading ? 'loadingWindowHandles' : 'windowHandlesLoadFailed')}
        </Typography.Text>
      )}
    </Modal>
  );
};

export default CommandParametersModal;
