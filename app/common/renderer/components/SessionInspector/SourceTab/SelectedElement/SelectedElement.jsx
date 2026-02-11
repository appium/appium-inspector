import {Space, Spin} from 'antd';
import _ from 'lodash';

import inspectorStyles from '../../SessionInspector.module.css';
import InteractionsNotAvailableMessage from './InteractionsNotAvailableMessage.jsx';
import SelectedElementActions from './SelectedElementActions.jsx';
import SelectedElementAttributesTable from './SelectedElementAttributesTable.jsx';
import SelectedElementBoxModel from './SelectedElementBoxModel.jsx';
import SelectedElementCard from './SelectedElementCard.jsx';
import SelectedElementLocatorsTable from './SelectedElementLocatorsTable.jsx';
import SnapshotMaxDepthReachedMessage from './SnapshotMaxDepthReachedMessage.jsx';
import XpathNotRecommendedMessage from './XpathNotRecommendedMessage.jsx';

/**
 * Placeholder shown for the element ID while the element search is in progress.
 */
const ElementIdLoader = () => <Spin styles={{root: {width: 20}}}> </Spin>;

/**
 * The full panel for the selected element.
 */
const SelectedElement = (props) => {
  const {
    applyClientMethod,
    currentContext,
    findElementsExecutionTimes,
    isFindingElementsTimes,
    selectedElement,
    selectedElementId,
    selectedElementPath,
    elementInteractionsNotAvailable,
    selectedElementSearchInProgress,
    sessionSettings,
  } = props;

  const elementActionsDisabled = selectedElementSearchInProgress || isFindingElementsTimes;

  // Get the data for the attributes table
  const elementAttributesData = _.toPairs(selectedElement.attributes).map(([key, value]) => ({
    key,
    value,
    name: key,
  }));
  elementAttributesData.unshift({
    key: 'elementId',
    value: selectedElementSearchInProgress ? <ElementIdLoader /> : selectedElementId,
    name: 'elementId',
  });

  // Get the data for the strategies table
  const elementLocatorsData = selectedElement.strategyMap.map(([key, selector]) => ({
    key,
    selector,
    find: key,
  }));

  return (
    <SelectedElementCard
      applyClientMethod={applyClientMethod}
      selectedElementId={selectedElementId}
      elementAttributesData={elementAttributesData}
      elementActionsDisabled={elementActionsDisabled}
    >
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        <SnapshotMaxDepthReachedMessage
          selectedElementPath={selectedElementPath}
          sessionSettings={sessionSettings}
        />
        <InteractionsNotAvailableMessage
          elementInteractionsNotAvailable={elementInteractionsNotAvailable}
        />
        <SelectedElementActions
          {...props}
          elementActionsDisabled={elementActionsDisabled}
          elementLocatorsData={elementLocatorsData}
        />
        <SelectedElementLocatorsTable
          findElementsExecutionTimes={findElementsExecutionTimes}
          isFindingElementsTimes={isFindingElementsTimes}
          elementLocatorsData={elementLocatorsData}
        />
        <XpathNotRecommendedMessage
          currentContext={currentContext}
          elementLocatorsData={elementLocatorsData}
        />
        <SelectedElementBoxModel selectedElement={selectedElement} />
        <SelectedElementAttributesTable elementAttributesData={elementAttributesData} />
      </Space>
    </SelectedElementCard>
  );
};

export default SelectedElement;
