import {Spin, Tree} from 'antd';
import React, {useEffect} from 'react';
import {renderToString} from 'react-dom/server';
import {IMPORTANT_SOURCE_ATTRS} from '../../constants/source';
import InspectorStyles from './Inspector.module.css';
import LocatorTestModal from './LocatorTestModal.jsx';
import SiriCommandModal from './SiriCommandModal.jsx';
import {uniq} from 'lodash';

/**
 * Highlights the part of the node text in source tree that matches the search term.
 * If HTML element contains a part of search value, then the content will be updated
 * with a highlighted span. This span will have a class name 'tree-search-value' and
 * will have a data attribute 'match' which will hold the search value. If no match found
 * then the original node text will be returned.
 *
 * @param {string} nodeText - The text content of the node
 * @param {string} searchText - The search term to highlight
 * @returns {ReactNode} - The node text with highlighted search term
 *
 */
export const highlightNodeMatchingSearchTerm = (nodeText, searchText) => {
  if (!searchText || !nodeText) {
    return nodeText;
  }

  const index = nodeText.toLowerCase().indexOf(searchText.toLowerCase());
  if (index < 0) {
    return nodeText;
  }
  const prefix = nodeText.substring(0, index);
  const suffix = nodeText.slice(index + searchText.length);
  //Matched word will be wrapped in a separate span for custom highlighting
  const matchedWord = nodeText.slice(index, index + searchText.length);

  return (
    <>
      {prefix}
      <span className="search-word-highlighted" data-match={searchText}>
        {matchedWord}
      </span>
      {suffix}
    </>
  );
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
    mjpegScreenshotUrl,
    isSourceRefreshOn,
    pageSourceSearchText,
    t,
  } = props;

  useEffect(() => {
    if (!treeData || !pageSourceSearchText) {
      return;
    }

    const nodesMatchingSearchTerm = [];

    /**
     * If any search text is entered, we will try to find matching nodes in the tree.
     * and expand their parents to make the nodes visible that matches the
     * search text.
     *
     * hierarchy is an array of node keys representing the path from the root to the
     * current node.
     */
    const findNodesToExpand = (node, hierarchy) => {
      /* Node title will an object representing a react element.
       * renderToString method will construct a HTML DOM string
       * which can be used to match against the search text.
       *
       * If any node that matches the search text is found, we will add all its
       * parents to the 'nodesMatchingSearchTerm' array to make them automatically expand.
       */
      const nodeText = renderToString(node.title).toLowerCase();
      if (nodeText.includes(pageSourceSearchText.toLowerCase())) {
        nodesMatchingSearchTerm.push(...hierarchy);
      }
      if (node.children) {
        node.children.forEach((c) => findNodesToExpand(c, [...hierarchy, node.key]));
      }
    };
    treeData.forEach((node) => findNodesToExpand(node, [node.key]));
    setExpandedPaths(uniq(nodesMatchingSearchTerm));
  }, [treeData, pageSourceSearchText]);

  const getFormattedTag = (el, showAllAttrs) => {
    const {tagName, attributes} = el;
    let attrs = [];

    for (let attr of Object.keys(attributes)) {
      if ((IMPORTANT_SOURCE_ATTRS.includes(attr) && attributes[attr]) || showAllAttrs) {
        const keyNode = highlightNodeMatchingSearchTerm(attr, pageSourceSearchText);
        const valueNode = highlightNodeMatchingSearchTerm(attributes[attr], pageSourceSearchText);

        attrs.push(
          <span key={attr}>
            &nbsp;
            <i className={InspectorStyles.sourceAttrName}>{keyNode}</i>=
            <span className={InspectorStyles.sourceAttrValue}>&quot;{valueNode}&quot;</span>
          </span>,
        );
      }
    }

    return (
      <span>
        &lt;
        <b className={InspectorStyles.sourceTag}>
          {highlightNodeMatchingSearchTerm(tagName, pageSourceSearchText)}
        </b>
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

  return (
    <div id="sourceContainer" className={InspectorStyles['tree-container']} tabIndex="0">
      {!sourceJSON && !sourceError && <i>{t('Gathering initial app source…')}</i>}
      {sourceError && t('couldNotObtainSource', {errorMsg: JSON.stringify(sourceError)})}
      {/* Show loading indicator in MJPEG mode if a method call is in progress and source refresh is on */}
      <Spin
        size="large"
        spinning={!!methodCallInProgress && mjpegScreenshotUrl && isSourceRefreshOn}
      >
        {/* Must switch to a new antd Tree component when there's changes to treeData  */}
        {treeData ? (
          <Tree
            defaultExpandAll={true}
            onExpand={setExpandedPaths}
            expandedKeys={expandedPaths}
            onSelect={(selectedPaths) => handleSelectElement(selectedPaths[0])}
            selectedKeys={[selectedElement.path]}
            treeData={treeData}
          />
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
