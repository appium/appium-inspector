import React from 'react';
import { Tree, Spin } from 'antd';
import LocatorTestModal from './LocatorTestModal';
import InspectorStyles from './Inspector.css';
import SiriCommandModal from './SiriCommandModal';

const IMPORTANT_ATTRS = [
  'name',
  'content-desc',
  'resource-id',
  'AXDescription',
  'AXIdentifier',
];

/**
 * Shows the 'source' of the app as a Tree
 */
const Source = (props) => {
  const { source, sourceError, setExpandedPaths, expandedPaths, selectedElement = {}, showSourceAttrs,
          methodCallInProgress, mjpegScreenshotUrl, isSourceRefreshOn, t } = props;

  const getFormattedTag = (el, showAllAttrs) => {
    const { tagName, attributes } = el;
    let attrs = [];

    for (let attr of Object.keys(attributes)) {
      if (IMPORTANT_ATTRS.includes(attr) || showAllAttrs) {
        attrs.push(<span key={attr}>&nbsp;
          <i
            className={InspectorStyles.sourceAttrName}
          >{attr}</i>=<span
            className={InspectorStyles.sourceAttrValue}
          >&quot;{attributes[attr]}&quot;</span>
        </span>);
      }
    }
    return <span>
      &lt;<b className={InspectorStyles.sourceTag}>{tagName}</b>{attrs}&gt;
    </span>;
  };

  /**
   * Binds to antd Tree onSelect. If an item is being unselected, path is undefined
   * otherwise 'path' refers to the element's path.
   */
  const handleSelectElement = (path) => {
    const { selectElement, unselectElement } = props;

    if (!path) {
      unselectElement();
    } else {
      selectElement(path);
    }
  };

  // Recursives through the source and renders a TreeNode for an element
  const recursive = (elemObj) => {
    if (!((elemObj || {}).children || []).length) { return null; }

    return elemObj.children.map((el) => ({
      title: getFormattedTag(el, showSourceAttrs),
      key: el.path,
      children: recursive(el),
    }));
  };

  const treeData = source && recursive(source);

  return <div id='sourceContainer' className={InspectorStyles['tree-container']} tabIndex="0">
    {!source && !sourceError && <i>{t('Gathering initial app source…')}</i>}
    {sourceError && t('couldNotObtainSource', {errorMsg: JSON.stringify(sourceError)})}
    {/* Show loading indicator in MJPEG mode if a method call is in progress and source refresh is on */}
    <Spin size='large' spinning={!!methodCallInProgress && mjpegScreenshotUrl && isSourceRefreshOn}>
      {/* Must switch to a new antd Tree component when there's changes to treeData  */}
      {treeData ?
        <Tree
          defaultExpandAll={true}
          onExpand={setExpandedPaths}
          expandedKeys={expandedPaths}
          onSelect={(selectedPaths) => handleSelectElement(selectedPaths[0])}
          selectedKeys={[selectedElement.path]}
          treeData={treeData} />
        :
        <Tree
          treeData={[]} />
      }
    </Spin>
    <LocatorTestModal {...props} />
    <SiriCommandModal {...props} />
  </div>;
};

export default Source;
