import React, { Component } from 'react';
import { Modal, Button, Input, Row } from 'antd';
import { withTranslation } from '../../util';

class SiriCommandModal extends Component {

  onSubmit () {
    const {
      siriCommandValue,
      hideSiriCommandModal,
      applyClientMethod
    } = this.props;
    applyClientMethod({ methodName: 'executeScript', args: ['mobile:siriCommand', [{text: siriCommandValue}]]});
    hideSiriCommandModal();
  }

  onCancel () {
    const {hideSiriCommandModal} = this.props;
    hideSiriCommandModal();
  }

  render () {
    const {
      siriCommandValue,
      setSiriCommandValue,
      isSiriCommandModalVisible,
      t,
    } = this.props;

    // Footer displays all the buttons at the bottom of the Modal
    return <Modal open={isSiriCommandModalVisible}
      title={t('Execute Siri Command')}
      onCancel={this.onCancel.bind(this)}
      footer=
        {[
          <Button onClick={this.onSubmit.bind(this)} type="primary">{t('Execute Command')}</Button>
        ]}>
      <Row>
        {t('Command')}
        <Input.TextArea onChange={(e) => setSiriCommandValue(e.target.value)} value={siriCommandValue} />
      </Row>
    </Modal>;
  }
}

export default withTranslation(SiriCommandModal);