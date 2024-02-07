import {Menu, app, dialog, shell} from 'electron';

import config from '../configs/app.config';
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
    label: t('About Appium'),
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
    click() {
      checkNewUpdates(true);
    },
  };
}

function optionHide() {
  return {
    label: t('Hide Appium'),
    accelerator: 'Command+H',
    selector: 'hide:',
  };
}

function optionHideOthers() {
  return {
    label: t('Hide Others'),
    accelerator: 'Command+Shift+H',
    selector: 'hideOtherApplications:',
  };
}

function optionShowAll() {
  return {
    label: t('Show All'),
    selector: 'unhideAllApplications:',
  };
}

function optionQuit() {
  return {
    label: t('Quit'),
    accelerator: 'Command+Q',
    click() {
      app.quit();
    },
  };
}

function optionNewWindow() {
  return {
    label: t('New Session Window…'),
    accelerator: 'Command+N',
    click: launchNewSessionWindow,
  };
}

function optionOpen(mainWindow) {
  return {
    label: t('Open'),
    accelerator: 'Command+O',
    click: () => openFileCallback(mainWindow),
  };
}

function optionSave(mainWindow) {
  return {
    label: t('Save'),
    accelerator: 'Command+S',
    click: () => mainWindow.webContents.send('save-file'),
  };
}

function optionSaveAs(mainWindow) {
  return {
    label: t('saveAs'),
    accelerator: 'Command+Shift+S',
    click: () => saveAsCallback(mainWindow),
  };
}

function optionUndo() {
  return {
    label: t('Undo'),
    accelerator: 'Command+Z',
    selector: 'undo:',
  };
}

function optionRedo() {
  return {
    label: t('Redo'),
    accelerator: 'Shift+Command+Z',
    selector: 'redo:',
  };
}

function optionCut() {
  return {
    label: t('Cut'),
    accelerator: 'Command+X',
    selector: 'cut:',
  };
}

function optionCopy() {
  return {
    label: t('Copy'),
    accelerator: 'Command+C',
    selector: 'copy:',
  };
}

function optionPaste() {
  return {
    label: t('Paste'),
    accelerator: 'Command+V',
    selector: 'paste:',
  };
}

function optionSelectAll() {
  return {
    label: t('Select All'),
    accelerator: 'Command+A',
    selector: 'selectAll:',
  };
}

function optionReload(mainWindow) {
  return {
    label: t('Reload'),
    accelerator: 'Command+R',
    click() {
      mainWindow.webContents.reload();
    },
  };
}

function optionToggleDevTools(mainWindow) {
  return {
    label: t('Toggle Developer Tools'),
    accelerator: 'Alt+Command+I',
    click() {
      mainWindow.toggleDevTools();
    },
  };
}

function optionToggleFullscreen(mainWindow) {
  return {
    label: t('Toggle Full Screen'),
    accelerator: 'Ctrl+Command+F',
    click() {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    },
  };
}

function optionLanguages() {
  return {
    label: t('Languages'),
    submenu: config.languages.map((languageCode) => ({
      label: t(languageCode),
      type: 'radio',
      checked: i18n.language === languageCode,
      click: () => i18n.changeLanguage(languageCode),
    })),
  };
}

function optionMinimize() {
  return {
    label: t('Minimize'),
    accelerator: 'Command+M',
    selector: 'performMiniaturize:',
  };
}

function optionClose() {
  return {
    label: t('Close'),
    accelerator: 'Command+W',
    selector: 'performClose:',
  };
}

function optionBringAllToFront() {
  return {
    label: t('Bring All to Front'),
    selector: 'arrangeInFront:',
  };
}

function optionInspectorDocumentation() {
  return {
    label: t('Inspector Documentation'),
    click() {
      shell.openExternal('https://github.com/appium/appium-inspector');
    },
  };
}

function optionAppiumDocumentation() {
  return {
    label: t('Appium Documentation'),
    click() {
      shell.openExternal('https://appium.io');
    },
  };
}

function optionOpenIssues() {
  return {
    label: t('Search Issues'),
    click() {
      shell.openExternal('https://github.com/appium/appium-inspector/issues');
    },
  };
}

function optionImproveTranslations() {
  return {
    label: t('Add Or Improve Translations'),
    click() {
      shell.openExternal('https://crowdin.com/project/appium-desktop');
    },
  };
}

function dropdownMacAppiumInspector() {
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
      optionOpen(mainWindow),
      optionSave(mainWindow),
      optionSaveAs(mainWindow),
    ],
  };
}

