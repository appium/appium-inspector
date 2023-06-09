import React, { Component } from 'react';
import { Input, Radio, Row } from 'antd';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';

const STRAT_ID = ['id', 'Id'];
const STRAT_XPATH = ['xpath', 'XPath'];
const STRAT_NAME = ['name', 'Name'];
const STRAT_CLASS_NAME = ['class name', 'Class Name'];
const STRAT_ACCESSIBILITY_ID = ['accessibility id', 'Accessibility ID'];
const STRAT_PREDICATE = ['-ios predicate string', 'Predicate String'];
const STRAT_CLASS_CHAIN = ['-ios class chain', 'Class Chain'];
const STRAT_UIAUTOMATOR = ['-android uiautomator', 'UIAutomator'];
const STRAT_DATAMATCHER = ['-android datamatcher', 'DataMatcher'];
const STRAT_VIEWTAG = ['-android viewtag', 'View Tag'];

const locatorStrategies = (driver) => {
  const automationName = driver.client.capabilities.automationName;
  let strategies = [STRAT_ID, STRAT_XPATH, STRAT_NAME, STRAT_CLASS_NAME, STRAT_ACCESSIBILITY_ID];
  if (!automationName) { return strategies; }
  switch (automationName.toLowerCase()) {
    case 'xcuitest':
    case 'mac2':
      strategies.push(STRAT_PREDICATE, STRAT_CLASS_CHAIN);
      break;
    case 'espresso':
      strategies.push(STRAT_DATAMATCHER, STRAT_VIEWTAG);
      break;
    case 'uiautomator2':
      strategies.push(STRAT_UIAUTOMATOR);
      break;
  }
  return strategies;
};

class ElementLocator extends Component {

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
      <Row justify="center">
        <Radio.Group buttonStyle="solid"
          className={InspectorStyles.locatorStrategyGroup}
          onChange={(e) => setLocatorTestStrategy(e.target.value)}
          defaultValue={locatorTestStrategy}
        >
          <Row justify="center">
            {locatorStrategies(driver).map(([strategyValue, strategyName]) => (
              <Radio.Button
                className={InspectorStyles.locatorStrategyBtn}
                value={strategyValue}
                key={strategyValue}
              >
                {strategyName}
              </Radio.Button>
            ))}
          </Row>
        </Radio.Group>
      </Row>
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
