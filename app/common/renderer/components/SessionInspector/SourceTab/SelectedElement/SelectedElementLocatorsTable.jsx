import {Spin} from 'antd';
import {useTranslation} from 'react-i18next';

import {LINKS} from '../../../../constants/common.js';
import {LOCATOR_STRATEGIES} from '../../../../constants/session-inspector.js';
import {openLink} from '../../../../polyfills.js';
import SelectedElementTable from './SelectedElementTable.jsx';
import SelectedElementTableCell from './SelectedElementTableCell.jsx';

const locatorStrategyDocsLink = (name, docsLink) => (
  <span>
    {name}
    <strong>
      <a onClick={(e) => e.preventDefault() || openLink(docsLink)}>
        <br />
        (docs)
      </a>
    </strong>
  </span>
);

/**
 * Table listing the selected element's suggested locators.
 */
const SelectedElementLocatorsTable = (props) => {
  const {findElementsExecutionTimes, isFindingElementsTimes, elementLocatorsData} = props;
  const {t} = useTranslation();

  const executionTimesExist = findElementsExecutionTimes.length > 0;

  const elementLocatorsCols = [
    {
      title: t('Find By'),
      dataIndex: 'find',
      key: 'find',
      fixed: 'start',
      render: (text) => <SelectedElementTableCell text={text} isCopyable={false} />,
    },
    {
      title: t('Selector'),
      dataIndex: 'selector',
      key: 'selector',
      render: (text) => <SelectedElementTableCell text={text} isCopyable={true} />,
    },
  ];

  if (executionTimesExist) {
    elementLocatorsCols.push({
      title: t('Time'),
      dataIndex: 'time',
      key: 'time',
      fixed: 'end',
      render: (text) => <SelectedElementTableCell text={text} isCopyable={false} />,
    });
  }

  const suggestedLocsData = structuredClone(
    executionTimesExist ? findElementsExecutionTimes : elementLocatorsData,
  );

  // Add documentation links to supported strategies
  for (const locator of suggestedLocsData) {
    switch (locator.key) {
      case LOCATOR_STRATEGIES.CLASS_CHAIN:
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.CLASS_CHAIN_DOCS);
        break;
      case LOCATOR_STRATEGIES.PREDICATE:
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.PREDICATE_DOCS);
        break;
      case LOCATOR_STRATEGIES.UIAUTOMATOR:
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.UIAUTOMATOR_DOCS);
        break;
    }
  }

  return (
    <Spin spinning={isFindingElementsTimes}>
      <SelectedElementTable columns={elementLocatorsCols} dataSource={suggestedLocsData} />
    </Spin>
  );
};

export default SelectedElementLocatorsTable;
