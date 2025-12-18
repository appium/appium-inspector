import {Alert, Button, Input, Row, Space} from 'antd';

import {ALERT, BUTTON} from '../../../constants/antd-types.js';
import {DRIVERS} from '../../../constants/common.js';
import {
  NATIVE_APP,
  NATIVE_COMMON_LOCATOR_STRATEGY_MAP,
  NATIVE_DRIVER_LOCATOR_STRATEGY_MAP,
  WEB_LOCATOR_STRATEGY_MAP,
} from '../../../constants/session-inspector.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Header.module.css';

const locatorStrategies = (automationName, currentContext) => {
  if (currentContext && currentContext !== NATIVE_APP) {
    return Object.values(WEB_LOCATOR_STRATEGY_MAP);
  }
  const strategies = Object.values(NATIVE_COMMON_LOCATOR_STRATEGY_MAP);
  switch (automationName) {
    case DRIVERS.XCUITEST:
    case DRIVERS.MAC2:
      strategies.push(
        NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.PREDICATE,
        NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.CLASS_CHAIN,
      );
      break;
    case DRIVERS.ESPRESSO:
      strategies.push(
        NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.DATAMATCHER,
        NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.VIEWTAG,
      );
      break;
    case DRIVERS.UIAUTOMATOR2:
      strategies.push(NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.UIAUTOMATOR);
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
