import {dialog} from 'electron';
import {autoUpdater} from 'electron-updater';

import {t} from './helpers';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

autoUpdater.on('error', (error) => {
  dialog.showErrorBox({
    title: t('Could not download update'),
    content: t('updateDownloadFailed', {message: error})
  });
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    type: 'info',
    buttons: [t('OK')],
    message: t('No update available'),
    detail: t('Appium Inspector is up-to-date'),
  });
});

autoUpdater.on('update-available', async ({version, releaseNotes}) => {
  const {response} = await dialog.showMessageBox({
    type: 'info',
    message: t('appiumIsAvailable', {name: version}),
    buttons: [t('Install Now'), t('Install Later')],
    detail: releaseNotes,
  });
  if (response === 0) {
    autoUpdater.downloadUpdate();
  }
});

autoUpdater.on('update-downloaded', async ({releaseName}) => {
  const {response} = await dialog.showMessageBox({
    type: 'info',
    buttons: [t('Restart Now'), t('Later')],
    message: t('Update Downloaded'),
    detail: t('updateIsDownloaded', {releaseName}),
  });
  if (response === 0) {
    autoUpdater.quitAndInstall();
  }
});

export function checkForUpdates() {
  autoUpdater.checkForUpdates();
}
