import axios from 'axios';
import semver from 'semver';

import {getFeedUrl} from './config';

export async function checkUpdate(currentVersion) {
  try {
    // The response is like (macOS):
    // {  "name":"v1.15.0-1",
    //    "notes":"* Bump up Appium to v1.15.0",
    //    "pub_date":"2019-10-04T04:40:37Z",
    //    "url":"https://github.com/appium/appium-desktop/releases/download/v1.15.0-1/Appium-1.15.0-1-mac.zip"}
    const res = await axios.get(getFeedUrl(currentVersion));
    if (res && semver.lt(currentVersion, res.name)) {
      return res;
    }
  } catch (ign) {}

  return false;
}

export function setUpAutoUpdater({autoUpdater, app, moment, i18n, env, dialog, B}) {
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
    const update = await checkUpdate(app.getVersion());
    if (update) {
      let {name, notes, pub_date: pubDate} = update;
      pubDate = moment(pubDate).format(i18n.t('datetimeFormat'));

      let detail = i18n.t('updateDetails', {pubDate, notes: notes.replace('*', '\n*')});
      if (env.NO_AUTO_UPDATE) {
        detail += `\n\nhttps://www.github.com/appium/appium-inspector/releases/latest`;
      }

      // Ask user if they wish to install now or later
      if (!process.env.RUNNING_IN_SPECTRON) {
        dialog.showMessageBox(
          {
            type: 'info',
            buttons: env.NO_AUTO_UPDATE
              ? [i18n.t('OK')]
              : [i18n.t('Install Now'), i18n.t('Install Later')],
            message: i18n.t('appiumIsAvailable', {name}),
            detail,
          },
          (response) => {
            if (response === 0) {
              // If they say yes, get the updates now
              if (!env.NO_AUTO_UPDATE) {
                autoUpdater.checkForUpdates();
              }
            }
          },
        );
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
      detail: i18n.t('Appium Inspector is up-to-date'),
    });
  });

  // When it's done, ask if user want to restart now or later
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    dialog.showMessageBox(
      {
        type: 'info',
        buttons: [i18n.t('Restart Now'), i18n.t('Later')],
        message: i18n.t('Update Downloaded'),
        detail: i18n.t('updateIsDownloaded', {releaseName}),
      },
      (response) => {
        // If they say yes, restart now
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      },
    );
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
