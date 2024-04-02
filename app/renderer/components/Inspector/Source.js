import {Spin, Tree} from 'antd';
import React from 'react';

import {IMPORTANT_SOURCE_ATTRS} from '../../constants/source';
import InspectorStyles from './Inspector.css';
import LocatorTestModal from './LocatorTestModal';
import SiriCommandModal from './SiriCommandModal';

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
    t,
  } = props;

  const getFormattedTag = (el, showAllAttrs) => {
    const {tagName, attributes} = el;
    let attrs = [];

    for (let attr of Object.keys(attributes)) {
      if ((IMPORTANT_SOURCE_ATTRS.includes(attr) && attributes[attr]) || showAllAttrs) {
        attrs.push(
          <span key={attr}>
            &nbsp;
            <i className={InspectorStyles.sourceAttrName}>{attr}</i>=
            <span className={InspectorStyles.sourceAttrValue}>&quot;{attributes[attr]}&quot;</span>
          </span>,
        );
      }
    }
    return (
      <span>
        &lt;<b className={InspectorStyles.sourceTag}>{tagName}</b>
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
