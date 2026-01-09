import {app, dialog, Menu, shell} from 'electron';

import {isDev, t} from './helpers.js';
import {checkForUpdates} from './updater.js';
import {launchNewSessionWindow} from './windows.js';

const INSPECTOR_DOCS_URL = 'https://appium.github.io/appium-inspector';
const APPIUM_DOCS_URL = 'https://appium.io';
const APPIUM_FORUM_URL = 'https://discuss.appium.io';
const GITHUB_ISSUES_URL = 'https://github.com/appium/appium-inspector/issues';
const CROWDIN_URL = 'https://crowdin.com/project/appium-desktop';

const separator = {type: 'separator'};

function showAppInfoPopup() {
  dialog.showMessageBox({
    title: t('appiumInspector'),
    message: t('showAppInfo', {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodejsVersion: process.versions.node,
    }),
  });
}

function optionAbout() {
  return {
    label: t('About Appium Inspector'),
    click: () => showAppInfoPopup(),
  };
}

function optionCheckForUpdates() {
  return {
    label: t('Check for Updates…'),
    click: () => checkForUpdates(),
  };
}

function dropdownApp() {
  return {
    label: t('appiumInspector'),
    submenu: [
      optionAbout(),
      optionCheckForUpdates(),
      separator,
      {label: t('Hide Appium Inspector'), role: 'hide'},
      {label: t('Hide Others'), role: 'hideOthers'},
      {label: t('Show All'), role: 'unhide'},
      separator,
      {label: t('Quit Appium Inspector'), role: 'quit'},
    ],
  };
}

function dropdownFile(isMac) {
  const submenu = [
    {label: t('New Window'), accelerator: 'CmdOrCtrl+N', click: launchNewSessionWindow},
    {label: t('Close Window'), role: 'close'},
  ];

  if (!isMac) {
    submenu.push(...[separator, optionAbout(), optionCheckForUpdates()]);
  }

  return {
    label: t('File'),
    submenu,
  };
}

function dropdownEdit() {
  return {
    label: t('Edit'),
    submenu: [
      {label: t('Undo'), role: 'undo'},
      {label: t('Redo'), role: 'redo'},
      separator,
      {label: t('Cut'), role: 'cut'},
      {label: t('Copy'), role: 'copy'},
      {label: t('Paste'), role: 'paste'},
      {label: t('Delete'), role: 'delete'},
      {label: t('Select All'), role: 'selectAll'},
    ],
  };
}

function dropdownView() {
  const submenu = [
    {label: t('Toggle Full Screen'), role: 'togglefullscreen'},
    {label: t('Reset Zoom Level'), role: 'resetZoom'},
    {label: t('Zoom In'), role: 'zoomIn'},
    {label: t('Zoom Out'), role: 'zoomOut'},
  ];

  if (isDev) {
    submenu.push(
      ...[
        separator,
        {label: t('Reload'), role: 'reload'},
        {label: t('Toggle Developer Tools'), role: 'toggleDevTools'},
      ],
    );
  }

  return {
    label: t('View'),
    submenu,
  };
}

function dropdownWindow() {
  return {
    label: t('Window'),
    submenu: [
      {label: t('Minimize'), role: 'minimize'},
      {label: t('Zoom'), role: 'zoom'},
      separator,
      {label: t('Bring All to Front'), role: 'front'},
    ],
  };
}

function dropdownHelp() {
  return {
    label: t('Help'),
    submenu: [
      {label: t('Inspector Documentation'), click: () => shell.openExternal(INSPECTOR_DOCS_URL)},
      {label: t('Appium Documentation'), click: () => shell.openExternal(APPIUM_DOCS_URL)},
      {label: t('Appium Discussion Forum'), click: () => shell.openExternal(APPIUM_FORUM_URL)},
      separator,
      {label: t('Report Issues'), click: () => shell.openExternal(GITHUB_ISSUES_URL)},
      {label: t('Improve Translations'), click: () => shell.openExternal(CROWDIN_URL)},
    ],
  };
}

function menuTemplate(isMac) {
  return [
    ...(isMac ? [dropdownApp()] : []),
    dropdownFile(isMac),
    dropdownEdit(),
    dropdownView(),
    ...(isMac ? [dropdownWindow()] : []),
    dropdownHelp(),
  ];
}

export function rebuildMenus(mainWindow) {
  const isMac = process.platform === 'darwin';

  const menu = Menu.buildFromTemplate(menuTemplate(isMac));

  if (isMac) {
    Menu.setApplicationMenu(menu);
  } else {
    mainWindow.setMenu(menu);
  }
}
