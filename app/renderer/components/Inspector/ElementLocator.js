import React, { Component } from 'react';
import { Input, Select, Row } from 'antd';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';

const { Option } = Select;

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

    return <div>
      <Row>
        {t('locatorStrategy')}
        <Select className={InspectorStyles['locator-strategy-selector']}
          onChange={(value) => setLocatorTestStrategy(value)}
          value={locatorTestStrategy}>
          {this.getLocatorStrategies(driver).map(([strategyValue, strategyName]) => (
            <Option key={strategyValue} value={strategyValue}>{strategyName}</Option>
          ))}
        </Select>
      </Row>
      <Row>
        {t('selector')}
        <Input.TextArea className={InspectorStyles['locator-strategy-selector']} onChange={(e) => setLocatorTestValue(e.target.value)} value={locatorTestValue} />
      </Row>
    </div>;
  }
}

export default withTranslation(ElementLocator);
