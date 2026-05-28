import {spawn} from 'node:child_process';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {dialog, ipcMain, nativeTheme, shell} from 'electron';
import settings from 'electron-settings';

import i18n from './i18next.js';

export const isDev = process.env.NODE_ENV === 'development';

// eslint-disable-next-line jsdoc/require-jsdoc
export function setupIPCListeners(getOpenFilePath) {
  ipcMain.handle('settings:has', async (_evt, key) => await settings.has(key));
  ipcMain.handle('settings:set', async (_evt, key, value) => await settings.set(key, value));
  ipcMain.handle('settings:get', async (_evt, key) => await settings.get(key));
  ipcMain.on('electron:openLink', (_evt, link) => shell.openExternal(link));
  ipcMain.on('electron:setTheme', (_evt, theme) => (nativeTheme.themeSource = theme));
  ipcMain.handle('sessionfile:loadIfOpened', async () => {
    const openFilePath = getOpenFilePath();
    if (!openFilePath) {
      return null;
    }
    return await readFile(openFilePath, 'utf8');
  });
  ipcMain.handle('testflow:exportPytestFile', async (_evt, payload) => await exportPytestFile(payload));
  ipcMain.handle('testflow:runPytestFile', async (evt, payload) => await runPytestFile(payload, (chunk) => {
    evt.sender.send('testflow:pytest-log', chunk);
  }));
}

async function exportPytestFile({code, suggestedName = 'test_recorded_flow.py'} = {}) {
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: suggestedName,
    filters: [{name: 'Python Files', extensions: ['py']}],
  });

  if (canceled || !filePath) {
    return {cancelled: true};
  }

  await writeFile(filePath, code || '', 'utf8');
  return {cancelled: false, filePath};
}

function buildPytestCommands(filePath) {
  if (process.platform === 'win32') {
    return [
      {command: 'py', args: ['-m', 'pytest', '-s', '-vv', filePath]},
      {command: 'python', args: ['-m', 'pytest', '-s', '-vv', filePath]},
    ];
  }

  return [
    {command: 'python3', args: ['-m', 'pytest', '-s', '-vv', filePath]},
    {command: 'python', args: ['-m', 'pytest', '-s', '-vv', filePath]},
  ];
}

async function spawnPytest(commands, cwd, onLog) {
  let lastFailure = null;

  for (const {command, args} of commands) {
    try {
      return await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          cwd,
          shell: false,
          windowsHide: true,
        });
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
          const text = chunk.toString();
          stdout += text;
          if (onLog) {
            onLog(text);
          }
        });

        child.stderr.on('data', (chunk) => {
          const text = chunk.toString();
          stderr += text;
          if (onLog) {
            onLog(text);
          }
        });

        child.on('error', (error) => {
          reject(error);
        });

        child.on('close', (exitCode, signal) => {
          resolve({command, args, exitCode, signal, stdout, stderr});
        });
      });
    } catch (error) {
      if (error?.code === 'ENOENT') {
        lastFailure = error;
        continue;
      }
      throw error;
    }
  }

  throw lastFailure || new Error('Unable to start a Python interpreter for pytest');
}

async function runPytestFile({code, suggestedName = 'test_recorded_flow.py'} = {}, onLog) {
  const tempDir = await mkdtemp(join(tmpdir(), 'appium-inspector-test-flow-'));
  const filePath = join(tempDir, suggestedName);
  await writeFile(filePath, code || '', 'utf8');

  try {
    const result = await spawnPytest(buildPytestCommands(filePath), tempDir, onLog);
    return {
      ok: result.exitCode === 0,
      command: `${result.command} ${result.args.join(' ')}`,
      exitCode: result.exitCode,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      filePath,
      tempDir,
    };
  } catch (error) {
    return {
      ok: false,
      command: null,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: error?.message || String(error),
      filePath,
      tempDir,
    };
  }
}

export const t = (string, params = null) => i18n.t(string, params);
