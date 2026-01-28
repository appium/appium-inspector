import {
  IconDownload,
  IconEraser,
  IconFiles,
  IconFocus2,
  IconSend2,
  IconStopwatch,
  IconTag,
} from '@tabler/icons-react';
import {Alert, Button, Card, Col, Flex, Input, Row, Space, Spin, Table, Tooltip} from 'antd';
import _ from 'lodash';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {ALERT, ROW} from '../../../../constants/antd-types.js';
import {LINKS} from '../../../../constants/common.js';
import {NATIVE_APP} from '../../../../constants/session-inspector.js';
import {copyToClipboard, openLink} from '../../../../polyfills.js';
import {downloadFile} from '../../../../utils/file-handling.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from '../Source.module.css';

const SelectedElementPanelTitle = () => {
  const {t} = useTranslation();
  return (
    <Flex gap={4} align="center">
      <IconTag size={18} />
      {t('selectedElement')}
    </Flex>
  );
};

const SelectedElementHeaderButtons = ({
  elementAttributes,
  elementActionsDisabled,
  selectedElementId,
  applyClientMethod,
}) => {
  const {t} = useTranslation();

  const downloadElementScreenshot = async (elementId) => {
    const elemScreenshot = await applyClientMethod({
      methodName: 'takeElementScreenshot',
      elementId,
      skipRefresh: true,
    });
    const href = `data:image/png;base64,${elemScreenshot}`;
    const filename = `element-${elementId}.png`;
    downloadFile(href, filename);
  };

  return (
    <span>
      <Tooltip title={t('Copy Attributes to Clipboard')}>
        <Button
          type="text"
          disabled={elementActionsDisabled}
          id="btnCopyAttributes"
          icon={<IconFiles size={18} />}
          onClick={() => copyToClipboard(JSON.stringify(elementAttributes))}
        />
      </Tooltip>
      <Tooltip title={t('Download Screenshot')}>
        <Button
          type="text"
          disabled={elementActionsDisabled}
          icon={<IconDownload size={18} />}
          id="btnDownloadElemScreenshot"
          onClick={() => downloadElementScreenshot(selectedElementId)}
        />
      </Tooltip>
    </span>
  );
};

const SelectedElementActions = (props) => {
  const {
    elementActionsDisabled,
    elementInteractionsNotAvailable,
    selectedElementSearchInProgress,
    applyClientMethod,
    selectedElementId,
    getFindElementsTimes,
    elementSuggestedLocators,
  } = props;
  const {t} = useTranslation();
  const sendKeysRef = useRef(null);

  const tapButtonLoadingState =
    !(elementInteractionsNotAvailable || selectedElementId) || selectedElementSearchInProgress;

  return (
    <Row justify="center" type={ROW.FLEX} align="middle" className={styles.selectedElemActions}>
      <Tooltip title={t('Tap')}>
        <Button
          disabled={elementActionsDisabled}
          icon={<IconFocus2 size={18} />}
          loading={tapButtonLoadingState}
          id="btnTapElement"
          onClick={() =>
            applyClientMethod({methodName: 'elementClick', elementId: selectedElementId})
          }
        />
      </Tooltip>
      <Space.Compact className={styles.elementKeyInputActions}>
        <Input
          className={styles.elementKeyInput}
          disabled={elementActionsDisabled}
          placeholder={t('Enter Keys to Send')}
          allowClear={true}
          onChange={(e) => (sendKeysRef.current = e.target.value)}
        />
        <Tooltip title={t('Send Keys')}>
          <Button
            disabled={elementActionsDisabled}
            id="btnSendKeysToElement"
            icon={<IconSend2 size={18} />}
            onClick={() =>
              applyClientMethod({
                methodName: 'elementSendKeys',
                elementId: selectedElementId,
                args: [sendKeysRef.current || ''],
              })
            }
          />
        </Tooltip>
        <Tooltip title={t('Clear')}>
          <Button
            disabled={elementActionsDisabled}
            id="btnClearElement"
            icon={<IconEraser size={18} />}
            onClick={() =>
              applyClientMethod({methodName: 'elementClear', elementId: selectedElementId})
            }
          />
        </Tooltip>
      </Space.Compact>
      <Tooltip title={t('Get Timing')}>
        <Button
          disabled={elementActionsDisabled}
          id="btnGetTiming"
          icon={<IconStopwatch size={18} />}
          onClick={() => getFindElementsTimes(elementSuggestedLocators)}
        />
      </Tooltip>
    </Row>
  );
};

const SnapshotMaxDepthReachedMessage = ({selectedElementPath, sessionSettings}) => {
  const {t} = useTranslation();
  const selectedElementDepth = selectedElementPath.split('.').length;

  if (selectedElementDepth === sessionSettings.snapshotMaxDepth) {
    return (
      <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemInfoMessage}>
        <Col>
          <Alert
            type={ALERT.INFO}
            title={t('snapshotMaxDepthReached', {selectedElementDepth})}
            showIcon
          />
        </Col>
      </Row>
    );
  }
};

