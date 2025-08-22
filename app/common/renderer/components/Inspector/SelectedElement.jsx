import {
  AimOutlined,
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  HourglassOutlined,
  LoadingOutlined,
  SendOutlined,
  TagOutlined,
} from '@ant-design/icons';
import {Alert, Button, Card, Col, Input, Row, Space, Spin, Table, Tooltip} from 'antd';
import _ from 'lodash';
import {useRef} from 'react';

import {ALERT, ROW} from '../../constants/antd-types';
import {LINKS} from '../../constants/common';
import {NATIVE_APP} from '../../constants/session-inspector';
import {copyToClipboard, openLink} from '../../polyfills';
import {downloadFile} from '../../utils/file-handling';
import styles from './Inspector.module.css';

/**
 * Shows details of the currently selected element and shows methods that can
 * be called on the elements (tap, sendKeys)
 */
const SelectedElement = (props) => {
  const {
    applyClientMethod,
    currentContext,
    getFindElementsTimes,
    findElementsExecutionTimes,
    isFindingElementsTimes,
    selectedElement,
    selectedElementId,
    selectedElementPath,
    elementInteractionsNotAvailable,
    selectedElementSearchInProgress,
    sessionSettings,
    t,
  } = props;

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

  const sendKeys = useRef();

  const isDisabled = selectedElementSearchInProgress || isFindingElementsTimes;

  const showSnapshotMaxDepthReachedMessage = () => {
    const selectedElementDepth = selectedElementPath.split('.').length;
    if (selectedElementDepth === sessionSettings.snapshotMaxDepth) {
      return (
        <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemInfoMessage}>
          <Col>
            <Alert
              type={ALERT.INFO}
              message={t('snapshotMaxDepthReached', {selectedElementDepth})}
              showIcon
            />
          </Col>
        </Row>
      );
    }
  };

  const selectedElementTableCell = (text, copyToClipBoard) => {
    if (copyToClipBoard) {
      return (
        <div className={styles['selected-element-table-cells']}>
          <Tooltip title={t('Copied!')} trigger="click">
            <span className={styles['element-cell-copy']} onClick={() => copyToClipboard(text)}>
              {text}
            </span>
          </Tooltip>
        </div>
      );
    } else {
      return <div className={styles['selected-element-table-cells']}>{text}</div>;
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
      fixed: 'left',
      width: 150,
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
  let dataSource = _.toPairs(selectedElement.attributes).map(([key, value]) => ({
    key,
    value,
    name: key,
  }));
  dataSource.unshift({
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
      fixed: 'left',
      width: 150,
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
      fixed: 'right',
      render: (text) => selectedElementTableCell(text, false),
    });
  }

  // Get the data for the strategies table
  let findDataSource = selectedElement.strategyMap.map(([key, selector]) => ({
    key,
    selector,
    find: key,
  }));

  // Add documentation links to supported strategies
  for (const locator of findDataSource) {
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
  const showXpathWarning = findDataSource.length === 1;

  // Replace table data with table data that has the times
  if (findElementsExecutionTimes.length > 0) {
    findDataSource = findElementsExecutionTimes;
  }

  let tapIcon = <AimOutlined />;
  if (!(elementInteractionsNotAvailable || selectedElementId) || selectedElementSearchInProgress) {
    tapIcon = <LoadingOutlined />;
  }

  return (
    <Card
      title={
        <span>
          <TagOutlined /> {t('selectedElement')}
        </span>
      }
      className={styles['selected-element-card']}
      extra={
        <span>
          <Tooltip title={t('Copy Attributes to Clipboard')}>
            <Button
              type="text"
              disabled={isDisabled}
              id="btnCopyAttributes"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(JSON.stringify(dataSource))}
            />
          </Tooltip>
          <Tooltip title={t('Download Screenshot')}>
            <Button
              type="text"
              disabled={isDisabled}
              icon={<DownloadOutlined />}
              id="btnDownloadElemScreenshot"
              onClick={() => downloadElementScreenshot(selectedElementId)}
            />
          </Tooltip>
        </span>
      }
    >
      <Space className={styles.spaceContainer} direction="vertical" size="middle">
        {showSnapshotMaxDepthReachedMessage()}
        {elementInteractionsNotAvailable && (
          <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemInfoMessage}>
            <Col>
              <Alert type={ALERT.INFO} message={t('interactionsNotAvailable')} showIcon />
            </Col>
          </Row>
        )}
        <Row justify="center" type={ROW.FLEX} align="middle" className={styles.selectedElemActions}>
          <Tooltip title={t('Tap')}>
            <Button
              disabled={isDisabled}
              icon={tapIcon}
              id="btnTapElement"
              onClick={() =>
                applyClientMethod({methodName: 'elementClick', elementId: selectedElementId})
              }
            />
          </Tooltip>
          <Space.Compact className={styles.elementKeyInputActions}>
            <Input
              className={styles.elementKeyInput}
              disabled={isDisabled}
              placeholder={t('Enter Keys to Send')}
              allowClear={true}
              onChange={(e) => (sendKeys.current = e.target.value)}
            />
            <Tooltip title={t('Send Keys')}>
              <Button
                disabled={isDisabled}
                id="btnSendKeysToElement"
                icon={<SendOutlined />}
                onClick={() =>
                  applyClientMethod({
                    methodName: 'elementSendKeys',
                    elementId: selectedElementId,
                    args: [sendKeys.current || ''],
                  })
                }
              />
            </Tooltip>
            <Tooltip title={t('Clear')}>
              <Button
                disabled={isDisabled}
                id="btnClearElement"
                icon={<ClearOutlined />}
                onClick={() =>
                  applyClientMethod({methodName: 'elementClear', elementId: selectedElementId})
                }
              />
            </Tooltip>
          </Space.Compact>
          <Tooltip title={t('Get Timing')}>
            <Button
              disabled={isDisabled}
              id="btnGetTiming"
              icon={<HourglassOutlined />}
              onClick={() => getFindElementsTimes(findDataSource)}
            />
          </Tooltip>
        </Row>
        {findDataSource.length > 0 && (
          <Row className={styles.selectedElemContentRow}>
            <Spin spinning={isFindingElementsTimes}>
              <Table
                columns={findColumns}
                dataSource={findDataSource}
                size="small"
                scroll={{x: 'max-content'}}
                pagination={false}
              />
            </Spin>
          </Row>
        )}
        {currentContext === NATIVE_APP && showXpathWarning && (
          <Alert message={t('usingXPathNotRecommended')} type={ALERT.WARNING} showIcon />
        )}
        {dataSource.length > 0 && (
          <Row className={styles.selectedElemContentRow}>
            <Table
              columns={attributeColumns}
              dataSource={dataSource}
              size="small"
              scroll={{x: 'max-content'}}
              pagination={false}
            />
          </Row>
        )}
      </Space>
    </Card>
  );
};

export default SelectedElement;
