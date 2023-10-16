import XPath from 'xpath';
import { withTranslation as wt } from 'react-i18next';
import _ from 'lodash';
import { log } from './polyfills';
import config from '../configs/app.config';
import { DOMParser } from '@xmldom/xmldom';

const VALID_W3C_CAPS = ['platformName', 'browserName', 'browserVersion', 'acceptInsecureCerts',
  'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior'];


// Attributes on nodes that are likely to be unique to the node so we should consider first when
// suggesting xpath locators. These are considered IN ORDER.
const UNIQUE_XPATH_ATTRIBUTES = [
  'name',
  'content-desc',
  'id',
  'accessibility-id',
  'text',
  'label',
  'value',
];

const UNIQUE_CLASS_CHAIN_ATTRIBUTES = [
  'label',
  'name',
  'value',
];
const UNIQUE_PREDICATE_ATTRIBUTES = [
  'label',
  'name',
  'value',
  'type',
];

/**
 * Translates sourceXML to JSON
 *
 * @param {string} source
 * @returns {Object}
 */
export function xmlToJSON (source) {
  const childNodesOf = (xmlNode) => {
    if (!xmlNode || !xmlNode.hasChildNodes()) {
      return [];
    }

    const result = [];
    for (let childIdx = 0; childIdx < xmlNode.childNodes.length; ++childIdx) {
      const childNode = xmlNode.childNodes.item(childIdx);
      if (childNode.nodeType === 1) {
        result.push(childNode);
      }
    }
    return result;
  };
  const translateRecursively = (xmlNode, parentPath = '', index = null) => {
    const attributes = {};
    for (let attrIdx = 0; attrIdx < xmlNode.attributes.length; ++attrIdx) {
      const attr = xmlNode.attributes.item(attrIdx);
      attributes[attr.name] = attr.value;
    }

    // Dot Separated path of indices
    const path = _.isNil(index) ? '' : `${!parentPath ? '' : parentPath + '.'}${index}`;
    const classChainSelector = isIOS ? getOptimalClassChain(xmlDoc, xmlNode, UNIQUE_CLASS_CHAIN_ATTRIBUTES) : '';
    const predicateStringSelector = isIOS ? getOptimalPredicateString(xmlDoc, xmlNode, UNIQUE_PREDICATE_ATTRIBUTES) : '';

    return {
      children: childNodesOf(xmlNode)
        .map((childNode, childIndex) => translateRecursively(childNode, path, childIndex)),
      tagName: xmlNode.tagName,
      attributes,
      xpath: getOptimalXPath(xmlDoc, xmlNode, UNIQUE_XPATH_ATTRIBUTES),
      ...(isIOS ? {classChain: classChainSelector ? `**${classChainSelector}` : ''} : {}),
      ...(isIOS ? {predicateString: predicateStringSelector ? predicateStringSelector : ''} : {}),
      path,
    };
  };
  const isIOS = source.includes('XCUIElement');
  const xmlDoc = new DOMParser().parseFromString(source);
  // get the first child element node in the doc. some drivers write their xml differently so we
  // first try to find an element as a direct descendend of the doc, then look for one in
  // documentElement
  const firstChild = childNodesOf(xmlDoc)[0] || childNodesOf(xmlDoc.documentElement)[0];

  return firstChild ? translateRecursively(firstChild) : {};
}

/**
 * Return information about whether an xpath query results in a unique element, and the non-unique
 * index of the element in the document if not unique
 *
 * @param {string} xpath
 * @param {DOMDocument} doc
 * @param {DOMNode} domNode - the current node
 * @returns {[boolean, number?]} tuple consisting of (1) whether the xpath is unique and (2) its index in
 * the set of other similar nodes if not unique
 */
function isXpathUnique(xpath, doc, domNode) {
  let othersWithAttr = [];

  // If the XPath does not parse, move to the next unique attribute
  try {
    othersWithAttr = XPath.select(xpath, doc);
  } catch (ign) {
    return [false];
  }

  if (othersWithAttr.length > 1) {
    return [false, othersWithAttr.indexOf(domNode)];
  }

  return [true];
}

