import {Menu, app, dialog, shell} from 'electron';

import {languageList} from '../configs/app.config';
import i18n from '../configs/i18next.config';
import {checkNewUpdates} from './auto-updater';
import {APPIUM_SESSION_EXTENSION} from './helpers';
import {launchNewSessionWindow} from './windows';

const INSPECTOR_DOCS_URL = 'https://appium.github.io/appium-inspector';
const APPIUM_DOCS_URL = 'https://appium.io';
const APPIUM_FORUM_URL = 'https://discuss.appium.io';
const GITHUB_ISSUES_URL = 'https://github.com/appium/appium-inspector/issues';
const CROWDIN_URL = 'https://crowdin.com/project/appium-desktop';

const t = (string, params = null) => i18n.t(string, params);

const separator = {type: 'separator'};

const showAppInfoPopup = () => {
  dialog.showMessageBox({
    title: t('appiumInspector'),
    message: t('showAppInfo', {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodejsVersion: process.versions.node,
    }),
  });
};

const openFile = async (mainWindow) => {
  const {canceled, filePaths} = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]}],
  });
  if (!canceled) {
    const filePath = filePaths[0];
    mainWindow.webContents.send('open-file', filePath);
  }
};

const saveAs = async (mainWindow) => {
  const {canceled, filePath} = await dialog.showSaveDialog({
    title: i18n.t('saveAs'),
    filters: [{name: 'Appium', extensions: [APPIUM_SESSION_EXTENSION]}],
  });
  if (!canceled) {
    mainWindow.webContents.send('save-file', filePath);
  }
};

const getLanguagesMenu = () =>
  languageList.map((language) => ({
    label: `${language.name} (${language.original})`,
    type: 'radio',
    checked: i18n.language === language.code,
    click: () => i18n.changeLanguage(language.code),
  }));

const optionAbout = () => ({
  label: t('About Appium Inspector'),
  click: () => showAppInfoPopup(),
});

const optionCheckForUpdates = () => ({
  label: t('Check for Updates…'),
  click: () => checkNewUpdates(true),
});

const dropdownApp = () => ({
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
});

const dropdownFile = (mainWindow, isMac) => {
  const submenu = [
    {label: t('New Window'), accelerator: 'CmdOrCtrl+N', click: launchNewSessionWindow},
    {label: t('Close Window'), role: 'close'},
    separator,
    {label: t('Open Session File…'), accelerator: 'CmdOrCtrl+O', click: () => openFile(mainWindow)},
    {label: t('saveAs'), accelerator: 'CmdOrCtrl+S', click: () => saveAs(mainWindow)},
  ];

  if (!isMac) {
    submenu.push(...[separator, optionAbout()]);
    // If it's Windows, add a 'Check for Updates' menu option
    if (process.platform === 'win32') {
      submenu.push(optionCheckForUpdates());
    }
  }

  return {
    label: t('File'),
    submenu,
  };
};

const dropdownEdit = () => ({
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
});

const dropdownView = (isDev) => {
  const submenu = [
    {label: t('Toggle Full Screen'), role: 'togglefullscreen'},
    {label: t('Reset Zoom Level'), role: 'resetZoom'},
    {label: t('Zoom In'), role: 'zoomIn'},
    {label: t('Zoom Out'), role: 'zoomOut'},
    separator,
    {label: t('Languages'), submenu: getLanguagesMenu()},
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
};

const dropdownWindow = () => ({
  label: t('Window'),
  submenu: [
    {label: t('Minimize'), role: 'minimize'},
    {label: t('Zoom'), role: 'zoom'},
    separator,
    {label: t('Bring All to Front'), role: 'front'},
  ],
});

const dropdownHelp = () => ({
  label: t('Help'),
  submenu: [
    {label: t('Inspector Documentation'), click: () => shell.openExternal(INSPECTOR_DOCS_URL)},
    {label: t('Appium Documentation'), click: () => shell.openExternal(APPIUM_DOCS_URL)},
    {label: t('Appium Discussion Forum'), click: () => shell.openExternal(APPIUM_FORUM_URL)},
    separator,
    {label: t('Report Issues'), click: () => shell.openExternal(GITHUB_ISSUES_URL)},
    {label: t('Improve Translations'), click: () => shell.openExternal(CROWDIN_URL)},
  ],
});

const menuTemplate = (mainWindow, isMac, isDev) => [
  ...(isMac ? [dropdownApp()] : []),
  dropdownFile(mainWindow, isMac),
  dropdownEdit(),
  dropdownView(isDev),
  ...(isMac ? [dropdownWindow()] : []),
  dropdownHelp(),
];

export function rebuildMenus(mainWindow, isDev) {
  const isMac = process.platform === 'darwin';

  const menu = Menu.buildFromTemplate(menuTemplate(mainWindow, isMac, isDev));

  if (isMac) {
    Menu.setApplicationMenu(menu);
  } else {
    mainWindow.setMenu(menu);
  }
}
