import {CaretDownOutlined, SearchOutlined} from '@ant-design/icons';
import {Input, Spin, Tooltip, Tree} from 'antd';
import {useState} from 'react';

import {IMPORTANT_SOURCE_ATTRS} from '../../constants/source';
import InspectorStyles from './Inspector.module.css';
import LocatorTestModal from './LocatorTestModal.jsx';
import SiriCommandModal from './SiriCommandModal.jsx';

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
    t,
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const [matchingElements, setMatchingElements] = useState(0);
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
    (element.tagName + Object.entries(element.attributes).map(([name, value]) => name + value))
      .toLowerCase()
      .includes(searchValue.toLowerCase());

  const onChange = (e) => {
    const {value} = e.target;
    const matchingElements = value
      ? flatTreeData.filter((el) => elementMatchesSearch(el, value))
      : [];
    const newExpandedPaths = matchingElements.length > 0 && matchingElements.map((el) => el.path);
    setMatchingElements(matchingElements.length);
    if (newExpandedPaths) {
      setExpandedPaths(newExpandedPaths);
    }
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  const onClear = () => {
    setMatchingElements(0);
  };

  const onExpand = (expandedPaths) => {
    setExpandedPaths(expandedPaths);
    setAutoExpandParent(false);
  };

  return (
    <div id="sourceContainer" className={InspectorStyles['tree-container']} tabIndex="0">
      {!sourceJSON && !sourceError && <i>{t('Gathering initial app source…')}</i>}
      {sourceError && t('couldNotObtainSource', {errorMsg: JSON.stringify(sourceError)})}
      {/* Show loading indicator in MJPEG mode if a method call is in progress and source refresh is on */}
      <Spin size="large" spinning={!!methodCallInProgress && isUsingMjpegMode && isSourceRefreshOn}>
        {/* Must switch to a new antd Tree component when there's changes to treeData  */}
        {treeData ? (
          <div className={InspectorStyles['tree-wrapper']}>
            <Input
              placeholder={t('Search Source')}
              onChange={onChange}
              onClear={onClear}
              value={searchValue}
              allowClear
              className={InspectorStyles['tree-search-input']}
              prefix={<SearchOutlined />}
              addonAfter={<Tooltip title={t('Matching Elements')}>{matchingElements}</Tooltip>}
            />
            <Tree
              defaultExpandAll={true}
              showLine={true}
              switcherIcon={<CaretDownOutlined />}
              onExpand={onExpand}
              expandedKeys={expandedPaths}
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
  );
};

export default Source;
