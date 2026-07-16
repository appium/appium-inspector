import {Button, Input, Modal, Row} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Modal used for entering the Siri command to execute (iOS only).
 */
const SiriCommandModal = ({
  siriCommandValue,
  setSiriCommandValue,
  isSiriCommandModalVisible,
  hideSiriCommandModal,
  applyClientMethod,
}) => {
  const {t} = useTranslation();

  const onSubmit = () => {
    applyClientMethod({
      methodName: 'executeScript',
      args: ['mobile:siriCommand', [{text: siriCommandValue}]],
    });
    hideSiriCommandModal();
  };

  return (
    <Modal
      open={isSiriCommandModalVisible}
      title={t('Execute Siri Command')}
      onCancel={hideSiriCommandModal}
      footer={
        <Button onClick={onSubmit} type="primary">
          {t('Execute Command')}
        </Button>
      }
    >
      <Row>
        {t('Command')}
        <Input.TextArea
          onChange={(e) => setSiriCommandValue(e.target.value)}
          value={siriCommandValue}
        />
      </Row>
    </Modal>
  );
};

export default SiriCommandModal;
