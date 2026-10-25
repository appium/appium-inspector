import {Alert, Button, Input, Row, Space, Table} from 'antd';
import {useTranslation} from 'react-i18next';

import {ALERT, BUTTON} from '../../../../constants/antd-types.js';
import {DRIVERS} from '../../../../constants/common.js';
import {
  NATIVE_APP,
  NATIVE_COMMON_LOCATOR_STRATEGY_MAP,
  NATIVE_DRIVER_LOCATOR_STRATEGY_MAP,
  WEB_LOCATOR_STRATEGY_MAP,
} from '../../../../constants/session-inspector.js';

import inspectorStyles from '../../SessionInspector.module.css';
import styles from './LocatorSearch.module.css';

const locatorStrategies = (automationName, currentContext) => {
  if (currentContext && currentContext !== NATIVE_APP) {
    return Object.values(WEB_LOCATOR_STRATEGY_MAP);
  }
  const strategies = Object.values(NATIVE_COMMON_LOCATOR_STRATEGY_MAP);
  switch (automationName) {
    case DRIVERS.XCUITEST:
    case DRIVERS.MAC2:
      strategies.push(NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.PREDICATE, NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.CLASS_CHAIN);
      break;
    case DRIVERS.ESPRESSO:
      strategies.push(NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.DATAMATCHER, NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.VIEWTAG);
      break;
    case DRIVERS.UIAUTOMATOR2:
      strategies.push(NATIVE_DRIVER_LOCATOR_STRATEGY_MAP.UIAUTOMATOR);
      break;
  }
  return strategies;
};

/**
 * Locator strategy selector for locator search.
 */
const LocatorSearchFormStrategySelector = ({
  automationName,
  currentContext,
  locatorSearchStrategy,
  setLocatorSearchStrategy,
}) => (
  <Row justify="center">
    {locatorStrategies(automationName, currentContext).map(([strategyValue, strategyName]) => (
      <Button
        type={strategyValue === locatorSearchStrategy ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        className={styles.locatorStrategyBtn}
        onClick={() => setLocatorSearchStrategy(strategyValue)}
        key={strategyValue}
      >
        {strategyName}
      </Button>
    ))}
  </Row>
);

/**
 * Info message shown when the session has no defined automationName,
 * meaning no driver-specific locator strategies are available.
 */
const LocatorSearchFormMissingAutomationNameMessage = ({automationName}) => {
  const {t} = useTranslation();

  return !automationName && <Alert title={t('missingAutomationNameForStrategies')} type={ALERT.INFO} showIcon />;
};

/**
 * Selector input field for locator search.
 */
const LocatorSearchFormValueInputField = ({locatorSearchValue, setLocatorSearchValue}) => (
  <Input.TextArea
    className={styles.locatorSelectorTextArea}
    onChange={(e) => setLocatorSearchValue(e.target.value)}
    value={locatorSearchValue}
    allowClear={true}
    rows={3}
  />
);

/**
 * Table listing previous locator strategy and selector searches.
 */
const LocatorSearchFormHistoryTable = ({
  searchHistory,
  locatorSearchStrategy,
  locatorSearchValue,
  selectSearchHistoryEntry,
}) => {
  const selectedKey = JSON.stringify([locatorSearchStrategy, locatorSearchValue]);

  return (
    <Row>
      <Table
        pagination={false}
        className={styles.searchResultsList}
        dataSource={searchHistory.map(({strategy, selector}) => ({
          key: JSON.stringify([strategy, selector]),
          strategy,
          selector,
        }))}
        columns={[
          {
            dataIndex: 'strategy',
            className: styles.searchHistoryStrategyCell,
          },
          {
            dataIndex: 'selector',
          },
        ]}
        showHeader={false}
        onRow={(row) => ({
          onClick: () => selectSearchHistoryEntry({strategy: row.strategy, selector: row.selector}),
        })}
        rowSelection={{
          selectedRowKeys: [selectedKey],
          hideSelectAll: true,
          columnWidth: 0,
          renderCell: () => null,
        }}
      />
    </Row>
  );
};

/**
 * Input form for locator search related data.
 */
const LocatorSearchForm = ({
  setLocatorSearchValue,
  locatorSearchValue,
  setLocatorSearchStrategy,
  locatorSearchStrategy,
  automationName,
  currentContext,
  searchHistory = [],
  showSearchHistory = false,
  selectSearchHistoryEntry,
}) => {
  const {t} = useTranslation();

  return (
    <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
      {t('locatorStrategy')}
      <LocatorSearchFormStrategySelector
        automationName={automationName}
        currentContext={currentContext}
        locatorSearchStrategy={locatorSearchStrategy}
        setLocatorSearchStrategy={setLocatorSearchStrategy}
      />
      <LocatorSearchFormMissingAutomationNameMessage automationName={automationName} />
      {t('selector')}
      <LocatorSearchFormValueInputField
        locatorSearchValue={locatorSearchValue}
        setLocatorSearchValue={setLocatorSearchValue}
      />
      {showSearchHistory && !!searchHistory.length && (
        <>
          {t('searchHistory')}
          <LocatorSearchFormHistoryTable
            searchHistory={searchHistory}
            locatorSearchStrategy={locatorSearchStrategy}
            locatorSearchValue={locatorSearchValue}
            selectSearchHistoryEntry={selectSearchHistoryEntry}
          />
        </>
      )}
    </Space>
  );
};

export default LocatorSearchForm;