function dropdownMacEdit() {
  return {
    label: t('Edit'),
    submenu: [
      optionUndo(),
      optionRedo(),
      separator(),
      optionCut(),
      optionCopy(),
      optionPaste(),
      optionSelectAll(),
    ],
  };
}

function dropdownMacView(mainWindow) {
  const submenu = [];
  if (process.env.NODE_ENV === 'development') {
    submenu.push(optionReload(mainWindow));
    submenu.push(optionToggleDevTools(mainWindow));
  }
  submenu.push(optionToggleFullscreen(mainWindow));
  submenu.push(optionLanguages());

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
      optionClose(),
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


function languageMenu() {
  return config.languages.map((languageCode) => ({
    label: t(languageCode),
    type: 'radio',
    checked: i18n.language === languageCode,
    click: () => i18n.changeLanguage(languageCode),
  }));
}

function getShowAppInfoClickAction() {
  return () => {
    dialog.showMessageBox({
      title: t('appiumInspector'),
      message: t('showAppInfo', {
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodejsVersion: process.versions.node,
      }),
    });
  };
}

menuTemplates.mac = (mainWindow) => [
  dropdownMacAppiumInspector(),
  dropdownMacFile(mainWindow),
  dropdownMacEdit(),
  dropdownMacView(mainWindow),
  dropdownMacWindow(),
  dropdownMacHelp(),
];

async function openFileCallback(mainWindow) {
  const {canceled, filePaths} = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]}],
  });
  if (!canceled) {
    const filePath = filePaths[0];
    mainWindow.webContents.send('open-file', filePath);
  }
}

async function saveAsCallback(mainWindow) {
  const {canceled, filePath} = await dialog.showSaveDialog({
    title: t('saveAs'),
    filters: [{name: 'Appium', extensions: [APPIUM_SESSION_EXTENSION]}],
  });
  if (!canceled) {
    mainWindow.webContents.send('save-file', filePath);
  }
}

function otherMenuFile(mainWindow) {
  let fileSubmenu = [
    {
      label: t('New Session Window…'),
      accelerator: 'Ctrl+N',
      click: launchNewSessionWindow,
    },
    {
      label: t('Open'),
      accelerator: 'Ctrl+O',
      click: () => openFileCallback(mainWindow),
    },
    {
      label: t('Save'),
      accelerator: 'Ctrl+S',
      click: () => mainWindow.webContents.send('save-file'),
    },
    {
      label: t('saveAs'),
      accelerator: 'Ctrl+Shift+S',
      click: () => saveAsCallback(mainWindow),
    },
    {
      label: '&' + t('About Appium'),
      click: getShowAppInfoClickAction(),
    },
    {
      type: 'separator',
    },
    {
      label: '&' + t('Close'),
      accelerator: 'Ctrl+W',
      click() {
        mainWindow.close();
      },
    },
  ];

  // If it's Windows, add a 'Check for Updates' menu option
  if (process.platform === 'win32') {
    fileSubmenu.splice(1, 0, {
      label: '&' + t('Check for updates'),
      click() {
        checkNewUpdates(true);
      },
    });
  }

  return {
    label: '&' + t('File'),
    submenu: fileSubmenu,
  };
}

function otherMenuView(mainWindow) {
  const submenu = [];
  submenu.push({
    label: t('Toggle &Full Screen'),
    accelerator: 'F11',
    click() {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    },
  });

  submenu.push({
    label: t('Languages'),
    submenu: languageMenu(),
  });

  if (process.env.NODE_ENV === 'development') {
    submenu.push({
      label: '&' + t('Reload'),
      accelerator: 'Ctrl+R',
      click() {
        mainWindow.webContents.reload();
      },
    });
    submenu.push({
      label: t('Toggle &Developer Tools'),
      accelerator: 'Alt+Ctrl+I',
      click() {
        mainWindow.toggleDevTools();
      },
    });
  }

  return {
    label: '&' + t('View'),
    submenu,
  };
}

function otherMenuHelp() {
  // just the same as mac menus for now since we don't have any hotkeys for this menu
  return dropdownMacHelp();
}

menuTemplates.other = (mainWindow) => [
  otherMenuFile(mainWindow),
  otherMenuView(mainWindow),
  otherMenuHelp(),
];

export function rebuildMenus(mainWindow) {
  if (!mainWindow) {
    return;
  }

  if (config.platform === 'darwin') {
    const template = menuTemplates.mac(mainWindow);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    const template = menuTemplates.other(mainWindow);
    const menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
}
