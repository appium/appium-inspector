import React, { Component } from 'react';
import { Input, Radio, Row } from 'antd';
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
      <Radio.Group buttonStyle="solid"
        className={InspectorStyles.locatorStrategyGroup}
        onChange={(e) => setLocatorTestStrategy(e.target.value)}
        defaultValue={locatorTestStrategy}
      >
        <Row justify="center">
          {this.getLocatorStrategies(driver).map(([strategyValue, strategyName]) => (
            <Radio.Button value={strategyValue} key={strategyValue}>{strategyName}</Radio.Button>
          ))}
        </Row>
      </Radio.Group>
      {t('selector')}
      <Input.TextArea
        className={InspectorStyles.locatorSelectorTextArea}
        onChange={(e) => setLocatorTestValue(e.target.value)}
        value={locatorTestValue}
        allowClear={true}
        rows={3}
      />
    </>;
  }
}

export default withTranslation(ElementLocator);
