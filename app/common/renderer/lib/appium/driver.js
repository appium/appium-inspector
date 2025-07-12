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

import WDCore from 'webdriver';
import Session from './session';

export const DEFAULTS = {
  protocol: "http",
  hostname: "0.0.0.0",
  port: 4444,
  path: "/wd/hub",
  logLevel: typeof window === 'undefined' ? 'silent' : 'info'
};

export default class Web2Driver {

  static async remote ({
    protocol = DEFAULTS.protocol,
    hostname = DEFAULTS.hostname,
    port = DEFAULTS.port,
    path = DEFAULTS.path,
    logLevel = DEFAULTS.logLevel,
    ...otherParams
  },
    capabilities = {}
  ) {
    const params = {protocol, hostname, port, path, capabilities, logLevel, ...otherParams};
    const sessionClient = await WDCore.newSession(params);
    return new Session(sessionClient, logLevel);
  }

  static async attachToSession (sessionId, {
    protocol = DEFAULTS.protocol,
    hostname = DEFAULTS.hostname,
    port = DEFAULTS.port,
    path = DEFAULTS.path,
    logLevel = DEFAULTS.logLevel,
    ...otherParams
  }, capabilities = {}, isW3C = true) {
    if (!sessionId) {
      throw new Error("Can't attach to a session without a session id");
    }
    const params = {sessionId, isW3C, protocol, hostname, port, path, capabilities, ...otherParams};
    const sessionClient = await WDCore.attachToSession(params);
    return new Session(sessionClient, logLevel);
  }
}
