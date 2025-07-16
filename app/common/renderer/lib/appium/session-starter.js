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

import webdriver from 'webdriver';

import {DEFAULT_SERVER_PROPS} from '../../constants/webdriver.js';
import WDSessionDriver from './session-driver.js';

/**
 * Class used to retrieve a webdriver session,
 * either by creating a new one, or finding an existing one,
 * with additional safeguards for session parameters
 */
export default class WDSessionStarter {
  static async newSession(serverOpts, capabilities = {}) {
    const safeServerOpts = {...DEFAULT_SERVER_PROPS, ...serverOpts, capabilities};
    const sessionClient = await webdriver.newSession(safeServerOpts);
    return new WDSessionDriver(sessionClient);
  }

  static attachToSession(sessionId, serverOpts, capabilities = {}) {
    if (!sessionId) {
      throw new Error("Can't attach to a session without a session id");
    }
    const isW3C = true;
    const safeServerOpts = {sessionId, isW3C, ...DEFAULT_SERVER_PROPS, ...serverOpts, capabilities};
    const sessionClient = webdriver.attachToSession(safeServerOpts);
    return new WDSessionDriver(sessionClient);
  }
}
