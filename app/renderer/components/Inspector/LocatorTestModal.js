import {Button, Modal} from 'antd';
import React from 'react';

import ElementLocator from './ElementLocator';
import LocatedElements from './LocatedElements';

const LocatorTestModal = (props) => {
  const {
    isLocatorTestModalVisible,
    isSearchingForElements,
    clearSearchResults,
    locatedElements,
    t,
  } = props;

  const onCancel = () => {
    const {hideLocatorTestModal} = props;
    hideLocatorTestModal();
    clearSearchResults();
  };

  const onSubmit = () => {
    const {locatorTestStrategy, locatorTestValue, searchForElement} = props;
    if (locatedElements) {
      onCancel();
    } else {
      searchForElement(locatorTestStrategy, locatorTestValue);
    }
  };

  // Footer displays all the buttons at the bottom of the Modal
  return (
    <Modal
      open={isLocatorTestModalVisible}
      title={t('Search for element')}
      onCancel={onCancel}
      footer={
        <>
          {locatedElements && (
            <Button onClick={(e) => e.preventDefault() || clearSearchResults()}>{t('Back')}</Button>
          )}
          <Button loading={isSearchingForElements} onClick={onSubmit} type="primary">
            {locatedElements ? t('Done') : t('Search')}
          </Button>
        </>
      }
    >
      {!locatedElements && <ElementLocator {...props} />}
      {locatedElements && <LocatedElements {...props} />}
    </Modal>
  );
};

export default LocatorTestModal;
