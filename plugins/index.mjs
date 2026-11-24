import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {BasePlugin} from '@appium/base-plugin';

import {generateCode, SUPPORTED_FORMATS} from './codegen.mjs';
import {needsUpgrade, upgradeLocator} from './locator-upgrade.mjs';
import {isReadOnlyCommand, RecordingActiveError, RecordingFinishedError, recorderSettings, store} from './recorder.mjs';

const PLUGIN_ROOT_PATH = '/inspector';
const RECORDINGS_API_PATH = `${PLUGIN_ROOT_PATH}/api/recordings`;
const INDEX_HTML = 'index.html';
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist-browser');
// element attributes that tell whether a field hides its text, with the value that means it does:
// IsPassword (UIA / wincore), password (UiAutomator2, Espresso), type (XCUITest secure text fields)
const PASSWORD_ATTRIBUTES = [
  ['IsPassword', 'true'],
  ['password', 'true'],
  ['type', 'xcuielementtypesecuretextfield'],
];
// capability that starts recording with the session: appium:inspectorRecord = true
const RECORD_CAPABILITY = 'inspectorRecord';

/**
 * Appium Inspector Plugin class
 * @extends {BasePlugin}
 */
export class AppiumInspectorPlugin extends BasePlugin {
  /**
   * Recorder control for any WebDriver client, e.g. test code (driver.executeScript('inspector: startRecording'))
   * or an AI agent through an MCP server that can run driver extension commands.
   * These calls are never recorded themselves.
   */
  static executeMethodMap = {
    'inspector: startRecording': {command: 'startRecording'},
    'inspector: stopRecording': {command: 'stopRecording'},
    'inspector: pauseRecording': {command: 'pauseRecording'},
    'inspector: resumeRecording': {command: 'resumeRecording'},
    'inspector: clearRecording': {command: 'clearRecording'},
    'inspector: getRecording': {
      command: 'getRecording',
      params: {optional: ['format', 'boilerplate', 'includeSteps']},
    },
  };

  /**
   * Creates an instance of AppiumInspectorPlugin
   * @param {string} name - The name of the plugin
   * @param {Record<string, unknown>} cliArgs - Command line arguments
   */
  constructor(name, cliArgs) {
    super(name, cliArgs);
    this.recorder = recorderSettings();
    // page source of the current app state, reused until a command may have changed it
    this.sourceCache = null;
  }

  /**
   * Records the successful commands of sessions whose recording was started, whichever client sent
   * them (Inspector, test code, or an AI agent through an MCP server). Sessions that are not recorded
   * only pass through, with a map lookup as their whole overhead.
   * Recording never changes the command's result or error.
   * @param {Function} next - Runs the command in the next plugin or the driver
   * @param {any} driver - The session's driver
   * @param {string} cmdName - Appium command name
   * @param {...any} args - Command arguments (payload params, then url params)
   * @returns {Promise<any>}
   */
  async handle(next, driver, cmdName, ...args) {
    // deleteSession runs on Appium's umbrella driver, which gets the session id as its argument
    const sessionId = cmdName === 'deleteSession' ? (args[0] ?? driver?.sessionId) : driver?.sessionId;
    if (!this.recorder.enabled || !sessionId || cmdName === 'createSession') {
      return await next();
    }
    if (cmdName === 'deleteSession') {
      const result = await next();
      store.sessionEnded(sessionId);
      if (store.get(sessionId)?.active) {
        await this.finishRecording(sessionId);
      }
      return result;
    }
    let rec = store.get(sessionId);
    if (!rec?.active) {
      if (rec || !(this.recorder.recordAll || this.wantsRecording(driver))) {
        store.noteSession(sessionId, driver.caps);
        return await next();
      }
      rec = store.start(sessionId, driver.caps);
    }
    // A paused recording still goes through here: it adds no steps (and suggests no locators), but
    // keeps tracking finds, so later steps keep their locators, and keeps the page source cache valid.
    const extra = cmdName === 'setValue' && !rec.paused ? {secret: await this.isPasswordField(driver, args[1])} : {};
    if (this.recorder.suggestLocators) {
      await this.suggestLocators(driver, cmdName, args);
    }
    const result = await next();
    if (cmdName === 'getPageSource' && typeof result === 'string') {
      this.sourceCache = result; // the client read it anyway: reuse it for suggestions
    } else if (!isReadOnlyCommand(cmdName, args)) {
      this.sourceCache = null;
    }
    try {
      // the recording may have been stopped while the command ran
      if (rec.active) {
        rec.recordCommand(cmdName, args, result, extra);
      }
    } catch (err) {
      this.log.warn(`Recorder could not record '${cmdName}': ${err.message}`);
    }
    return result;
  }

