import {
  CaretDownOutlined,
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileTextOutlined,
  NodeCollapseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {Button, Card, Input, Row, Space, Spin, Tooltip, Tree} from 'antd';
import {useMemo, useState} from 'react';

import {BUTTON, ROW} from '../../constants/antd-types';
import {IMPORTANT_SOURCE_ATTRS} from '../../constants/source';
import {copyToClipboard} from '../../polyfills';
import {downloadFile} from '../../utils/file-handling';
import InspectorStyles from './Inspector.module.css';
import LocatorTestModal from './LocatorTestModal.jsx';
import SiriCommandModal from './SiriCommandModal.jsx';

const downloadXML = (sourceXML) => {
  const href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(sourceXML);
  const filename = `app-source-${new Date().toJSON()}.xml`;
  downloadFile(href, filename);
};

/**
 * Shows the 'source' of the app as a Tree
 */
const Source = (props) => {
  const {
    sourceJSON,
    sourceError,
    setExpandedPaths,
    expandedPaths,
    selectedElement = {},
    showSourceAttrs,
    methodCallInProgress,
    isUsingMjpegMode,
    isSourceRefreshOn,
    sourceXML,
    toggleShowAttributes,
    t,
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const getHighlightedText = (text) => {
    if (!searchValue) {
      return text;
    }

    const index = text.toLowerCase().indexOf(searchValue.toLowerCase());
    if (index < 0) {
      return text;
    }

    const prefix = text.substring(0, index);
    const suffix = text.slice(index + searchValue.length);
    const matchedWord = text.slice(index, index + searchValue.length);

    return (
      <>
        {prefix}
        <span className={InspectorStyles['tree-search-highlight']}>{matchedWord}</span>
        {suffix}
      </>
    );
  };

  const getFormattedTag = (el, showAllAttrs) => {
    const {tagName, attributes} = el;
    let attrs = [];

    for (let attr of Object.keys(attributes)) {
      if ((IMPORTANT_SOURCE_ATTRS.includes(attr) && attributes[attr]) || showAllAttrs) {
        attrs.push(
          <span key={attr}>
            &nbsp;
            <i className={InspectorStyles.sourceAttrName}>{getHighlightedText(attr)}</i>=
            <span className={InspectorStyles.sourceAttrValue}>
              &quot;{getHighlightedText(attributes[attr])}&quot;
            </span>
          </span>,
        );
      }
    }
    return (
      <span>
        &lt;<b className={InspectorStyles.sourceTag}>{getHighlightedText(tagName)}</b>
        {attrs}&gt;
      </span>
    );
  };

  /**
   * Binds to antd Tree onSelect. If an item is being unselected, path is undefined
   * otherwise 'path' refers to the element's path.
   */
  const handleSelectElement = (path) => {
    const {selectElement, unselectElement} = props;

    if (!path) {
      unselectElement();
    } else {
      selectElement(path);
    }
  };

  // Recursives through the source and renders a TreeNode for an element
  const recursive = (elemObj) => {
    if (!((elemObj || {}).children || []).length) {
      return null;
    }

    return elemObj.children.map((el) => ({
      title: getFormattedTag(el, showSourceAttrs),
      key: el.path,
      children: recursive(el),
    }));
  };

  const treeData = sourceJSON && recursive(sourceJSON);

  const flatten = (elemObj) => [elemObj, ...(elemObj.children?.flatMap(flatten) || [])];

  const flatTreeData = sourceJSON && flatten(sourceJSON);

  const elementMatchesSearch = (element, searchValue) =>
    (
      element.tagName +
      Object.entries(element.attributes)
        .filter(([name]) => IMPORTANT_SOURCE_ATTRS.includes(name) || showSourceAttrs)
        .map(([name, value]) => name + value)
    )
      .toLowerCase()
      .includes(searchValue.toLowerCase());

  const matchingElements = searchValue
    ? flatTreeData.filter((el) => elementMatchesSearch(el, searchValue))
    : [];

  // No need to recalculate if e.g. attribute visibility is toggled
  const expandedKeys = useMemo(
    () => [...matchingElements.map((el) => el.path), ...expandedPaths],
    [matchingElements, expandedPaths],
  );

  const onChange = (e) => {
    const {value} = e.target;
    setSearchValue(value);
    setAutoExpandParent(value !== '');
  };

  const onExpand = (expandedPaths) => {
    setExpandedPaths(expandedPaths);
    setAutoExpandParent(false);
  };

  const collapseAll = () => {
    setExpandedPaths([]);
    setAutoExpandParent(false);
  };

  return (
    <Card
      title={
        <span>
          <FileTextOutlined /> {t('App Source')}{' '}
        </span>
      }
      extra={
        <span>
          <Tooltip title={t('Copy XML Source to Clipboard')}>
            <Button
              type="text"
              id="btnSourceXML"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(sourceXML)}
            />
          </Tooltip>
          <Tooltip title={t('Download Source as .XML File')}>
            <Button
              type="text"
              id="btnDownloadSourceXML"
              icon={<DownloadOutlined />}
              onClick={() => downloadXML(sourceXML)}
            />
          </Tooltip>
        </span>
      }
    >
      <div id="sourceContainer" className={InspectorStyles['tree-container']} tabIndex="0">
        {!sourceJSON && !sourceError && <i>{t('Gathering initial app source…')}</i>}
        {sourceError && t('couldNotObtainSource', {errorMsg: JSON.stringify(sourceError)})}
        {/* Show loading indicator in MJPEG mode if a method call is in progress and source refresh is on */}
        <Spin
          size="large"
          spinning={!!methodCallInProgress && isUsingMjpegMode && isSourceRefreshOn}
        >
          {/* Must switch to a new antd Tree component when there's changes to treeData  */}
          {treeData ? (
            <div className={InspectorStyles['tree-wrapper']}>
              <Row
                justify="center"
                type={ROW.FLEX}
                align="middle"
                className={InspectorStyles['tree-actions']}
              >
                <Space.Compact>
                  <Tooltip title={t('Collapse All')}>
                    <Button
                      id="btnCollapseAll"
                      icon={<NodeCollapseOutlined />}
                      onClick={collapseAll}
                    />
                  </Tooltip>
                  <Tooltip title={t('Toggle Attributes')}>
                    <Button
                      id="btnToggleAttrs"
                      icon={<CodeOutlined />}
                      onClick={toggleShowAttributes}
                      type={showSourceAttrs ? BUTTON.PRIMARY : BUTTON.DEFAULT}
                    />
                  </Tooltip>
                </Space.Compact>
                <Input
                  placeholder={t('Search Source')}
                  onChange={onChange}
                  value={searchValue}
                  allowClear
                  className={InspectorStyles['tree-search-input']}
                  prefix={<SearchOutlined />}
                  addonAfter={
                    <Tooltip title={t('Matching Elements')}>{matchingElements.length}</Tooltip>
                  }
                />
              </Row>
              <Tree
                defaultExpandAll={true}
                showLine={true}
                switcherIcon={<CaretDownOutlined />}
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onSelect={(selectedPaths) => handleSelectElement(selectedPaths[0])}
                selectedKeys={[selectedElement.path]}
                treeData={treeData}
                className={InspectorStyles['source-tree']}
              />
            </div>
          ) : (
            <Tree treeData={[]} />
          )}
        </Spin>
        <LocatorTestModal {...props} />
        <SiriCommandModal {...props} />
      </div>
    </Card>
  );
};

export default Source;
