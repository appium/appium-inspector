import {Button, Input, Row, Space, Table} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {
  DRIVER_STRATEGIES,
  DEFAULT_STRATEGIES,
  RENDERED_STRATEGIES,
  W3C_STRATEGIES,
} from '../../../../constants/locator-strategies.js';
import {NATIVE_APP} from '../../../../constants/session-inspector.js';

import inspectorStyles from '../../SessionInspector.module.css';
import styles from './LocatorSearch.module.css';

const locatorStrategies = (automationName, currentContext) => {
  let supportedStrategies;
  if (currentContext && currentContext !== NATIVE_APP) {
    supportedStrategies = Object.values(W3C_STRATEGIES);
  } else if (automationName in DRIVER_STRATEGIES) {
    supportedStrategies = DRIVER_STRATEGIES[automationName];
  } else {
    supportedStrategies = DEFAULT_STRATEGIES;
  }
  return supportedStrategies.map((s) => [s, RENDERED_STRATEGIES[s]]);
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
  setLocatorSearchStrategy,
  setLocatorSearchValue,
}) => {
  const selectedKey = JSON.stringify([locatorSearchStrategy, locatorSearchValue]);
  const columns = [
    {
      dataIndex: 'strategy',
    },
    {
      dataIndex: 'selector',
    },
  ];

  return (
    <Row>
      <Table
        pagination={false}
        className={styles.searchResultsList}
        dataSource={searchHistory}
        columns={columns}
        showHeader={false}
        onRow={(row) => ({
          onClick: () => {
            setLocatorSearchStrategy(row.strategy);
            setLocatorSearchValue(row.selector);
          },
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
  searchHistory,
  showSearchHistory,
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
      {t('selector')}
      <LocatorSearchFormValueInputField
        locatorSearchValue={locatorSearchValue}
        setLocatorSearchValue={setLocatorSearchValue}
      />
      {showSearchHistory && (
        <>
          {t('searchHistory')}
          <LocatorSearchFormHistoryTable
            searchHistory={searchHistory}
            locatorSearchStrategy={locatorSearchStrategy}
            locatorSearchValue={locatorSearchValue}
            setLocatorSearchStrategy={setLocatorSearchStrategy}
            setLocatorSearchValue={setLocatorSearchValue}
          />
        </>
      )}
    </Space>
  );
};

export default LocatorSearchForm;
