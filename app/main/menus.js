import {Menu, app, dialog, shell} from 'electron';

import {languageList} from '../configs/app.config';
import i18n from '../configs/i18next.config';
import {checkNewUpdates} from './auto-updater';
import {APPIUM_SESSION_EXTENSION} from './helpers';
import {launchNewSessionWindow} from './windows';

let menuTemplates = {mac: {}, other: {}};

function t(string, params = null) {
  return i18n.t(string, params);
}

function separator() {
  return {
    type: 'separator',
  };
}

function optionAbout() {
  return {
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
  };
}

function optionCheckForUpdates() {
  return {
    label: t('Check for updates'),
    click: () => checkNewUpdates(true),
  };
}

function optionCheckForUpdatesOther() {
  return {
    label: '&' + t('Check for updates'),
    click: () => checkNewUpdates(true),
  };
}

function optionHide() {
  return {
    label: t('Hide Appium Inspector'),
    role: 'hide',
  };
}

function optionHideOthers() {
  return {
    label: t('Hide Others'),
    role: 'hideOthers',
  };
}

function optionShowAll() {
  return {
    label: t('Show All'),
    role: 'unhide',
  };
}

function optionQuit() {
  return {
    label: t('Quit Appium Inspector'),
    role: 'quit',
  };
}

function optionNewWindow() {
  return {
    label: t('New Session Window…'),
    accelerator: 'CmdOrCtrl+N',
    click: launchNewSessionWindow,
  };
}

function optionOpen(mainWindow) {
  return {
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
  };
}

function optionSaveAs(mainWindow) {
  return {
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
  };
}

function optionUndo() {
  return {
    label: t('Undo'),
    role: 'undo',
  };
}

function optionRedo() {
  return {
    label: t('Redo'),
    role: 'redo',
  };
}

function optionCut() {
  return {
    label: t('Cut'),
    role: 'cut',
  };
}

function optionCopy() {
  return {
    label: t('Copy'),
    role: 'copy',
  };
}

function optionPaste() {
  return {
    label: t('Paste'),
    role: 'paste',
  };
}

function optionDelete() {
  return {
    label: t('Delete'),
    role: 'delete',
  };
}

function optionSelectAll() {
  return {
    label: t('Select All'),
    role: 'selectAll',
  };
}

function optionToggleFullscreen() {
  return {
    label: t('Toggle Full Screen'),
    role: 'togglefullscreen',
  };
}

function optionToggleFullscreenOther() {
  return {
    label: t('Toggle &Full Screen'),
    role: 'togglefullscreen',
  };
}

function optionResetZoom() {
  return {
    label: t('Reset Zoom Level'),
    role: 'resetZoom',
  };
}

function optionZoomIn() {
  return {
    label: t('Zoom In'),
    role: 'zoomIn',
  };
}

function optionZoomOut() {
  return {
    label: t('Zoom Out'),
    role: 'zoomOut',
  };
}

function optionLanguages() {
  return {
    label: t('Languages'),
    submenu: languageList.map((language) => ({
      label: `${language.name} (${language.original})`,
      type: 'radio',
      checked: i18n.language === language.code,
      click: () => i18n.changeLanguage(language.code),
    })),
  };
}

function optionReload() {
  return {
    label: t('Reload'),
    role: 'reload',
  };
}

function optionReloadOther() {
  return {
    label: '&' + t('Reload'),
    role: 'reload',
  };
}

function optionToggleDevTools() {
  return {
    label: t('Toggle Developer Tools'),
    role: 'toggleDevTools',
  };
}

function optionToggleDevToolsOther() {
  return {
    label: t('Toggle &Developer Tools'),
    role: 'toggleDevTools',
  };
}

function optionMinimize() {
  return {
    label: t('Minimize'),
    role: 'minimize',
  };
}

function optionZoom() {
  return {
    label: t('Zoom'),
    role: 'zoom',
  };
}

function optionCloseWindow() {
  return {
    label: t('Close Window'),
    role: 'close',
  };
}

function optionCloseWindowOther() {
  return {
    label: '&' + t('Close Window'),
    role: 'close',
  };
}

function optionBringAllToFront() {
  return {
    label: t('Bring All to Front'),
    role: 'front',
  };
}

