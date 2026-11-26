import {Spin} from 'antd';
import {useTranslation} from 'react-i18next';

import {STRATEGY_DOCS} from '../../../../constants/locator-strategies.js';
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
    if (locator.key in STRATEGY_DOCS) {
      locator.find = locatorStrategyDocsLink(locator.key, STRATEGY_DOCS[locator.key]);
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
