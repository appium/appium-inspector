import {Alert, Input, Radio, Row, Space} from 'antd';
import React from 'react';

import {ALERT} from '../AntdTypes';
import InspectorStyles from './Inspector.css';

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

const locatorStrategies = (automationName) => {
  let strategies = [STRAT_ID, STRAT_XPATH, STRAT_NAME, STRAT_CLASS_NAME, STRAT_ACCESSIBILITY_ID];
  if (!automationName) {
    return strategies;
  }
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

const ElementLocator = (props) => {
  const {
    setLocatorTestValue,
    locatorTestValue,
    setLocatorTestStrategy,
    locatorTestStrategy,
    automationName,
    t,
  } = props;

  return (
    <Space className={InspectorStyles.spaceContainer} direction="vertical" size="small">
      {t('locatorStrategy')}
      <Row justify="center">
        <Radio.Group
          buttonStyle="solid"
          onChange={(e) => setLocatorTestStrategy(e.target.value)}
          defaultValue={locatorTestStrategy}
        >
          <Row justify="center">
            {locatorStrategies(automationName).map(([strategyValue, strategyName]) => (
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
      {!automationName && (
        <Alert message={t('missingAutomationNameForStrategies')} type={ALERT.INFO} showIcon />
      )}
      {t('selector')}
      <Input.TextArea
        className={InspectorStyles.locatorSelectorTextArea}
        onChange={(e) => setLocatorTestValue(e.target.value)}
        value={locatorTestValue}
        allowClear={true}
        rows={3}
      />
    </Space>
  );
};

export default ElementLocator;
