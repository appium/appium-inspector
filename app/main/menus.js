import { app, shell, dialog, Menu } from 'electron';
import fs from 'fs';
import { checkNewUpdates } from './auto-updater';
import { launchNewSessionWindow } from '../main';
import config from '../configs/app.config';
import i18n from '../configs/i18next.config';
import { rebuildMenus as _rebuildMenus } from '../../gui-common/menus';
const extraMacFileMenus = [{
  index: 0,
  menu: {
    label: i18n.t('New Session Window…'),
    click: launchNewSessionWindow,
    accelerator: 'Command+N',
  },
}];

const extraFileMenus = [{
  index: 0,
  menu: {
    label: i18n.t('&New Session Window…'),
    click: launchNewSessionWindow,
    accelerator: 'Ctrl+N',
  },
}];

export function rebuildMenus (mainWindow, shouldShowFileMenu) {
  _rebuildMenus({
    mainWindow,
    config,
    Menu,
    dialog,
    i18n,
    app,
    checkNewUpdates,
    extraMacFileMenus,
    extraFileMenus,
    extraMacMenus: [],
    shell,
    fs,
    shouldShowFileMenu
  });
}
