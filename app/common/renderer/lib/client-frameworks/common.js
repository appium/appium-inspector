import {DEFAULT_SWIPE, DEFAULT_TAP} from '../../constants/screenshot.js';
import {isEmpty} from '../../utils/common.js';

// must match ELEMENT_REF_PREFIX in plugins/recorder.mjs
export const ELEMENT_REF_PLACEHOLDER = '__SR_ELEMENT_REF_';

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

  // Java and .NET client boilerplates must define imports from client classes
  // specific to the provided platform/automation name
  getPackageAndClass(automationNameMap, platformNameMap, defaultPkgClass) {
    const automationName = (this.caps['appium:automationName'] || this.caps.automationName)?.toLowerCase();
    if (automationName && automationNameMap.has(automationName)) {
      return automationNameMap.get(automationName);
    }
    const platformName = this.caps.platformName?.toLowerCase();
    if (platformName && platformNameMap.has(platformName)) {
      return platformNameMap.get(platformName);
    }
    return defaultPkgClass;
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

  // Escape a value as a string literal valid in Python, JS, Java and C# (a superset of JSON),
  // with the line separators JSON.stringify leaves raw also escaped, so a value taken from the
  // app under test or the server cannot close the literal or start a new line.
  quote(value) {
    return JSON.stringify(String(value)).replace(
      /[\u0085\u2028\u2029]/g,
      (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );
  }

  handleUnsupportedLocatorStrategy(strategy, locator) {
    return this.addComment(
      `Code generation for locator strategy ${this.quote(strategy)} (selector ${this.quote(locator)}) is not currently supported`,
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

  // Actions recorded on the server by the Inspector Appium plugin (plugins/recorder.mjs)

  codeFor_comment(text) {
    return this.addComment(String(text ?? '').replace(/[\r\n\u0085\u2028\u2029]+/g, ' '));
  }

  /**
   * Another action's code, commented out line by line, after a note. Used for calls that are kept in
   * a recording for reference but are not part of the test (e.g. an AI agent's scouting reads).
   */
  codeFor_commentedOut(action, params, note) {
    const genCodeFn = this[`codeFor_${action}`];
    const code = genCodeFn ? genCodeFn.apply(this, params) : '';
    const lines = String(code ?? '')
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => this.addComment(line));
    return [this.codeFor_comment(`${note}:`), ...lines].join('\n');
  }

  /**
   * Expression for the WebDriver id of a found element in this language, or null when the
   * language has no stable way to read it (the recorded id is then kept with a comment).
   */
  getElementIdExpr(_varExpr) {
    return null;
  }

  /**
   * Script call whose arguments reference found elements. `jsonArg` holds placeholders
   * (`__SR_ELEMENT_REF_<n>__`) where element ids were; `elementVars[n]` is `[varName, varIndex]`
   * (or null when the element has no locator) and `elementIds[n]` the id seen while recording.
   */
  codeFor_executeScriptWithElements(scriptCmd, jsonArg, elementVars, elementIds) {
    let code = this.codeFor_executeScript(null, null, scriptCmd, jsonArg);
    const notes = [];
    elementIds.forEach((id, n) => {
      const placeholder = `${ELEMENT_REF_PLACEHOLDER}${n}__`;
      const ref = elementVars[n];
      const varExpr = ref ? this.getVarName(ref[0], ref[1]) : null;
      const idExpr = varExpr ? this.getElementIdExpr(varExpr) : null;
      if (idExpr) {
        code = code.replace(new RegExp(`(["'])${placeholder}\\1`, 'g'), idExpr);
      } else {
        code = code.replaceAll(placeholder, JSON.stringify(String(id)).slice(1, -1));
        notes.push(
          this.codeFor_comment(`Replace ${this.quote(id)} with the element id of ${varExpr ?? 'the target element'}`),
        );
      }
    });
    return [...notes, code].join('\n');
  }

  // Top-Level Commands

  codeFor_executeScript(varNameIgnore, varIndexIgnore, scriptCmd, jsonArg) {
    // jsonArg is expected to be an array with 0-1 objects
    if (isEmpty(jsonArg)) {
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