function optionInspectorDocumentation() {
  return {
    label: t('Inspector Documentation'),
    click: () => shell.openExternal('https://github.com/appium/appium-inspector'),
  };
}

function optionAppiumDocumentation() {
  return {
    label: t('Appium Documentation'),
    click: () => shell.openExternal('https://appium.io'),
  };
}

function optionOpenIssues() {
  return {
    label: t('Search Issues'),
    click: () => shell.openExternal('https://github.com/appium/appium-inspector/issues'),
  };
}

function optionImproveTranslations() {
  return {
    label: t('Add Or Improve Translations'),
    click: () => shell.openExternal('https://crowdin.com/project/appium-desktop'),
  };
}

function dropdownMacApp() {
  return {
    label: t('appiumInspector'),
    submenu: [
      optionAbout(),
      optionCheckForUpdates(),
      separator(),
      optionHide(),
      optionHideOthers(),
      optionShowAll(),
      separator(),
      optionQuit(),
    ],
  };
}

function dropdownMacFile(mainWindow) {
  return {
    label: t('File'),
    submenu: [
      optionNewWindow(),
      optionCloseWindow(),
      separator(),
      optionOpen(mainWindow),
      optionSaveAs(mainWindow),
    ],
  };
}

function dropdownEdit() {
  return {
    label: t('Edit'),
    submenu: [
      optionUndo(),
      optionRedo(),
      separator(),
      optionCut(),
      optionCopy(),
      optionPaste(),
      optionDelete(),
      optionSelectAll(),
    ],
  };
}

function dropdownMacView(isDev) {
  const submenu = [
    optionToggleFullscreen(),
    optionResetZoom(),
    optionZoomIn(),
    optionZoomOut(),
    separator(),
    optionLanguages(),
  ];

  if (isDev) {
    submenu.push(...[
      separator(),
      optionReload(),
      optionToggleDevTools(),
    ]);
  }

  return {
    label: t('View'),
    submenu,
  };
}

function dropdownMacWindow() {
  return {
    label: t('Window'),
    submenu: [
      optionMinimize(),
      optionZoom(),
      separator(),
      optionBringAllToFront(),
    ],
  };
}

function dropdownMacHelp() {
  return {
    label: t('Help'),
    submenu: [
      optionInspectorDocumentation(),
      optionAppiumDocumentation(),
      optionOpenIssues(),
      optionImproveTranslations(),
    ],
  };
}

function dropdownOtherFile(mainWindow) {
  const submenu = [
    optionNewWindow(),
    optionCloseWindowOther(),
    separator(),
    optionOpen(mainWindow),
    optionSaveAs(mainWindow),
    separator(),
    optionAbout(),
  ];

  // If it's Windows, add a 'Check for Updates' menu option
  if (process.platform === 'win32') {
    submenu.push(optionCheckForUpdatesOther());
  }

  return {
    label: '&' + t('File'),
    submenu,
  };
}

function dropdownOtherView(isDev) {
  const submenu = [
    optionToggleFullscreenOther(),
    optionResetZoom(),
    optionZoomIn(),
    optionZoomOut(),
    separator(),
    optionLanguages(),
  ];

  if (isDev) {
    submenu.push(...[
      separator(),
      optionReloadOther(),
      optionToggleDevToolsOther(),
    ]);
  }

  return {
    label: '&' + t('View'),
    submenu,
  };
}

function dropdownOtherHelp() {
  // just the same as mac menus for now since we don't have any hotkeys for this menu
  return dropdownMacHelp();
}

menuTemplates.mac = (mainWindow, isDev) => [
  dropdownMacApp(),
  dropdownMacFile(mainWindow),
  dropdownEdit(),
  dropdownMacView(isDev),
  dropdownMacWindow(),
  dropdownMacHelp(),
];

menuTemplates.other = (mainWindow, isDev) => [
  dropdownOtherFile(mainWindow),
  dropdownEdit(),
  dropdownOtherView(isDev),
  dropdownOtherHelp(),
];

export function rebuildMenus(mainWindow, isDev) {
  if (!mainWindow) {
    return;
  }

  if (process.platform === 'darwin') {
    const template = menuTemplates.mac(mainWindow, isDev);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    const template = menuTemplates.other(mainWindow, isDev);
    const menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
}
