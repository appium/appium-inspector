import { app, shell, dialog, Menu } from 'electron';
import fs from 'fs';
import { checkNewUpdates } from './auto-updater';
import config from '../configs/app.config';
import i18n from '../configs/i18next.config';
import { rebuildMenus as _rebuildMenus } from '../../gui-common/menus';

export function rebuildMenus (mainWindow, isInspector) {
  _rebuildMenus({mainWindow, config, Menu, dialog, i18n, app, checkNewUpdates, extraMacMenus: [], shell, fs, isInspector});
}
