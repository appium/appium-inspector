import _ from 'lodash';

import {DEFAULT_SWIPE, DEFAULT_TAP} from '../../constants/screenshot.js';

export default class CommonClientFramework {
  constructor(serverUrl, serverUrlParts, caps) {
    this.serverUrl = serverUrl;
    this.serverUrlParts = serverUrlParts;
    this.caps = caps || {};
    this.actions = [];
    this.localVarCount = 0;
    this.localVarCache = {};
    this.lastAssignedVar = null;
  }

  getTapCoordinatesFromPointerActions(pointerActions) {
    const pointerMoveAction = pointerActions[DEFAULT_TAP.POINTER_NAME][0];
    return {x: pointerMoveAction.x, y: pointerMoveAction.y};
  }

  getSwipeCoordinatesFromPointerActions(pointerActions) {
    const pointerMoveActionStart = pointerActions[DEFAULT_SWIPE.POINTER_NAME][0];
    const pointerMoveActionEnd = pointerActions[DEFAULT_SWIPE.POINTER_NAME][2];

    return {
      x1: pointerMoveActionStart.x,
      y1: pointerMoveActionStart.y,
      x2: pointerMoveActionEnd.x,
      y2: pointerMoveActionEnd.y,
    };
  }

  indent(str, spaces) {
    let lines = str.split('\n');
    let spaceStr = '';
    for (let i = 0; i < spaces; i++) {
      spaceStr += ' ';
    }
    return lines
      .filter((l) => !!l.trim())
      .map((l) => `${spaceStr}${l}`)
      .join('\n');
  }

  getCodeString(includeBoilerplate = false) {
    let str = '';
    let code;
    for (let {action, params} of this.actions) {
      const genCodeFn = `codeFor_${action}`;
      if (!this[genCodeFn]) {
        code = this.addComment(`Code generation for action '${action}' is not currently supported`);
      } else {
        code = this[genCodeFn](...params);
      }
      if (code) {
        str += `${code}\n`;
      }
    }
    if (includeBoilerplate) {
      return this.wrapWithBoilerplate(str);
    }
    return str;
  }

  getNewLocalVar() {
    this.localVarCount++;
    return `el${this.localVarCount}`;
  }

  getVarForFind(strategy, locator) {
    const key = `${strategy}-${locator}`;
    let wasNew = false;
    if (!this.localVarCache[key]) {
      this.localVarCache[key] = this.getNewLocalVar();
      wasNew = true;
    }
    this.lastAssignedVar = this.localVarCache[key];
    return [this.localVarCache[key], wasNew];
  }

  getVarName(varName, varIndex) {
    if (varIndex || varIndex === 0) {
      return `${varName}[${varIndex}]`;
    }
    return varName;
  }

  handleUnsupportedLocatorStrategy(strategy, locator) {
    return this.addComment(
      `Code generation for locator strategy '${strategy}' ` +
        `(selector '${locator}') is not currently supported`,
    );
  }

  // Common entrypoints for code generation

  codeFor_findElement(strategy, locator) {
    let [localVar, wasNew] = this.getVarForFind(strategy, locator);
    if (!wasNew) {
      // if we've already found this element, don't print out
      // finding it again
      return '';
    }
    return this.codeFor_findAndAssign(strategy, locator, localVar);
  }

  // Top-Level Commands

  codeFor_executeScript(varNameIgnore, varIndexIgnore, scriptCmd, jsonArg) {
    // jsonArg is expected to be an array with 0-1 objects
    if (_.isEmpty(jsonArg)) {
      return this.codeFor_executeScriptNoArgs(scriptCmd);
    }
    return this.codeFor_executeScriptWithArgs(scriptCmd, jsonArg);
  }

  // Device Interaction

  codeFor_getDeviceTime() {
    return this.codeFor_executeScriptNoArgs('mobile: getDeviceTime');
  }

  codeFor_hideKeyboard() {
    return this.codeFor_executeScriptNoArgs('mobile: hideKeyboard');
  }
}
