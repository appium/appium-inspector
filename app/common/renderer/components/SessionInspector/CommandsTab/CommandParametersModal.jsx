import {Input, Modal, Space, Typography} from 'antd';
import {useTranslation} from 'react-i18next';

import {isEmpty} from '../../../utils/lang.js';
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
}) => {
  const {t} = useTranslation();

  return (
    <Modal
      title={t('enterMethodParameters', {methodName: curCommandDetails.name})}
      okText={t('Execute Command')}
      open={!isEmpty(curCommandDetails.details.params)}
      onOk={() => prepareAndRunCommand(curCommandDetails)}
      onCancel={() => clearCurrentCommand()}
      footer={(_, {OkBtn}) => <OkBtn />}
    >
      {curCommandDetails.details.params.map((param, index) => (
        <Space.Compact block key={param.name} className={styles.commandArgInputRow}>
          <Space.Addon>{formatParamInputLabel(param)}</Space.Addon>
          <Input onChange={(e) => (curCommandParamValsRef.current[index] = e.target.value)} />
        </Space.Compact>
      ))}
    </Modal>
  );
};

export default CommandParametersModal;
