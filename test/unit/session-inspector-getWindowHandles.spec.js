import {describe, expect, it, vi} from 'vitest';

import {getWindowHandles} from '../../app/common/renderer/actions/SessionInspector.js';
import InspectorDriver from '../../app/common/renderer/lib/appium/inspector-driver.js';

vi.mock('../../app/common/renderer/lib/appium/inspector-driver.js', () => ({
  default: {instance: vi.fn()},
}));
vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {debug: vi.fn(), error: vi.fn(), info: vi.fn()},
}));
vi.mock('i18next', () => ({
  default: {isInitialized: true, use: vi.fn().mockReturnThis(), init: vi.fn()},
}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  setSetting: vi.fn(),
  getSetting: vi.fn(),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  localesPath: '',
  loadSessionFileIfOpened: vi.fn(),
}));

describe('Window handle suggestions action', () => {
  it('returns handles without recording, refreshing the source, or setting global loading', async () => {
    const driver = {};
    const dispatch = vi.fn();
    const run = vi.fn().mockResolvedValue({commandRes: ['window-1', '123']});
    InspectorDriver.instance.mockReturnValue({run});

    const result = await getWindowHandles()(dispatch, () => ({inspector: {driver, isRecording: true}}));

    expect(result).toEqual(['window-1', '123']);
    expect(InspectorDriver.instance).toHaveBeenCalledWith(driver);
    expect(run).toHaveBeenCalledWith({methodName: 'getWindowHandles', skipRefresh: true});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('lets the parameter modal handle a failed lookup without dispatching side effects', async () => {
    const dispatch = vi.fn();
    InspectorDriver.instance.mockReturnValue({run: vi.fn().mockRejectedValue(new Error('Not supported'))});

    await expect(getWindowHandles()(dispatch, () => ({inspector: {driver: {}}}))).rejects.toThrow('Not supported');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