  /**
   * Execute scripts: 'inspector: ...' recorder commands are handled here, all others are recorded
   * like any other command.
   * @param {Function} next
   * @param {any} driver
   * @param {string} script
   * @param {any[]} protoArgs
   * @returns {Promise<any>}
   */
  async execute(next, driver, script, protoArgs) {
    if (script in AppiumInspectorPlugin.executeMethodMap) {
      if (!this.recorder.enabled) {
        throw new Error('The Inspector recorder is disabled on this server (APPIUM_RECORDER=off)');
      }
      return await this.executeMethod(next, driver, script, protoArgs);
    }
    return await this.handle(next, driver, 'execute', script, protoArgs);
  }

  /**
   * @param {any} driver
   * @returns {boolean} whether the session asked to be recorded from its start
   */
  wantsRecording(driver) {
    const value = driver?.caps?.[RECORD_CAPABILITY] ?? driver?.opts?.[RECORD_CAPABILITY];
    return value === true || value === 'true';
  }

  recordingOf(driver) {
    const rec = store.get(driver?.sessionId);
    if (!rec) {
      throw new Error('This session is not being recorded. Call "inspector: startRecording" first.');
    }
    return rec;
  }

  /** 'inspector: startRecording': start recording this session (once: a stopped recording is final). */
  async startRecording(next, driver) {
    const rec = store.start(driver.sessionId, driver.caps);
    store.forgetSession(driver.sessionId);
    this.log.info(`Recording session ${driver.sessionId}`);
    return rec.summary();
  }

  /** 'inspector: stopRecording': finish the recording and save it (steps.json, actions.json, locators.md). */
  async stopRecording(next, driver) {
    const rec = this.recordingOf(driver);
    await this.finishRecording(driver.sessionId);
    store.noteSession(driver.sessionId, driver.caps);
    return rec.summary();
  }

  /** 'inspector: pauseRecording' */
  async pauseRecording(next, driver) {
    const rec = this.recordingOf(driver);
    rec.paused = true;
    return rec.summary();
  }

  /** 'inspector: resumeRecording' */
  async resumeRecording(next, driver) {
    const rec = this.recordingOf(driver);
    rec.paused = false;
    return rec.summary();
  }

  /** 'inspector: clearRecording': drop the steps recorded so far, keep recording. */
  async clearRecording(next, driver) {
    const rec = this.recordingOf(driver);
    rec.clear();
    return rec.summary();
  }

  /**
   * 'inspector: getRecording': summary and locators.md, plus test code when `format` is given
   * (python, java, junit5, wdio, csharp, ruby, robot, oxygen) and the raw steps with includeSteps.
   */
  async getRecording(next, driver, format, boilerplate, includeSteps) {
    const rec = this.recordingOf(driver);
    const out = {...rec.summary(), locatorsMd: rec.toLocatorsMarkdown(), formats: SUPPORTED_FORMATS};
    if (format) {
      Object.assign(out, generateCode(rec, format, {boilerplate}));
    }
    if (includeSteps) {
      out.stepList = rec.steps;
    }
    return out;
  }

  /**
   * Before the first action on an element found with a weak locator (or none), find a unique
   * locator for it in the page source with the Inspector's locator generation. Never throws and
   * never changes the command itself: only the recording uses the suggestion.
   * @param {any} driver
   * @param {string} cmdName
   * @param {any[]} args
   * @returns {Promise<void>}
   */
  async suggestLocators(driver, cmdName, args) {
    const rec = store.getOrCreate(driver.sessionId, driver.caps);
    const ids = rec.elementsToUpgrade(cmdName, args, needsUpgrade);
    if (!ids.length || typeof driver.getPageSource !== 'function') {
      return;
    }
    const automationName = driver.caps?.automationName;
    const getSource = async () => (this.sourceCache ??= await driver.getPageSource());
    for (const id of ids) {
      const started = Date.now();
      try {
        const suggested = await upgradeLocator(driver, id, automationName, getSource);
        rec.setSuggestedLocator(id, suggested);
        if (suggested) {
          this.log.debug(
            `Recorder suggests ${suggested.strategy} '${suggested.selector}' (${Date.now() - started} ms)`,
          );
        }
      } catch (err) {
        rec.setSuggestedLocator(id, null);
        this.log.warn(`Recorder could not suggest a locator: ${err.message}`);
      }
    }
  }

