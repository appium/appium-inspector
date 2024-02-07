import {Menu, app, dialog, shell} from 'electron';

import {languageList} from '../configs/app.config';
import i18n from '../configs/i18next.config';
import {checkNewUpdates} from './auto-updater';
import {APPIUM_SESSION_EXTENSION} from './helpers';
import {launchNewSessionWindow} from './windows';

let mainWindow, isMac, isDev;

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
    label: isMac ? t('Check for Updates…') : '&' + t('Check for Updates…'),
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
    label: t('New Window'),
    accelerator: 'CmdOrCtrl+N',
    click: launchNewSessionWindow,
  };
}

function optionCloseWindow() {
  return {
    label: isMac ? t('Close Window') : '&' + t('Close Window'),
    role: 'close',
  };
}

function optionOpen() {
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

function optionSaveAs() {
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
    label: isMac ? t('Toggle Full Screen') : t('Toggle &Full Screen'),
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
    label: isMac ? t('Reload') : '&' + t('Reload'),
    role: 'reload',
  };
}

function optionToggleDevTools() {
  return {
    label: isMac ? t('Toggle Developer Tools') : t('Toggle &Developer Tools'),
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

function optionBringAllToFront() {
  return {
    label: t('Bring All to Front'),
    role: 'front',
  };
}

function optionInspectorDocumentation() {
  return {
    label: t('Inspector Documentation'),
    click: () => shell.openExternal('https://appium.github.io/appium-inspector'),
  };
}

function optionAppiumDocumentation() {
  return {
    label: t('Appium Documentation'),
    click: () => shell.openExternal('https://appium.io'),
  };
}

function optionAppiumForum() {
  return {
    label: t('Appium Discussion Forum'),
    click: () => shell.openExternal('https://discuss.appium.io'),
  };
}

function optionReportIssues() {
  return {
    label: t('Report Issues'),
    click: () => shell.openExternal('https://github.com/appium/appium-inspector/issues'),
  };
}

function optionImproveTranslations() {
  return {
    label: t('Improve Translations'),
    click: () => shell.openExternal('https://crowdin.com/project/appium-desktop'),
  };
}

function dropdownApp() {
  if (!isMac) {
    return; // macOS only
  }
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

function dropdownFile() {
  const submenu = [
    optionNewWindow(),
    optionCloseWindow(),
    separator(),
    optionOpen(),
    optionSaveAs(),
  ];

  if (!isMac) {
    submenu.push(...[separator(), optionAbout()]);
    // If it's Windows, add a 'Check for Updates' menu option
    if (process.platform === 'win32') {
      submenu.push(optionCheckForUpdates());
    }
  }

  return {
    label: isMac ? t('File') : '&' + t('File'),
    submenu,
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

function dropdownView() {
  const submenu = [
    optionToggleFullscreen(),
    optionResetZoom(),
    optionZoomIn(),
    optionZoomOut(),
    separator(),
    optionLanguages(),
  ];

  if (isDev) {
    submenu.push(...[separator(), optionReload(), optionToggleDevTools()]);
  }

  return {
    label: isMac ? t('View') : '&' + t('View'),
    submenu,
  };
}

function dropdownWindow() {
  if (!isMac) {
    return; // macOS only
  }
  return {
    label: t('Window'),
    submenu: [optionMinimize(), optionZoom(), separator(), optionBringAllToFront()],
  };
}

function dropdownHelp() {
  return {
    label: t('Help'),
    submenu: [
      optionInspectorDocumentation(),
      optionAppiumDocumentation(),
      optionAppiumForum(),
      separator(),
      optionReportIssues(),
      optionImproveTranslations(),
    ],
  };
}

function buildMenuTemplate() {
  return [
    dropdownApp(),
    dropdownFile(),
    dropdownEdit(),
    dropdownView(),
    dropdownWindow(),
    dropdownHelp(),
  ];
};

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
