import {Menu, app, dialog, shell} from 'electron';

import {languageList} from '../configs/app.config';
import i18n from '../configs/i18next.config';
import {checkNewUpdates} from './auto-updater';
import {APPIUM_SESSION_EXTENSION} from './helpers';
import {launchNewSessionWindow} from './windows';

let mainWindow, isMac, isDev;

const t = (string, params = null) => i18n.t(string, params);

const separator = {type: 'separator'};

const optionAbout = () => ({
  label: t('About Appium Inspector'),
  click: () => {
    dialog.showMessageBox({
      title: t('appiumInspector'),
      message: t('showAppInfo', {
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodejsVersion: process.versions.node,
      }),
    });
  },
});

const optionCheckForUpdates = () => ({
  label: isMac ? t('Check for Updates…') : '&' + t('Check for Updates…'),
  click: () => checkNewUpdates(true),
});

const optionHide = () => ({
  label: t('Hide Appium Inspector'),
  role: 'hide',
});

const optionHideOthers = () => ({
  label: t('Hide Others'),
  role: 'hideOthers',
});

const optionShowAll = () => ({
  label: t('Show All'),
  role: 'unhide',
});

const optionQuit = () => ({
  label: t('Quit Appium Inspector'),
  role: 'quit',
});

const optionNewWindow = () => ({
  label: t('New Window'),
  accelerator: 'CmdOrCtrl+N',
  click: launchNewSessionWindow,
});

const optionCloseWindow = () => ({
  label: isMac ? t('Close Window') : '&' + t('Close Window'),
  role: 'close',
});

const optionOpen = () => ({
  label: t('Open'),
  accelerator: 'CmdOrCtrl+O',
  click: async () => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]}],
    });
    if (!canceled) {
      const filePath = filePaths[0];
      mainWindow.webContents.send('open-file', filePath);
    }
  },
});

const optionSaveAs = () => ({
  label: t('saveAs'),
  accelerator: 'CmdOrCtrl+S',
  click: async () => {
    const {canceled, filePath} = await dialog.showSaveDialog({
      title: t('saveAs'),
      filters: [{name: 'Appium', extensions: [APPIUM_SESSION_EXTENSION]}],
    });
    if (!canceled) {
      mainWindow.webContents.send('save-file', filePath);
    }
  },
});

const optionUndo = () => ({
  label: t('Undo'),
  role: 'undo',
});

const optionRedo = () => ({
  label: t('Redo'),
  role: 'redo',
});

const optionCut = () => ({
  label: t('Cut'),
  role: 'cut',
});

const optionCopy = () => ({
  label: t('Copy'),
  role: 'copy',
});

const optionPaste = () => ({
  label: t('Paste'),
  role: 'paste',
});

const optionDelete = () => ({
  label: t('Delete'),
  role: 'delete',
});

const optionSelectAll = () => ({
  label: t('Select All'),
  role: 'selectAll',
});

const optionToggleFullscreen = () => ({
  label: isMac ? t('Toggle Full Screen') : t('Toggle &Full Screen'),
  role: 'togglefullscreen',
});

const optionResetZoom = () => ({
  label: t('Reset Zoom Level'),
  role: 'resetZoom',
});

const optionZoomIn = () => ({
  label: t('Zoom In'),
  role: 'zoomIn',
});

const optionZoomOut = () => ({
  label: t('Zoom Out'),
  role: 'zoomOut',
});

const optionLanguages = () => ({
  label: t('Languages'),
  submenu: languageList.map((language) => ({
    label: `${language.name} (${language.original})`,
    type: 'radio',
    checked: i18n.language === language.code,
    click: () => i18n.changeLanguage(language.code),
  })),
});

const optionReload = () => ({
  label: isMac ? t('Reload') : '&' + t('Reload'),
  role: 'reload',
});

const optionToggleDevTools = () => ({
  label: isMac ? t('Toggle Developer Tools') : t('Toggle &Developer Tools'),
  role: 'toggleDevTools',
});

const optionMinimize = () => ({
  label: t('Minimize'),
  role: 'minimize',
});

const optionZoom = () => ({
  label: t('Zoom'),
  role: 'zoom',
});

const optionBringAllToFront = () => ({
  label: t('Bring All to Front'),
  role: 'front',
});

const optionInspectorDocumentation = () => ({
  label: t('Inspector Documentation'),
  click: () => shell.openExternal('https://appium.github.io/appium-inspector'),
});

const optionAppiumDocumentation = () => ({
  label: t('Appium Documentation'),
  click: () => shell.openExternal('https://appium.io'),
});

const optionAppiumForum = () => ({
  label: t('Appium Discussion Forum'),
  click: () => shell.openExternal('https://discuss.appium.io'),
});

const optionReportIssues = () => ({
  label: t('Report Issues'),
  click: () => shell.openExternal('https://github.com/appium/appium-inspector/issues'),
});

const optionImproveTranslations = () => ({
  label: t('Improve Translations'),
  click: () => shell.openExternal('https://crowdin.com/project/appium-desktop'),
});

const dropdownApp = () => ({
  label: t('appiumInspector'),
  submenu: [
    optionAbout(),
    optionCheckForUpdates(),
    separator,
    optionHide(),
    optionHideOthers(),
    optionShowAll(),
    separator,
    optionQuit(),
  ],
});

const dropdownFile = () => {
  const submenu = [optionNewWindow(), optionCloseWindow(), separator, optionOpen(), optionSaveAs()];

  if (!isMac) {
    submenu.push(...[separator, optionAbout()]);
    // If it's Windows, add a 'Check for Updates' menu option
    if (process.platform === 'win32') {
      submenu.push(optionCheckForUpdates());
    }
  }

  return {
    label: isMac ? t('File') : '&' + t('File'),
    submenu,
  };
};

const dropdownEdit = () => ({
  label: t('Edit'),
  submenu: [
    optionUndo(),
    optionRedo(),
    separator,
    optionCut(),
    optionCopy(),
    optionPaste(),
    optionDelete(),
    optionSelectAll(),
  ],
});

const dropdownView = () => {
  const submenu = [
    optionToggleFullscreen(),
    optionResetZoom(),
    optionZoomIn(),
    optionZoomOut(),
    separator,
    optionLanguages(),
  ];

  if (isDev) {
    submenu.push(...[separator, optionReload(), optionToggleDevTools()]);
  }

  return {
    label: isMac ? t('View') : '&' + t('View'),
    submenu,
  };
};

const dropdownWindow = () => ({
  label: t('Window'),
  submenu: [optionMinimize(), optionZoom(), separator, optionBringAllToFront()],
});

const dropdownHelp = () => ({
  label: t('Help'),
  submenu: [
    optionInspectorDocumentation(),
    optionAppiumDocumentation(),
    optionAppiumForum(),
    separator,
    optionReportIssues(),
    optionImproveTranslations(),
  ],
});

const buildMenuTemplate = () => [
  ... isMac ? [dropdownApp()] : [],
  dropdownFile(),
  dropdownEdit(),
  dropdownView(),
  ... isMac ? [dropdownWindow()] : [],
  dropdownHelp(),
];

export function rebuildMenus(localMainWindow, localIsDev) {
  if (!localMainWindow) {
    return;
  }

  mainWindow = localMainWindow;
  isMac = process.platform === 'darwin';
  isDev = localIsDev;

  const menu = Menu.buildFromTemplate(buildMenuTemplate());

  if (isMac) {
    Menu.setApplicationMenu(menu);
  } else {
    mainWindow.setMenu(menu);
  }
}
