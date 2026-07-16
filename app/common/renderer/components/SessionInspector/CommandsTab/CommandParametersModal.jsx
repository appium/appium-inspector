import {Input, Modal, Space, Typography} from 'antd';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';

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
      open={!_.isEmpty(curCommandDetails.details.params)}
      onOk={() => prepareAndRunCommand(curCommandDetails)}
      onCancel={() => clearCurrentCommand()}
      footer={(_, {OkBtn}) => <OkBtn />}
    >
      {_.map(curCommandDetails.details.params, (param, index) => (
        <Space.Compact block key={index} className={styles.commandArgInputRow}>
          <Space.Addon>{formatParamInputLabel(param)}</Space.Addon>
          <Input onChange={(e) => (curCommandParamValsRef.current[index] = e.target.value)} />
        </Space.Compact>
      ))}
    </Modal>
  );
};

export default CommandParametersModal;
