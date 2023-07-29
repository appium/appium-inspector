import React, { useRef } from 'react';
import _ from 'lodash';
import { getLocators } from './shared';
import styles from './Inspector.css';
import { Button, Row, Col, Input, Table, Alert, Tooltip, Spin } from 'antd';
import { clipboard, shell } from '../../polyfills';
import { LoadingOutlined, CopyOutlined, AimOutlined, SendOutlined,
         ClearOutlined, HourglassOutlined } from '@ant-design/icons';
import { ROW, ALERT } from '../AntdTypes';

const NATIVE_APP = 'NATIVE_APP';
const CLASS_CHAIN_DOCS_URL = 'https://github.com/facebookarchive/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules';
const PREDICATE_DOCS_URL = 'https://github.com/facebookarchive/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules';

const selectedElementTableCell = (text, copyToClipBoard) => {
  if (copyToClipBoard) {
    return <div className={styles['selected-element-table-cells']}>
      <Tooltip title='Copied!' trigger="click">
        <span className={styles['element-cell-copy']} onClick = {() => clipboard.writeText(text)}>
          {text}
        </span>
      </Tooltip>
    </div>;
  } else {
    return <div className={styles['selected-element-table-cells']}>{text}</div>;
  }
};

/**
 * Shows details of the currently selected element and shows methods that can
 * be called on the elements (tap, sendKeys)
 */
