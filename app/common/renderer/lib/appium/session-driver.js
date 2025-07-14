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

import {AppiumProtocol, MJsonWProtocol, WebDriverProtocol} from '@wdio/protocols';
import _ from 'lodash';

import {ELEMENT_CMDS, getElementFromResponse} from './session-element.js';

/**
 * Class used as a wrapper for the webdriver session client,
 * with separated handling for element-related methods,
 * as they are called on WDSessionElement
 */
export default class WDSessionDriver {
  constructor(wdSessionClient) {
    this.client = wdSessionClient;
  }

  async cmd(commandName, ...args) {
    if (!(commandName in this.client)) {
      throw new Error(`Command '${commandName}' is not available on this client`);
    }
    const res = await this.client[commandName](...args);
    if (res && res.error) {
      throw new Error(res.message ? res.message : res.error);
    }
    return res;
  }

  get sessionId() {
    return this.client.sessionId;
  }

  get capabilities() {
    return this.client.options.capabilities;
  }

  async findElement(using, value) {
    const res = await this.cmd('findElement', using, value);
    return getElementFromResponse(res, this);
  }

  async findElements(using, value) {
    const ress = await this.cmd('findElements', using, value);
    return ress.map((res) => getElementFromResponse(res, this));
  }

  async executeBase(cmd, script, args) {
    args = args.map((a) => a.__is_w2d_element ? a.executeObj : a);
    return await this.cmd(cmd, script, args);
  }

  async executeScript(script, args) {
    return await this.executeBase('executeScript', script, args);
  }

  async executeAsyncScript(script, args) {
    return await this.executeBase('executeAsyncScript', script, args);
  }
}

const AVOID_CMDS = [
  'newSession',
  'findElement',
  'findElements',
  'findElementFromElement',
  'findElementsFromElement',
  'executeScript',
  'executeAsyncScript',
];

// Walk through the webdriver protocol methods and add them to WDSessionDriver
// (except for element methods and edge cases)
for (const proto of [WebDriverProtocol, MJsonWProtocol, AppiumProtocol]) {
  for (const [, methods] of _.toPairs(proto)) {
    for (const [, cmdData] of _.toPairs(methods)) {
      const cmdName = cmdData.command;

      // if we've explicitly asked not to include the command, skip it
      if (AVOID_CMDS.includes(cmdName)) {
        continue;
      }
      // likewise skip element commands
      if (_.keys(ELEMENT_CMDS).includes(cmdName)) {
        continue;
      }

      WDSessionDriver.prototype[cmdName] = async function (...args) {
        return await this.cmd(cmdName, ...args);
      };
    }
  }
}
