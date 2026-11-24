import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {REFRESH_DELAY_MILLIS} from '../../app/common/renderer/constants/session-inspector.js';
import InspectorDriver from '../../app/common/renderer/lib/appium/inspector-driver.js';

describe('InspectorDriver refresh order', function () {
  const source = '<hierarchy/>';
  const screenshot = 'screenshot';
  const windowSize = {x: 0, y: 0, width: 320, height: 640};
  let driver, inspector;

  beforeEach(function () {
    vi.useFakeTimers();
    driver = {
      client: {capabilities: {platformName: 'iOS'}},
      getPageSource: vi.fn().mockResolvedValue(source),
      takeScreenshot: vi.fn().mockResolvedValue(screenshot),
      getWindowRect: vi.fn().mockResolvedValue(windowSize),
    };
    inspector = new InspectorDriver(driver);
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it('requests the screenshot first and starts the source without waiting for the screenshot by default', async function () {
    const pendingScreenshot = Promise.withResolvers();
    driver.takeScreenshot.mockReturnValue(pendingScreenshot.promise);
    const refresh = inspector.run({methodName: 'getPageSource'});
    await vi.advanceTimersByTimeAsync(REFRESH_DELAY_MILLIS);

    expect(driver.takeScreenshot).toHaveBeenCalledBefore(driver.getPageSource);
    expect(driver.getPageSource).toHaveBeenCalledOnce();
    pendingScreenshot.resolve(screenshot);
    expect(await refresh).toEqual({source, screenshot, windowSize, commandRes: {}});
  });

  it('requests the source first and starts the screenshot and window requests while it is pending', async function () {
    const pendingSource = Promise.withResolvers();
    driver.getPageSource.mockReturnValue(pendingSource.promise);
    const refresh = inspector.run({methodName: 'getPageSource', preferSourceFirst: true});
    await vi.advanceTimersByTimeAsync(REFRESH_DELAY_MILLIS);

    expect(driver.getPageSource).toHaveBeenCalledBefore(driver.takeScreenshot);
    expect(driver.getWindowRect).toHaveBeenCalledOnce();
    expect(driver.takeScreenshot).toHaveBeenCalledOnce();
    pendingSource.resolve(source);
    expect(await refresh).toEqual({source, screenshot, windowSize, commandRes: {}});
    expect(driver.getPageSource).toHaveBeenCalledOnce();
  });

  it('starts the source before the window size when source-first mode skips screenshots', async function () {
    const pendingSource = Promise.withResolvers();
    driver.getPageSource.mockReturnValue(pendingSource.promise);
    const refresh = inspector.run({methodName: 'getPageSource', skipScreenshot: true, preferSourceFirst: true});
    await vi.advanceTimersByTimeAsync(REFRESH_DELAY_MILLIS);

    expect(driver.getPageSource).toHaveBeenCalledBefore(driver.getWindowRect);
    expect(driver.getPageSource).toHaveBeenCalledOnce();
    expect(driver.getWindowRect).toHaveBeenCalledOnce();
    pendingSource.resolve(source);
    expect(await refresh).toEqual({source, windowSize, commandRes: {}});
    expect(driver.takeScreenshot).not.toHaveBeenCalled();
  });

  it('still returns the screenshot if the source request reports an error in source-first mode', async function () {
    const sourceError = new Error('Page source unavailable');
    driver.getPageSource.mockRejectedValue(sourceError);
    const refresh = inspector.run({methodName: 'getPageSource', preferSourceFirst: true});
    await vi.advanceTimersByTimeAsync(REFRESH_DELAY_MILLIS);

    expect(await refresh).toEqual({sourceError, screenshot, windowSize, commandRes: {}});
    expect(driver.getPageSource).toHaveBeenCalledOnce();
  });
});
