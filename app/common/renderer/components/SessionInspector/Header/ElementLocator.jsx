import {Alert, Button, Input, Row, Space} from 'antd';

import {ALERT, BUTTON} from '../../../constants/antd-types.js';
import {LOCATOR_STRATEGY_MAP as STRAT, NATIVE_APP} from '../../../constants/session-inspector.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Header.module.css';

const locatorStrategies = (automationName, currentContext) => {
  if (currentContext !== NATIVE_APP) {
    return [STRAT.CSS, STRAT.XPATH, STRAT.LINK_TEXT, STRAT.PARTIAL_LINK_TEXT, STRAT.TAG_NAME];
  }
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
    currentContext,
    t,
  } = props;

  return (
    <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
      {t('locatorStrategy')}
      <Row justify="center">
        {locatorStrategies(automationName, currentContext).map(([strategyValue, strategyName]) => (
          <Button
            type={strategyValue === locatorTestStrategy ? BUTTON.PRIMARY : BUTTON.DEFAULT}
            className={styles.locatorStrategyBtn}
            onClick={() => setLocatorTestStrategy(strategyValue)}
            key={strategyValue}
          >
            {strategyName}
          </Button>
        ))}
      </Row>
      {!automationName && (
        <Alert title={t('missingAutomationNameForStrategies')} type={ALERT.INFO} showIcon />
      )}
      {t('selector')}
      <Input.TextArea
        className={styles.locatorSelectorTextArea}
        onChange={(e) => setLocatorTestValue(e.target.value)}
        value={locatorTestValue}
        allowClear={true}
        rows={3}
      />
    </Space>
  );
};

export default ElementLocator;
