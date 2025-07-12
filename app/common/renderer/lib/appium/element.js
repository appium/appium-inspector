/**
 *    Copyright 2024 HeadSpin, Inc.
 *    Modifications copyright OpenJS Foundation and other contributors,
 *    https://openjsf.org/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import _ from 'lodash';

const W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const JWP_ELEMENT_KEY = 'ELEMENT';

export default class UIElement {
  constructor(elementKey, findRes, parent) {
    this.elementKey = elementKey;
    this.elementId = this[elementKey] = findRes[elementKey];
    this.__is_w2d_element = true;
    this.parent = parent;
    this.session = parent.session || parent;
  }

  get executeObj() {
    return {[this.elementKey]: this.elementId};
  }

  async findElement(using, value) {
    const res = await this.session.cmd('findElementFromElement', this.elementId, using, value);
    return getElementFromResponse(res, this);
  }

  async findElements(using, value) {
    const ress = await this.session.cmd('findElementsFromElement', this.elementId, using, value);
    return ress.map((res) => getElementFromResponse(res, this));
  }
}

function getElementFromResponse(res, parent) {
  let elementKey;
  if (res[W3C_ELEMENT_KEY]) {
    elementKey = W3C_ELEMENT_KEY;
  } else {
    elementKey = JWP_ELEMENT_KEY;
  }

  if (!res[elementKey]) {
    throw new Error(
      `Bad findElement response; did not have element key. ` +
        `Response was: ${JSON.stringify(res)}`,
    );
  }

  return new UIElement(elementKey, res, parent);
}

const ELEMENT_CMDS = {
  isElementSelected: 'isSelected',
  isElementDisplayed: 'isDisplayed',
  getElementAttribute: 'getAttribute',
  getElementCSSValue: 'getCSSValue',
  getElementText: 'getText',
  getElementTagName: 'getTagName',
  getElementLocation: 'getLocation',
  getElementLocationInView: 'getLocationInView',
  getElementProperty: 'getProperty',
  getElementRect: 'getRect',
  getElementSize: 'getSize',
  getElementEnabled: 'getEnabled',
  elementClick: 'click',
  elementSubmit: 'submit',
  elementClear: 'clear',
  elementSendKeys: 'sendKeys',
  takeElementScreenshot: 'takeScreenshot',
};

for (const [protoCmd, newCmd] of _.toPairs(ELEMENT_CMDS)) {
  UIElement.prototype[newCmd] = async function (...args) {
    return await this.session.cmd(protoCmd, this.elementId, ...args);
  };
}

export {ELEMENT_CMDS, getElementFromResponse, JWP_ELEMENT_KEY, W3C_ELEMENT_KEY};
