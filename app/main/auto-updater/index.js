/**
 * Auto Updater
 *
 * Similar to https://electronjs.org/docs/api/auto-updater#events
 * See https://electronjs.org/docs/tutorial/updates for documentation
 */
import B from 'bluebird';
import {app, autoUpdater, dialog} from 'electron';
import _ from 'lodash';
import moment from 'moment';

import i18n from '../../configs/i18next.config';
import env from '../../env';
import {setUpAutoUpdater} from './update-checker';

const isDev = process.env.NODE_ENV === 'development';
const runningLocally = isDev || process.env.RUNNING_LOCALLY;

let checkNewUpdates = _.noop;

if (!runningLocally && !process.env.RUNNING_IN_SPECTRON) {
  // put autoupdater in try block so that it doesn't break if autoupdater doesn't work
  try {
    checkNewUpdates = setUpAutoUpdater({
      autoUpdater,
      app,
      moment,
      i18n,
      env,
      dialog,
      B,
    });
  } catch (e) {}
}

export {checkNewUpdates};
