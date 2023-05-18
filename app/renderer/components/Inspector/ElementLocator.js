import React, { Component } from 'react';
import { Input, Segmented, Row } from 'antd';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';

class ElementLocator extends Component {

  getLocatorStrategies (driver) {
    let baseLocatorStrategies = [
      ['id', 'Id'],
      ['xpath', 'XPath'],
      ['name', 'Name'],
      ['class name', 'Class Name'],
      ['accessibility id', 'Accessibility ID']
    ];
    if (driver.client.isIOS) {
      baseLocatorStrategies.push(
        ['-ios predicate string', 'Predicate String'],
        ['-ios class chain', 'Class Chain']
      );
    } else if (driver.client.isAndroid) {
      if (driver.client.capabilities.automationName.toLowerCase() === 'espresso') {
        baseLocatorStrategies.push(
          ['-android datamatcher', 'DataMatcher'],
          ['-android viewtag', 'View Tag']
        );
      } else {
        baseLocatorStrategies.push(
          ['-android uiautomator', 'UIAutomator'],
        );
      }
    }
    return baseLocatorStrategies;
  }

  onSubmit () {
    const {locatedElements, locatorTestStrategy, locatorTestValue, searchForElement, clearSearchResults, hideLocatorTestModal} = this.props;
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
      setLocatorTestValue,
      locatorTestValue,
      setLocatorTestStrategy,
      locatorTestStrategy,
      driver,
      t,
    } = this.props;

    return <>
      {t('locatorStrategy')}
      <Row className={InspectorStyles.locatorStrategySegmentedRow}>
        <Segmented
          onChange={(value) => setLocatorTestStrategy(value)}
          value={locatorTestStrategy}
          options={this.getLocatorStrategies(driver).map(([strategyValue, strategyName]) => (
            {label: strategyName, value: strategyValue}
          ))}
        />
      </Row>
      {t('selector')}
      <Row>
        <Input.TextArea
          className={InspectorStyles.locatorStrategySelectorTextarea}
          onChange={(e) => setLocatorTestValue(e.target.value)}
          value={locatorTestValue}
          allowClear={true}
          rows={3}
        />
      </Row>
    </>;
  }
}

export default withTranslation(ElementLocator);
