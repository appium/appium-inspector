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

const modifySuggestedLocatorsData = (suggestedLocatorsData) => {
  const suggestedLocsDataCopy = structuredClone(suggestedLocatorsData);
  for (const locator of suggestedLocsDataCopy) {
    switch (locator.strategy || locator.key) {
      case LOCATOR_STRATEGIES.CLASS_CHAIN:
        locator.find = locatorStrategyDocsLink(locator.find, LINKS.CLASS_CHAIN_DOCS);
        break;
      case LOCATOR_STRATEGIES.PREDICATE:
        locator.find = locatorStrategyDocsLink(locator.find, LINKS.PREDICATE_DOCS);
        break;
      case LOCATOR_STRATEGIES.UIAUTOMATOR:
        locator.find = locatorStrategyDocsLink(locator.find, LINKS.UIAUTOMATOR_DOCS);
        break;
    }
  }
  return suggestedLocsDataCopy;
};

export const getLocatorCandidateRowProps = (candidate, locatorSelection) => ({
  'aria-selected': candidate.id === locatorSelection.activeCandidateId,
  tabIndex: 0,
  onClick: () => locatorSelection.selectCandidate(candidate),
  onKeyDown: (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      locatorSelection.selectCandidate(candidate);
    }
  },
});

/**
 * Table listing the selected element's suggested locators.
 */
const SelectedElementLocatorsTable = (props) => {
  const {findElementsExecutionTimes, isFindingElementsTimes, elementLocatorsData, locatorSelection} = props;
  const {t} = useTranslation();

  const executionTimesExist = !locatorSelection && findElementsExecutionTimes.length > 0;

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
  if (locatorSelection) {
    elementLocatorsCols.push({
      title: t('Unique'),
      dataIndex: 'uniqueness',
      key: 'uniqueness',
      render: (text) => <SelectedElementTableCell text={text} isCopyable={false} />,
    });
  }

  const suggestedLocsData = modifySuggestedLocatorsData(
    executionTimesExist ? findElementsExecutionTimes : elementLocatorsData,
  );

  return (
    <Spin spinning={isFindingElementsTimes}>
      <SelectedElementTable
        columns={elementLocatorsCols}
        dataSource={suggestedLocsData}
        rowClassName={(candidate) =>
          candidate.id === locatorSelection?.activeCandidateId ? 'locator-candidate-active' : ''
        }
        onRow={locatorSelection ? (candidate) => getLocatorCandidateRowProps(candidate, locatorSelection) : undefined}
      />
    </Spin>
  );
};

export default SelectedElementLocatorsTable;
