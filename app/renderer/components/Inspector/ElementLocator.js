import {Alert, Input, Radio, Row, Space} from 'antd';
import React from 'react';

import {ALERT} from '../../constants/antd-types';
import {LOCATOR_STRATEGY_MAP as STRAT} from '../../constants/session-inspector';
import InspectorStyles from './Inspector.css';

const locatorStrategies = (automationName) => {
  let strategies = [STRAT.ID, STRAT.XPATH, STRAT.NAME, STRAT.CLASS_NAME, STRAT.ACCESSIBILITY_ID];
  switch (automationName) {
    case 'xcuitest':
    case 'mac2':
      strategies.push(STRAT.PREDICATE, STRAT.CLASS_CHAIN);
      break;
    case 'espresso':
      strategies.push(STRAT.DATAMATCHER, STRAT.VIEWTAG);
      break;
    case 'uiautomator2':
      strategies.push(STRAT.UIAUTOMATOR);
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