const SelectedElement = (props) => {
  const { applyClientMethod, currentContext, getFindElementsTimes, findElementsExecutionTimes,
          isFindingElementsTimes, selectedElement, selectedElementId, sourceXML,
          elementInteractionsNotAvailable, selectedElementSearchInProgress, t } = props;

  const sendKeys = useRef();

  const { attributes, classChain, predicateString, xpath } = selectedElement;
  const isDisabled = selectedElementSearchInProgress || isFindingElementsTimes;

  // Get the columns for the attributes table
  let attributeColumns = [{
    title: t('Attribute'),
    dataIndex: 'name',
    key: 'name',
    width: 100,
    render: (text) => selectedElementTableCell(text, false),
  }, {
    title: t('Value'),
    dataIndex: 'value',
    key: 'value',
    render: (text) => selectedElementTableCell(text, true),
  }];

  // Get the data for the attributes table
  let attrArray = _.toPairs(attributes).filter(([key]) => key !== 'path');
  let dataSource = attrArray.map(([key, value]) => ({
    key,
    value,
    name: key,
  }));
  dataSource.unshift({key: 'elementId', value: selectedElementId, name: 'elementId'});

  // Get the columns for the strategies table
  let findColumns = [{
    title: t('Find By'),
    dataIndex: 'find',
    key: 'find',
    width: 100,
    render: (text) => selectedElementTableCell(text, false),
  }, {
    title: t('Selector'),
    dataIndex: 'selector',
    key: 'selector',
    render: (text) => selectedElementTableCell(text, true),
  }];

  if (findElementsExecutionTimes.length > 0) {
    findColumns.push({
      title: t('Time'),
      dataIndex: 'time',
      key: 'time',
      align: 'right',
      width: 100,
      render: (text) => selectedElementTableCell(text, false),
    });
  }

  // Get the data for the strategies table
  let findDataSource = _.toPairs(getLocators(attributes, sourceXML)).map(([key, selector]) => ({
    key,
    selector,
    find: key,
  }));

  // If XPath is the only provided data source, warn the user about it's brittleness
  let showXpathWarning = false;
  if (findDataSource.length === 0) {
    showXpathWarning = true;
  }

  // Add class chain to the data source as well
  if (classChain && currentContext === NATIVE_APP) {
    const classChainText = <span>
      -ios class chain
      <strong>
        <a onClick={(e) => e.preventDefault() || shell.openExternal(CLASS_CHAIN_DOCS_URL)}>&nbsp;(docs)</a>
      </strong>
    </span>;

    findDataSource.push({
      key: '-ios class chain',
      find: classChainText,
      selector: classChain,
    });
  }

  // Add predicate string to the data source as well
  if (predicateString && currentContext === NATIVE_APP) {
    const predicateStringText = <span>
      -ios predicate string
      <strong>
        <a onClick={(e) => e.preventDefault() || shell.openExternal(PREDICATE_DOCS_URL)}>&nbsp;(docs)</a>
      </strong>
    </span>;

    findDataSource.push({
      key: '-ios predicate string',
      find: predicateStringText,
      selector: predicateString,
    });
  }

  // Add XPath to the data source as well
  if (xpath) {
    findDataSource.push({
      key: 'xpath',
      find: 'xpath',
      selector: xpath,
    });
  }

  // Replace table data with table data that has the times
  if (findElementsExecutionTimes.length > 0) {
    findDataSource = findElementsExecutionTimes;
  }

  let tapIcon = <AimOutlined/>;
  if (!(elementInteractionsNotAvailable || selectedElementId) || selectedElementSearchInProgress) {
    tapIcon = <LoadingOutlined/>;
  }

  return <div>
    {elementInteractionsNotAvailable &&
      <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemNotInteractableAlertRow}>
        <Col>
          <Alert type={ALERT.INFO} message={t('interactionsNotAvailable')} showIcon />
        </Col>
      </Row>
    }
    <Row justify="center" type={ROW.FLEX} align="middle" className={styles.elementActions}>
      <Tooltip title={t('Tap')}>
        <Button
          disabled={isDisabled}
          icon={tapIcon}
          id='btnTapElement'
          onClick={() => applyClientMethod({methodName: 'click', elementId: selectedElementId})} />
      </Tooltip>
      <Button.Group className={styles.elementKeyInputActions}>
        <Input className={styles.elementKeyInput}
          disabled={isDisabled}
          placeholder={t('Enter Keys to Send')}
          allowClear={true}
          onChange={(e) => sendKeys.current = e.target.value} />
        <Tooltip title={t('Send Keys')}>
          <Button
            disabled={isDisabled}
            id='btnSendKeysToElement'
            icon={<SendOutlined/>}
            onClick={() => applyClientMethod({methodName: 'sendKeys', elementId: selectedElementId, args: [sendKeys.current || '']})} />
        </Tooltip>
        <Tooltip title={t('Clear')}>
          <Button
            disabled={isDisabled}
            id='btnClearElement'
            icon={<ClearOutlined/>}
            onClick={() => applyClientMethod({methodName: 'clear', elementId: selectedElementId})} />
        </Tooltip>
      </Button.Group>
      <Button.Group>
        <Tooltip title={t('Copy Attributes to Clipboard')}>
          <Button
            disabled={isDisabled}
            id='btnCopyAttributes'
            icon={<CopyOutlined/>}
            onClick={() => clipboard.writeText(JSON.stringify(dataSource))} />
        </Tooltip>
        <Tooltip title={t('Get Timing')}>
          <Button
            disabled={isDisabled}
            id='btnGetTiming'
            icon={<HourglassOutlined/>}
            onClick={() => getFindElementsTimes(findDataSource)} />
        </Tooltip>
      </Button.Group>
    </Row>
    {findDataSource.length > 0 &&
      <Row>
        <Spin spinning={isFindingElementsTimes}>
          <Table
            columns={findColumns}
            dataSource={findDataSource}
            size="small"
            tableLayout='fixed'
            pagination={false} />
        </Spin>
      </Row>
    }
    <br />
    {currentContext === NATIVE_APP && showXpathWarning &&
      <div>
        <Alert
          message={t('usingXPathNotRecommended')}
          type={ALERT.WARNING}
          showIcon />
        <br />
      </div>
    }
    {dataSource.length > 0 &&
      <Row>
        <Table
          columns={attributeColumns}
          dataSource={dataSource}
          size="small"
          pagination={false} />
      </Row>
    }
  </div>;
};

export default SelectedElement;
