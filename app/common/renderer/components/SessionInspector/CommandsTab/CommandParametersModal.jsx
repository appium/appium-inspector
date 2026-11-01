import {AutoComplete, Input, Modal, Space, Typography} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_SWITCH_TO_WINDOW} from '../../../constants/commands.js';
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
  windowHandles = [],
  prepareAndRunCommand,
  clearCurrentCommand,
}) => {
  const {t} = useTranslation();
  const isSwitchToWindow = curCommandDetails.name === COMMAND_SWITCH_TO_WINDOW && !isEmpty(windowHandles);
  const windowHandleOptions = windowHandles.map((handle) => ({value: handle, label: handle}));

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
          {isSwitchToWindow ? (
            <AutoComplete
              styles={{root: {flex: 1}}}
              options={windowHandleOptions}
              onChange={(value) => (curCommandParamValsRef.current[index] = value)}
            />
          ) : (
            <Input onChange={(e) => (curCommandParamValsRef.current[index] = e.target.value)} />
          )}
        </Space.Compact>
      ))}
    </Modal>
  );
};

export default CommandParametersModal;