const ElementInteractionsNotAvailableMessage = () => {
  const {t} = useTranslation();

  return (
    <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemInfoMessage}>
      <Col>
        <Alert type={ALERT.INFO} title={t('interactionsNotAvailable')} showIcon />
      </Col>
    </Row>
  );
};

const SelectedElementTable = ({columns, dataSource}) => (
  <Row className={styles.selectedElemTableWrapper}>
    <Table
      columns={columns}
      dataSource={dataSource}
      size="small"
      scroll={{x: 'max-content'}}
      pagination={false}
    />
  </Row>
);

const XpathNotRecommendedMessage = () => {
  const {t} = useTranslation();
  return <Alert title={t('usingXPathNotRecommended')} type={ALERT.WARNING} showIcon />;
};

/**
 * Shows details of the currently selected element and shows methods that can
 * be called on the elements (tap, sendKeys)
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
  const {t} = useTranslation();

  const elementActionsDisabled = selectedElementSearchInProgress || isFindingElementsTimes;

  const selectedElementTableCell = (text, copyToClipBoard) => {
    const monoText = <span className={inspectorStyles.monoFont}>{text}</span>;
    if (copyToClipBoard) {
      return (
        <div className={styles.selectedElemTableCells}>
          <Tooltip title={t('Copied!')} trigger="click">
            <span className={styles.copyableCell} onClick={() => copyToClipboard(text)}>
              {monoText}
            </span>
          </Tooltip>
        </div>
      );
    } else {
      return <div className={styles.selectedElemTableCells}>{monoText}</div>;
    }
  };

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

  // Get the columns for the attributes table
  let attributeColumns = [
    {
      title: t('Attribute'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'start',
      render: (text) => selectedElementTableCell(text, false),
    },
    {
      title: t('Value'),
      dataIndex: 'value',
      key: 'value',
      render: (text) => selectedElementTableCell(text, true),
    },
  ];

  // Get the data for the attributes table
  let elementAttributes = _.toPairs(selectedElement.attributes).map(([key, value]) => ({
    key,
    value,
    name: key,
  }));
  elementAttributes.unshift({
    key: 'elementId',
    value: selectedElementSearchInProgress ? <Spin /> : selectedElementId,
    name: 'elementId',
  });

  // Get the columns for the strategies table
  let findColumns = [
    {
      title: t('Find By'),
      dataIndex: 'find',
      key: 'find',
      fixed: 'start',
      render: (text) => selectedElementTableCell(text, false),
    },
    {
      title: t('Selector'),
      dataIndex: 'selector',
      key: 'selector',
      render: (text) => selectedElementTableCell(text, true),
    },
  ];

  if (findElementsExecutionTimes.length > 0) {
    findColumns.push({
      title: t('Time'),
      dataIndex: 'time',
      key: 'time',
      fixed: 'end',
      render: (text) => selectedElementTableCell(text, false),
    });
  }

  // Get the data for the strategies table
  let elementSuggestedLocators = selectedElement.strategyMap.map(([key, selector]) => ({
    key,
    selector,
    find: key,
  }));

  // Add documentation links to supported strategies
  for (const locator of elementSuggestedLocators) {
    switch (locator.key) {
      case '-ios class chain':
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.CLASS_CHAIN_DOCS);
        break;
      case '-ios predicate string':
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.PREDICATE_DOCS);
        break;
      case '-android uiautomator':
        locator.find = locatorStrategyDocsLink(locator.key, LINKS.UIAUTOMATOR_DOCS);
        break;
    }
  }

  // If XPath is the only optimal selector, warn the user about its brittleness
  const showXpathWarning = elementSuggestedLocators.length === 1;

  // Replace table data with table data that has the times
  if (findElementsExecutionTimes.length > 0) {
    elementSuggestedLocators = findElementsExecutionTimes;
  }

  return (
    <Card
      title={<SelectedElementPanelTitle />}
      className={styles.selectedElementCard}
      extra={
        <SelectedElementHeaderButtons
          elementAttributes={elementAttributes}
          elementActionsDisabled={elementActionsDisabled}
          selectedElementId={selectedElementId}
          applyClientMethod={applyClientMethod}
        />
      }
    >
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        <SnapshotMaxDepthReachedMessage
          selectedElementPath={selectedElementPath}
          sessionSettings={sessionSettings}
        />
        {elementInteractionsNotAvailable && <ElementInteractionsNotAvailableMessage />}
        <SelectedElementActions
          {...props}
          elementActionsDisabled={elementActionsDisabled}
          elementSuggestedLocators={elementSuggestedLocators}
        />
        <Spin spinning={isFindingElementsTimes}>
          <SelectedElementTable columns={findColumns} dataSource={elementSuggestedLocators} />
        </Spin>
        {currentContext === NATIVE_APP && showXpathWarning && <XpathNotRecommendedMessage />}
        <SelectedElementTable columns={attributeColumns} dataSource={elementAttributes} />
      </Space>
    </Card>
  );
};

export default SelectedElement;