  /**
   * Saves the recording when the session ends without deleteSession (e.g. driver crash).
   * @param {any} driver - The session's driver
   * @returns {Promise<void>}
   */
  async onUnexpectedShutdown(driver) {
    if (this.recorder.enabled && driver?.sessionId) {
      await this.finishRecording(driver.sessionId);
    }
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async finishRecording(sessionId) {
    const rec = store.finish(sessionId);
    if (!rec?.steps.length) {
      return;
    }
    try {
      const dir = await rec.save(this.recorder.outputDir);
      this.log.info(`Recorded ${rec.steps.length} steps of session ${sessionId} to ${dir}`);
    } catch (err) {
      this.log.warn(`Recorder could not save session ${sessionId}: ${err.message}`);
    }
  }

  /**
   * Whether typed text should be masked. Never throws: unknown means not a password field.
   * @param {any} driver
   * @param {string} elementId
   * @returns {Promise<boolean>}
   */
  async isPasswordField(driver, elementId) {
    if (!elementId || typeof driver?.getAttribute !== 'function') {
      return false;
    }
    for (const [name, secretValue] of PASSWORD_ATTRIBUTES) {
      try {
        if (String(await driver.getAttribute(name, elementId)).toLowerCase() === secretValue) {
          return true;
        }
      } catch {
        // attribute not supported by this driver
      }
    }
    return false;
  }

  /**
   * Handles inspector page requests
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  static async openInspector(req, res) {
    const reqPath = req.path === PLUGIN_ROOT_PATH ? INDEX_HTML : req.path.substring(PLUGIN_ROOT_PATH.length);
    res.sendFile(reqPath, {root: ROOT_DIR});
  }

  /**
   * Recorded sessions API, used by the Inspector's Recorder tab
   * @param {import('express').Application} expressApp - Express application instance
   */
  static addRecordingRoutes(expressApp) {
    const {outputDir} = recorderSettings();
    const withRecording =
      (handler, {liveOnly = false} = {}) =>
      async (req, res) => {
        const {sessionId} = req.params;
        const rec = liveOnly ? store.get(sessionId) : await store.find(sessionId, outputDir);
        if (!rec) {
          res.status(404).json({error: `No recording for session ${sessionId}`});
          return;
        }
        await handler(rec, req, res);
      };
    const setPaused = (paused) =>
      withRecording(
        (rec, req, res) => {
          rec.paused = paused;
          res.json(rec.summary());
        },
        {liveOnly: true},
      );
    expressApp.get(RECORDINGS_API_PATH, async (req, res) => res.json(await store.listAll(outputDir)));
    expressApp.post(`${RECORDINGS_API_PATH}/:sessionId/start`, (req, res) => {
      const {sessionId} = req.params;
      if (!store.sessions.has(sessionId) && !store.get(sessionId)?.active) {
        res.status(404).json({error: `Session ${sessionId} has ended or does not exist on this server`});
        return;
      }
      try {
        const rec = store.start(sessionId);
        store.forgetSession(sessionId);
        res.json(rec.summary());
      } catch (err) {
        if (!(err instanceof RecordingFinishedError)) {
          throw err;
        }
        res.status(409).json({error: err.message});
      }
    });
    expressApp.post(
      `${RECORDINGS_API_PATH}/:sessionId/stop`,
      withRecording(
        async (rec, req, res) => {
          if (rec.active) {
            store.finish(rec.sessionId);
            store.noteSession(rec.sessionId, rec.caps);
            try {
              await rec.save(outputDir);
            } catch {
              // still stopped; savedTo stays empty
            }
          }
          res.json(rec.summary());
        },
        {liveOnly: true},
      ),
    );
    expressApp.post(`${RECORDINGS_API_PATH}/:sessionId/pause`, setPaused(true));
    expressApp.post(`${RECORDINGS_API_PATH}/:sessionId/resume`, setPaused(false));
    expressApp.get(
      `${RECORDINGS_API_PATH}/:sessionId`,
      withRecording((rec, req, res) => res.json(rec.toJSON())),
    );
    expressApp.get(
      `${RECORDINGS_API_PATH}/:sessionId/locators.md`,
      withRecording((rec, req, res) => res.type('text/markdown').send(rec.toLocatorsMarkdown())),
    );
    // delete a finished recording and its saved files (a running one must be stopped first)
    expressApp.delete(`${RECORDINGS_API_PATH}/:sessionId`, async (req, res) => {
      try {
        const result = await store.delete(req.params.sessionId, outputDir);
        if (!result) {
          res.status(404).json({error: `No recording for session ${req.params.sessionId}`});
          return;
        }
        res.json(result);
      } catch (err) {
        res.status(err instanceof RecordingActiveError ? 409 : 500).json({error: err.message});
      }
    });
  }

  /**
   * Updates the Express server configuration
   * @param {import('express').Application} expressApp - Express application instance
   * @returns {Promise<void>}
   */
  static async updateServer(expressApp) {
    // API routes first: the page route below matches every /inspector/* path
    AppiumInspectorPlugin.addRecordingRoutes(expressApp);
    // Handle both /inspector and /inspector/* paths
    expressApp.all(['/inspector', '/inspector/*all'], AppiumInspectorPlugin.openInspector);
  }
}
