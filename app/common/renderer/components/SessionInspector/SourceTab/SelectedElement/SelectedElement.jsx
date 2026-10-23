import {Space, Spin} from 'antd';
import {useMemo} from 'react';

import EmbeddedRecorderSelection, {useRecorderLocatorSelection} from './EmbeddedRecorderSelection.jsx';
import InteractionsNotAvailableMessage from './InteractionsNotAvailableMessage.jsx';
import SelectedElementActions from './SelectedElementActions.jsx';
import SelectedElementAttributesTable from './SelectedElementAttributesTable.jsx';
import SelectedElementBoxModel from './SelectedElementBoxModel.jsx';
import SelectedElementCard from './SelectedElementCard.jsx';
import SelectedElementLocatorsTable from './SelectedElementLocatorsTable.jsx';
import SnapshotMaxDepthReachedMessage from './SnapshotMaxDepthReachedMessage.jsx';
import XpathNotRecommendedMessage from './XpathNotRecommendedMessage.jsx';

import inspectorStyles from '../../SessionInspector.module.css';

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
    isEmbeddedMode,
  } = props;

  const elementActionsDisabled = selectedElementSearchInProgress || isFindingElementsTimes;

  // Get the data for the attributes table
  const elementAttributesData = Object.entries(selectedElement.attributes).map(([key, value]) => ({
    key,
    value,
    name: key,
  }));
  elementAttributesData.unshift({
    key: 'elementId',
    value: selectedElementSearchInProgress ? <ElementIdLoader /> : selectedElementId,
    name: 'elementId',
  });

  // Keep the upstream strategy table unchanged outside embedded mode.
  const elementLocatorsData = selectedElement.strategyMap.map(([key, selector]) => ({
    key,
    selector,
    find: key,
  }));
  const locatorCandidates = useMemo(
    () =>
      isEmbeddedMode
        ? selectedElement.locatorCandidates?.length
          ? selectedElement.locatorCandidates
          : selectedElement.strategyMap.map(([strategy, selector]) => ({
              id: `${strategy}:${selector}`,
              key: `${strategy}:${selector}`,
              label: strategy,
              find: strategy,
              strategy,
              selector,
              priority: 0,
              unique: null,
              uniqueness: 'unknown',
              source: 'upstream',
              reason: 'Upstream locator recommendation',
            }))
        : [],
    [isEmbeddedMode, selectedElement.locatorCandidates, selectedElement.strategyMap],
  );
  const locatorSelection = useRecorderLocatorSelection(locatorCandidates, selectedElementPath);

  return (
    <SelectedElementCard
      applyClientMethod={applyClientMethod}
      selectedElementId={selectedElementId}
      elementAttributesData={elementAttributesData}
      elementActionsDisabled={elementActionsDisabled}
    >
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        <SnapshotMaxDepthReachedMessage selectedElementPath={selectedElementPath} sessionSettings={sessionSettings} />
        <InteractionsNotAvailableMessage elementInteractionsNotAvailable={elementInteractionsNotAvailable} />
        {isEmbeddedMode && (
          <EmbeddedRecorderSelection
            {...props}
            locatorCandidates={locatorCandidates}
            locatorSelection={locatorSelection}
          />
        )}
        <SelectedElementActions
          {...props}
          elementActionsDisabled={elementActionsDisabled}
          elementLocatorsData={elementLocatorsData}
        />
        <SelectedElementLocatorsTable
          findElementsExecutionTimes={findElementsExecutionTimes}
          isFindingElementsTimes={isFindingElementsTimes}
          elementLocatorsData={isEmbeddedMode ? locatorCandidates : elementLocatorsData}
          locatorSelection={isEmbeddedMode ? locatorSelection : undefined}
        />
        <XpathNotRecommendedMessage currentContext={currentContext} elementLocatorsData={elementLocatorsData} />
        <SelectedElementBoxModel selectedElement={selectedElement} />
        <SelectedElementAttributesTable elementAttributesData={elementAttributesData} />
      </Space>
    </SelectedElementCard>
  );
};

export default SelectedElement;
