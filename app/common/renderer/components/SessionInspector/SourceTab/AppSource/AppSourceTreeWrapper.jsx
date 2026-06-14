import {Spin, Tree} from 'antd';
import {useCallback, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {IMPORTANT_SOURCE_ATTRS} from '../../../../constants/source.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './AppSource.module.css';
import AppSourceTree from './AppSourceTree.jsx';
import AppSourceTreeActions from './AppSourceTreeActions.jsx';

/**
 * Wrapper around source tree + actions, including loading and empty/error states.
 */
const AppSourceTreeWrapper = ({
  sourceJSON,
  sourceError,
  setExpandedPaths,
  expandedPaths,
  selectedElement = {},
  showSourceAttrs,
  methodCallInProgress,
  isUsingMjpegMode,
  isSourceRefreshOn,
  toggleShowAttributes,
  selectElement,
  unselectElement,
}) => {
  const {t} = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const flatten = (elemObj) => [elemObj, ...(elemObj.children?.flatMap(flatten) || [])];
  const flatTreeData = sourceJSON && flatten(sourceJSON);

  const elementMatchesSearch = useCallback(
    (element, value) => {
      const checkedAttrTexts = Object.entries(element.attributes)
        .filter(([name]) => IMPORTANT_SOURCE_ATTRS.includes(name) || showSourceAttrs)
        .map(([name, attrValue]) => name + attrValue);
      const allCheckedTexts = element.tagName + checkedAttrTexts;
      return allCheckedTexts.toLowerCase().includes(value.toLowerCase());
    },
    [showSourceAttrs],
  );

  const matchingElements = useMemo(
    () =>
      searchValue && flatTreeData
        ? flatTreeData.filter((el) => elementMatchesSearch(el, searchValue))
        : [],
    [searchValue, flatTreeData, elementMatchesSearch],
  );

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
        <span className={styles.sourceSearchHighlight}>{matchedWord}</span>
        {suffix}
      </>
    );
  };

  const getFormattedTag = (element) => {
    const {tagName, attributes} = element;
    let attrs = [];

    for (let attr of Object.keys(attributes)) {
      if ((IMPORTANT_SOURCE_ATTRS.includes(attr) && attributes[attr]) || showSourceAttrs) {
        attrs.push(
          <span key={attr}>
            &nbsp;
            <span className={styles.sourceNodeAttrName}>{getHighlightedText(attr)}</span>=&quot;
            <span className={styles.sourceNodeAttrValue}>
              {getHighlightedText(attributes[attr])}
            </span>
            &quot;
          </span>,
        );
      }
    }

    return (
      <span className={inspectorStyles.monoFont}>
        &lt;<span className={styles.sourceNodeTag}>{getHighlightedText(tagName)}</span>
        {attrs}&gt;
      </span>
    );
  };

  // Recurses through the source and renders a TreeNode for an element
  const recursive = (elemObj) => {
    if (!((elemObj || {}).children || []).length) {
      return null;
    }

    return elemObj.children.map((el) => ({
      title: getFormattedTag(el),
      key: el.path,
      children: recursive(el),
    }));
  };

  const treeData = sourceJSON && recursive(sourceJSON);

  // No need to recalculate if e.g. attribute visibility is toggled
  const expandedKeys = useMemo(
    () => [...matchingElements.map((el) => el.path), ...expandedPaths],
    [matchingElements, expandedPaths],
  );

  const expandNode = (nextExpandedPaths) => {
    setExpandedPaths(nextExpandedPaths);
    setAutoExpandParent(false);
  };

  const collapseAllNodes = () => {
    setExpandedPaths([]);
    setAutoExpandParent(false);
  };

  const onSearchChange = (event) => {
    const {value} = event.target;
    setSearchValue(value);
    setAutoExpandParent(value !== '');
  };

  return (
    <div id="sourceContainer" className={styles.treeContainer} tabIndex="0">
      {!sourceJSON && !sourceError && <i>{t('Gathering initial app source…')}</i>}
      {sourceError && t('couldNotObtainSource', {errorMsg: JSON.stringify(sourceError)})}
      {/* Show loading indicator in MJPEG mode if a method call is in progress and source refresh is on */}
      <Spin size="large" spinning={!!methodCallInProgress && isUsingMjpegMode && isSourceRefreshOn}>
        {/* Must switch to a new antd Tree component when there's changes to treeData  */}
        {treeData ? (
          <div className={styles.treeWrapper}>
            <AppSourceTreeActions
              collapseAllNodes={collapseAllNodes}
              toggleShowAttributes={toggleShowAttributes}
              showSourceAttrs={showSourceAttrs}
              onSearchChange={onSearchChange}
              searchValue={searchValue}
              matchingElementsCount={matchingElements.length}
            />
            <AppSourceTree
              treeData={treeData}
              expandNode={expandNode}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              selectElement={selectElement}
              unselectElement={unselectElement}
              selectedElementPath={selectedElement.path}
            />
          </div>
        ) : (
          <Tree treeData={[]} />
        )}
      </Spin>
    </div>
  );
};

export default AppSourceTreeWrapper;
