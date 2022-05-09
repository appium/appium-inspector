import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Button } from 'antd';
import LocatedElements from './LocatedElements';
import ElementLocator from './ElementLocator';
import { withTranslation } from '../../util';


class LocatorTestModal extends Component {

  onSubmit () {
    const {
      locatedElements,
      locatorTestStrategy,
      locatorTestValue,
      searchForElement,
      clearSearchResults,
      hideLocatorTestModal,
    } = this.props;
    if (locatedElements) {
      hideLocatorTestModal();
      clearSearchResults();
    } else {
      searchForElement(locatorTestStrategy, locatorTestValue);
    }
  }

  onCancel () {
    const {hideLocatorTestModal, clearSearchResults} = this.props;
    hideLocatorTestModal();
    clearSearchResults();
  }

  render () {
    const {
      clearSearchResults,
      isLocatorTestModalVisible,
      isSearchingForElements,
      locatedElements,
      t,
    } = this.props;

    // Footer displays all the buttons at the bottom of the Modal
    return <Modal visible={isLocatorTestModalVisible}
      title={t('Search for element')}
      confirmLoading={isSearchingForElements}
      onCancel={this.onCancel.bind(this)}
      footer=
      {[
        locatedElements && 
          <Button onClick={(e) => e.preventDefault() || clearSearchResults()}>
            Back
          </Button>,
        <Button onClick={this.onCancel.bind(this)}>
          Cancel
        </Button>,
        <Button onClick={this.onSubmit.bind(this)} type="primary">
          {locatedElements ? 
            t('Done') 
            : 
            t('Search')}
        </Button>
      ]}>
      {!locatedElements && <ElementLocator {...this.props} />}
      {locatedElements && <LocatedElements {...this.props} />}
    </Modal>;
  }
}

export default withTranslation(LocatorTestModal);