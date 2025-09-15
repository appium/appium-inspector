import {Button, Input, Modal, Row} from 'antd';

const SiriCommandModal = (props) => {
  const {siriCommandValue, setSiriCommandValue, isSiriCommandModalVisible, t} = props;

  const onSubmit = () => {
    const {applyClientMethod} = props;
    applyClientMethod({
      methodName: 'executeScript',
      args: ['mobile:siriCommand', [{text: siriCommandValue}]],
    });
    onCancel();
  };

  const onCancel = () => {
    const {hideSiriCommandModal} = props;
    hideSiriCommandModal();
  };

  // Footer displays all the buttons at the bottom of the Modal
  return (
    <Modal
      open={isSiriCommandModalVisible}
      title={t('Execute Siri Command')}
      onCancel={onCancel}
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
