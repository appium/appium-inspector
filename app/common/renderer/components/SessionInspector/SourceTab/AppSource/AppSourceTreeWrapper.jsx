import {Spin, Tree} from 'antd';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {IMPORTANT_SOURCE_ATTRIBUTES} from '../../../../../shared/setting-defs.js';
import {IMPORTANT_SOURCE_ATTRS} from '../../../../constants/source.js';
import {getSetting, setSetting} from '../../../../polyfills.js';
import {log} from '../../../../utils/logger.js';
import {getVisibleSourceAttributes, sourceElementMatchesSearch} from '../../../../utils/source-attributes.js';
import AppSourceTree from './AppSourceTree.jsx';
import AppSourceTreeActions from './AppSourceTreeActions.jsx';

import inspectorStyles from '../../SessionInspector.module.css';
import styles from './AppSource.module.css';

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
  const [importantAttrs, setImportantAttrs] = useState(IMPORTANT_SOURCE_ATTRS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getSetting(IMPORTANT_SOURCE_ATTRIBUTES)
      .then((savedAttrs) => {
        if (active && Array.isArray(savedAttrs) && savedAttrs.every((attr) => typeof attr === 'string')) {
          setImportantAttrs(savedAttrs);
        }
      })
      .catch((error) => log.error(error))
      .finally(() => {
        if (active) {
          setSettingsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const updateImportantAttrs = async (attrs) => {
    setImportantAttrs(attrs);
    await setSetting(IMPORTANT_SOURCE_ATTRIBUTES, attrs);
  };

  const flatten = (elemObj) => [elemObj, ...(elemObj.children?.flatMap(flatten) || [])];
  const flatTreeData = sourceJSON && flatten(sourceJSON);
  const availableAttrs = [
    ...new Set([
      ...IMPORTANT_SOURCE_ATTRS,
      ...importantAttrs,
      ...(flatTreeData || []).flatMap((element) => Object.keys(element.attributes)),
    ]),
  ].sort();

  const elementMatchesSearch = useCallback(
    (element, value) => sourceElementMatchesSearch(element, value, importantAttrs, showSourceAttrs),
    [importantAttrs, showSourceAttrs],
  );

  const matchingElements = useMemo(
    () => (searchValue && flatTreeData ? flatTreeData.filter((el) => elementMatchesSearch(el, searchValue)) : []),
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

    for (const [attr, value] of getVisibleSourceAttributes(attributes, importantAttrs, showSourceAttrs)) {
      attrs.push(
        <span key={attr}>
          &nbsp;
          <span className={styles.sourceNodeAttrName}>{getHighlightedText(attr)}</span>=&quot;
          <span className={styles.sourceNodeAttrValue}>{getHighlightedText(value)}</span>
          &quot;
        </span>,
      );
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
              importantAttrs={importantAttrs}
              availableAttrs={availableAttrs}
              onImportantAttrsChange={updateImportantAttrs}
              settingsLoaded={settingsLoaded}
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