/**
 * Get an optimal XPath for a DOMNode
 *
 * @param {DOMDocument} doc
 * @param {DOMNode} domNode
 * @param {Array<String>} uniqueAttributes Attributes we know are unique
 * @returns {string|null}
 */
export function getOptimalXPath (doc, domNode, uniqueAttributes) {
  try {
    // BASE CASE #1: If this isn't an element, we're above the root, return empty string
    if (!domNode.tagName || domNode.nodeType !== 1) {
      return '';
    }

    const tagForXpath = domNode.tagName || '*';
    let semiUniqueXpath = null;

    // BASE CASE #2: If this node has a unique attribute or content attribute, return an absolute XPath with that attribute
    for (const attrName of uniqueAttributes) {
      const attrValue = domNode.getAttribute(attrName);
      if (!attrValue) {
        continue;
      }
      const xpath = `//${tagForXpath}[@${attrName}="${attrValue}"]`;
      const [isUnique, indexIfNotUnique] = isXpathUnique(xpath, doc, domNode);
      if (isUnique) {
        return xpath;
      }

      // if the xpath wasn't totally unique it might still be our best bet. Store a less unique
      // version qualified by an index for later in semiUniqueXpath. If we can't find a better
      // unique option down the road, we'll fall back to this
      if (!semiUniqueXpath && !_.isUndefined(indexIfNotUnique)) {
        semiUniqueXpath = `(${xpath})[${indexIfNotUnique + 1}]`;
      }
    }

    // BASE CASE #3: If this node has a unique pair of attributes, return an xpath based on that pair
    const pairAttributes = uniqueAttributes.flatMap((v1, i) =>
      uniqueAttributes.slice(i + 1).map((v2) => [v1, v2]));
    for (const [attr1Name, attr2Name] of pairAttributes) {
      const attr1Value = domNode.getAttribute(attr1Name);
      const attr2Value = domNode.getAttribute(attr2Name);
      if (!attr1Value || !attr2Value) {
        continue;
      }
      const xpath = `//${tagForXpath}[@${attr1Name}="${attr1Value}" and @${attr2Name}="${attr2Value}"]`;
      if (isXpathUnique(xpath, doc, domNode)[0]) {
        return xpath;
      }
    }

    // if we couldn't find any good totally unique or pairwise unique attributes, but we did find
    // almost unique attributes qualified by an index, return that instead
    if (semiUniqueXpath) {
      return semiUniqueXpath;
    }

    // Otherwise fall back to a purely hierarchical expression of this dom node's position in the
    // document as a last resort.

    // Get the relative xpath of this node using tagName
    let xpath = `/${domNode.tagName}`;

    // If this node has siblings of the same tagName, get the index of this node
    if (domNode.parentNode) {
      // Get the siblings
      const childNodes = Array.prototype.slice.call(domNode.parentNode.childNodes, 0).filter((childNode) => (
        childNode.nodeType === 1 && childNode.tagName === domNode.tagName
      ));

      // If there's more than one sibling, append the index
      if (childNodes.length > 1) {
        let index = childNodes.indexOf(domNode);
        xpath += `[${index + 1}]`;
      }
    }

    // Make a recursive call to this nodes parents and prepend it to this xpath
    return getOptimalXPath(doc, domNode.parentNode, uniqueAttributes) + xpath;
  } catch (error) {
    // If there's an unexpected exception, abort and don't get an XPath
    log.error(`The most optimal XPATH could not be determined because an error was thrown: '${JSON.stringify(error, null, 2)}'`);

    return null;
  }
}

/**
 * Get an optimal Class Chain for a DOMNode based on the getOptimalXPath method
 *
 * @param {DOMDocument} doc
 * @param {DOMNode} domNode
 * @param {Array<String>} uniqueAttributes Attributes we know are unique
 * @returns {string|null}
 */
