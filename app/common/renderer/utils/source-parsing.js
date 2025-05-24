import {DOMParser, MIME_TYPE, XMLSerializer} from '@xmldom/xmldom';
import _ from 'lodash';

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();

export const xmlToDOM = (string) => domParser.parseFromString(string, MIME_TYPE.XML_TEXT);
export const domToXML = (dom) => xmlSerializer.serializeToString(dom);

/**
 * Get the child nodes of a Node object
 *
 * @param {Node} domNode
 * @returns {Array<Node|null>} list of Nodes
 */
export function childNodesOf(domNode) {
  if (!domNode?.hasChildNodes()) {
    return [];
  }
  return _.filter(domNode.childNodes, ['nodeType', domNode.ELEMENT_NODE]);
}

/**
 * Look up an element in the Document source using the provided path
 *
 * @param {string} path a dot-separated string of indices
 * @param {Document} sourceDoc app source in Document format
 * @returns {Node} element node
 */
export function findDOMNodeByPath(path, sourceDoc) {
  let selectedElement = childNodesOf(sourceDoc)[0] || childNodesOf(sourceDoc.documentElement)[0];
  for (const index of path.split('.')) {
    selectedElement = childNodesOf(selectedElement)[index];
  }
  return selectedElement;
}

/**
 * Look up an element in the JSON source using the provided path
 *
 * @param {string} path a dot-separated string of indices
 * @param {Object} sourceJSON app source in JSON format
 * @returns {Object} element details in JSON format
 */
export function findJSONElementByPath(path, sourceJSON) {
  let selectedElement = sourceJSON;
  for (const index of path.split('.')) {
    selectedElement = selectedElement.children[index];
  }
  return {...selectedElement};
}

/**
 * Translates sourceXML to JSON
 *
 * @param {string} sourceXML
 * @returns {Object} source in JSON format
 */
export function xmlToJSON(sourceXML) {
  const translateRecursively = (domNode, parentPath = '', index = null) => {
    const attributes = {};
    for (let attrIdx = 0; attrIdx < domNode.attributes.length; ++attrIdx) {
      const attr = domNode.attributes.item(attrIdx);
      // it should be show new line character(\n) in GUI
      attributes[attr.name] = attr.value.replace(/(\n)/gm, '\\n');
    }

    // Dot Separated path of indices
    const path = _.isNil(index) ? '' : `${!parentPath ? '' : parentPath + '.'}${index}`;

    return {
      children: childNodesOf(domNode).map((childNode, childIndex) =>
        translateRecursively(childNode, path, childIndex),
      ),
      tagName: domNode.tagName,
      attributes,
      path,
    };
  };
  const sourceDoc = xmlToDOM(sourceXML);
  // get the first child element node in the doc. some drivers write their xml differently so we
  // first try to find an element as a direct descended of the doc, then look for one in
  // documentElement
  const firstChild = childNodesOf(sourceDoc)[0] || childNodesOf(sourceDoc.documentElement)[0];

  return firstChild ? translateRecursively(firstChild) : {};
}
