import {Button, Col, Modal, Row} from 'antd';
import _ from 'lodash';
import React from 'react';

import {BUTTON} from '../../constants/antd-types';
import CloudProviders from './CloudProviders';
import SessionStyles from './Session.css';

const CloudProviderSelector = (props) => {
  const {visibleProviders = [], isAddingCloudProvider, stopAddCloudProvider, t} = props;

  const footer = (
    <Button key="back" type={BUTTON.PRIMARY} onClick={stopAddCloudProvider}>
      {t('Done')}
    </Button>
  );
  const providersGrid = _.chunk(_.keys(CloudProviders), 2); // Converts list of providers into list of pairs of providers

  const toggleVisibleProvider = (providerName) => {
    const {addVisibleProvider, removeVisibleProvider} = props;
    if (visibleProviders.includes(providerName)) {
      removeVisibleProvider(providerName);
    } else {
      addVisibleProvider(providerName);
    }
  };

  return (
    <Modal
      key="modal"
      className={SessionStyles.cloudProviderModal}
      open={isAddingCloudProvider}
      onCancel={stopAddCloudProvider}
      footer={footer}
      title={t('Select Cloud Providers')}
    >
      {[
        ..._.map(providersGrid, (row, key) => (
          <Row gutter={16} key={key}>
            {[
              ..._(row).map((providerName) => {
                const providerIsVisible = visibleProviders.includes(providerName);
                const style = {};
                if (providerIsVisible) {
                  style.borderColor = '#40a9ff';
                }
                const provider = CloudProviders[providerName];
                return (
                  provider && (
                    <Col span={12} key={providerName}>
                      <Button
                        role="checkbox"
                        style={style}
                        onClick={() => toggleVisibleProvider(providerName)}
                      >
                        <img src={provider.logo} />
                      </Button>
                    </Col>
                  )
                );
              }),
            ]}
          </Row>
        )),
      ]}
    </Modal>
  );
};

export default CloudProviderSelector;