function getOptimalClassChain (doc, domNode, uniqueAttributes) {
  try {
    // BASE CASE #1: If this isn't an element, we're above the root, or this is `XCUIElementTypeApplication`,
    // which is not an official XCUITest element, return empty string
    if (!domNode.tagName || domNode.nodeType !== 1 || domNode.tagName === 'XCUIElementTypeApplication') {
      return '';
    }

    // BASE CASE #2: If this node has a unique class chain based on attributes then return it
    for (let attrName of uniqueAttributes) {
      const attrValue = domNode.getAttribute(attrName);
      if (attrValue) {
        let xpath = `//${domNode.tagName || '*'}[@${attrName}="${attrValue}"]`;
        let classChain = `/${domNode.tagName || '*'}[\`${attrName} == "${attrValue}"\`]`;
        let othersWithAttr;

        // If the XPath does not parse, move to the next unique attribute
        try {
          othersWithAttr = XPath.select(xpath, doc);
        } catch (ign) {
          continue;
        }

        // If the attribute isn't actually unique, get it's index too
        if (othersWithAttr.length > 1) {
          let index = othersWithAttr.indexOf(domNode);
          classChain = `${classChain}[${index + 1}]`;
        }
        return classChain;
      }
    }

    // Get the relative xpath of this node using tagName
    let classChain = `/${domNode.tagName}`;

    // If this node has siblings of the same tagName, get the index of this node
    if (domNode.parentNode) {
      // Get the siblings
      const childNodes = Array.prototype.slice.call(domNode.parentNode.childNodes, 0).filter((childNode) => (
        childNode.nodeType === 1 && childNode.tagName === domNode.tagName
      ));

      // If there's more than one sibling, append the index
      if (childNodes.length > 1) {
        let index = childNodes.indexOf(domNode);
        classChain += `[${index + 1}]`;
      }
    }

    // Make a recursive call to this nodes parents and prepend it to this xpath
    return getOptimalClassChain(doc, domNode.parentNode, uniqueAttributes) + classChain;
  } catch (error) {
    // If there's an unexpected exception, abort and don't get an XPath
    log.error(`The most optimal '-ios class chain' could not be determined because an error was thrown: '${JSON.stringify(error, null, 2)}'`);

    return null;
  }
}

/**
 * Get an optimal Predicate String for a DOMNode based on the getOptimalXPath method
 * The `ios predicate string` can only search a single element, no parent child scope
 *
 * @param {DOMDocument} doc
 * @param {DOMNode} domNode
 * @param {Array<String>} uniqueAttributes Attributes we know are unique
 * @returns {string|null}
 */
function getOptimalPredicateString (doc, domNode, uniqueAttributes) {
  try {
    // BASE CASE #1: If this isn't an element, we're above the root, or this is `XCUIElementTypeApplication`,
    // which is not an official XCUITest element, return empty string
    if (!domNode.tagName || domNode.nodeType !== 1 || domNode.tagName === 'XCUIElementTypeApplication') {
      return '';
    }

    // BASE CASE #2: Check all attributes and try to find the best way
    let xpathAttributes = [];
    let predicateString = [];

    for (let attrName of uniqueAttributes) {
      const attrValue = domNode.getAttribute(attrName);

      if (_.isNil(attrValue) || _.isString(attrValue) && attrValue.length === 0) {
        continue;
      }

      xpathAttributes.push(`@${attrName}="${attrValue}"`);
      const xpath = `//*[${xpathAttributes.join(' and ')}]`;
      predicateString.push(`${attrName} == "${attrValue}"`);
      let othersWithAttr;

      // If the XPath does not parse, move to the next unique attribute
      try {
        othersWithAttr = XPath.select(xpath, doc);
      } catch (ign) {
        continue;
      }

      // If the attribute isn't actually unique, get it's index too
      if (othersWithAttr.length === 1) {
        return predicateString.join(' AND ');
      }
    }
  } catch (error) {
    // If there's an unexpected exception, abort and don't get an XPath
    log.error(`The most optimal '-ios predicate string' could not be determined because an error was thrown: '${JSON.stringify(error, null, 2)}'`);

    return null;
  }
}

export function withTranslation (componentCls, ...hocs) {
  return _.flow(
    ...hocs,
    wt(config.namespace),
  )(componentCls);
}

export function addVendorPrefixes (caps) {
  return caps.map((cap) => {
    // if we don't have a valid unprefixed cap or a cap with an existing prefix, update it
    if (!VALID_W3C_CAPS.includes(cap.name) && !_.includes(cap.name, ':')) {
      cap.name = `appium:${cap.name}`;
    }
    return cap;
  });
}
