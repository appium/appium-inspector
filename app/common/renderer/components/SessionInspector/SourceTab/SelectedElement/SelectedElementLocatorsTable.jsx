import {Spin} from 'antd';
import {useTranslation} from 'react-i18next';

import {LINKS} from '../../../../constants/common.js';
import {ALL_STRATEGIES} from '../../../../constants/locator-strategies.js';
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

const modifySuggestedLocatorsData = (suggestedLocatorsData) => {
  const suggestedLocsDataCopy = structuredClone(suggestedLocatorsData);
  for (const locator of suggestedLocsDataCopy) {
    switch (locator.key) {
      case ALL_STRATEGIES.IOS_CLASS_CHAIN:
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.CLASS_CHAIN_DOCS);
        break;
      case ALL_STRATEGIES.IOS_PREDICATE:
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.PREDICATE_DOCS);
        break;
      case ALL_STRATEGIES.ANDROID_UIAUTOMATOR:
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.UIAUTOMATOR_DOCS);
        break;
    }
  }
  return suggestedLocsDataCopy;
};

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

  const suggestedLocsData = modifySuggestedLocatorsData(
    executionTimesExist ? findElementsExecutionTimes : elementLocatorsData,
  );

  return (
    <Spin spinning={isFindingElementsTimes}>
      <SelectedElementTable columns={elementLocatorsCols} dataSource={suggestedLocsData} />
    </Spin>
  );
};

export default SelectedElementLocatorsTable;
