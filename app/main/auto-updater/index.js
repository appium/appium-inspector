/**
 * Auto Updater
 *
 * Similar to https://electronjs.org/docs/api/auto-updater#events
 * See https://electronjs.org/docs/tutorial/updates for documentation
 */
import { app, autoUpdater, dialog } from 'electron';
import request from 'request-promise';
import moment from 'moment';
import B from 'bluebird';
import semver from 'semver';
import { getFeedUrl } from './config';
import _ from 'lodash';
import env from '../../env';
import i18n from '../../configs/i18next.config';

const isDev = process.env.NODE_ENV === 'development';
const runningLocally = isDev || process.env.RUNNING_LOCALLY;

let checkNewUpdates = _.noop;

async function checkUpdate ({request, getFeedUrl, semver, currentVersion}) {
  try {
    // The response is like (macOS):
    // {  "name":"v1.15.0-1",
    //    "notes":"* Bump up Appium to v1.15.0",
    //    "pub_date":"2019-10-04T04:40:37Z",
    //    "url":"https://github.com/appium/appium-desktop/releases/download/v1.15.0-1/Appium-1.15.0-1-mac.zip"}
    const res = await request.get(getFeedUrl(currentVersion));
    if (res) {
      const j = JSON.parse(res);
      if (semver.lt(currentVersion, j.name)) {
        return j;
      }
    }
  } catch (ign) { }

  return false;
}

function setUpAutoUpdater ({
  request,
  getFeedUrl,
  semver,
  autoUpdater,
  app,
  moment,
  i18n,
  env,
  dialog,
  B
}) {
  autoUpdater.setFeedURL(getFeedUrl(app.getVersion()));

  /**
   * Check for new updates
   */
  const checkNewUpdates = async function (fromMenu) {
    // autoupdate.checkForUpdates always downloads updates immediately
    // This method (getUpdate) let's us take a peek to see if there is an update
    // available before calling .checkForUpdates
    if (process.env.RUNNING_IN_SPECTRON) {
      return;
    }
    const update = await checkUpdate({request, getFeedUrl, semver, currentVersion: app.getVersion()});
    if (update) {
      let {name, notes, pub_date: pubDate} = update;
      pubDate = moment(pubDate).format(i18n.t('datetimeFormat'));

      let detail = i18n.t('updateDetails', {pubDate, notes: notes.replace('*', '\n*')});
      if (env.NO_AUTO_UPDATE) {
        detail += `\n\nhttps://www.github.com/appium/appium-desktop/releases/latest`;
      }


      // Ask user if they wish to install now or later
      if (!process.env.RUNNING_IN_SPECTRON) {
        dialog.showMessageBox({
          type: 'info',
          buttons: env.NO_AUTO_UPDATE
            ? [i18n.t('OK')]
            : [i18n.t('Install Now'), i18n.t('Install Later')],
          message: i18n.t('appiumIsAvailable', {name}),
          detail,
        }, (response) => {
          if (response === 0) {
            // If they say yes, get the updates now
            if (!env.NO_AUTO_UPDATE) {
              autoUpdater.checkForUpdates();
            }
          }
        });
      }
    } else {
      if (fromMenu) {
        autoUpdater.emit('update-not-available');
      } else {
        // If no updates found check for updates every hour
        await B.delay(60 * 60 * 1000);
        checkNewUpdates();
      }
    }
  };

  // Inform user when the download is starting and that they'll be notified again when it is complete
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      buttons: [i18n.t('OK')],
      message: i18n.t('Update Download Started'),
      detail: i18n.t('updateIsBeingDownloaded'),
    });
  });

  // Handle the unusual case where we checked the updates endpoint, found an update
  // but then after calling 'checkForUpdates', nothing was there
  autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
      type: 'info',
      buttons: [i18n.t('OK')],
      message: i18n.t('No update available'),
      detail: i18n.t('Appium Desktop is up-to-date'),
    });
  });

  // When it's done, ask if user want to restart now or later
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    dialog.showMessageBox({
      type: 'info',
      buttons: [i18n.t('Restart Now'), i18n.t('Later')],
      message: i18n.t('Update Downloaded'),
      detail: i18n.t('updateIsDownloaded', {releaseName}),
    }, (response) => {
      // If they say yes, restart now
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Handle error case
  autoUpdater.on('error', (message) => {
    dialog.showMessageBox({
      type: 'error',
      message: i18n.t('Could not download update'),
      detail: i18n.t('updateDownloadFailed', {message}),
    });
  });

  return checkNewUpdates;
}

if (!runningLocally && !process.env.RUNNING_IN_SPECTRON) {
  // put autoupdater in try block so that it doesn't break if autoupdater doesn't work
  try {
    checkNewUpdates = setUpAutoUpdater({
      request,
      getFeedUrl,
      semver,
      autoUpdater,
      app,
      moment,
      i18n,
      env,
      dialog,
      B
    });
  } catch (e) {}
}

export { checkNewUpdates };
