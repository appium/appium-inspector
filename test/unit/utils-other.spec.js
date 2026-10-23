import {afterEach, describe, expect, it, vi} from 'vitest';

import {
  addVendorPrefixes,
  CLIPBOARD_COPY_STATUS,
  copyToClipboardSafely,
} from '../../app/common/renderer/utils/other.js';

afterEach(function () {
  vi.unstubAllGlobals();
});

describe('utils/other.js', function () {
  describe('#copyToClipboardSafely', function () {
    it('reports success only after writing the exact text', async function () {
      let finishWrite;
      const writeText = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finishWrite = resolve;
          }),
      );
      vi.stubGlobal('navigator', {clipboard: {writeText}});

      const copyResult = copyToClipboardSafely('//*[@text="Log in"]');
      let copySettled = false;
      copyResult.then(() => {
        copySettled = true;
      });
      await Promise.resolve();

      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText).toHaveBeenCalledWith('//*[@text="Log in"]');
      expect(copySettled).toBe(false);

      finishWrite();
      const result = await copyResult;
      expect(result).toEqual({status: CLIPBOARD_COPY_STATUS.SUCCESS});
    });

    it('reports the clipboard rejection as a failure', async function () {
      const error = new DOMException('Write permission denied', 'NotAllowedError');
      vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(error)}});

      await expect(copyToClipboardSafely('selector')).resolves.toEqual({
        status: CLIPBOARD_COPY_STATUS.FAILURE,
        error,
      });
    });

    it('reports when the Clipboard API is unavailable', async function () {
      vi.stubGlobal('navigator', {});

      const result = await copyToClipboardSafely('selector');

      expect(result.status).toBe(CLIPBOARD_COPY_STATUS.UNAVAILABLE);
      expect(result.error).toEqual(expect.objectContaining({message: 'Clipboard API is unavailable'}));
    });
  });

  describe('#addVendorPrefixes', function () {
    it('should convert unprefixed non-standard caps to use appium prefix', function () {
      const caps = [{name: 'udid'}, {name: 'deviceName'}];
      expect(addVendorPrefixes(caps)).toEqual([{name: 'appium:udid'}, {name: 'appium:deviceName'}]);
    });

    it('should not convert already-prefixed or standard caps', function () {
      const caps = [{name: 'udid'}, {name: 'browserName'}, {name: 'goog:chromeOptions'}];
      expect(addVendorPrefixes(caps)).toEqual([
        {name: 'appium:udid'},
        {name: 'browserName'},
        {name: 'goog:chromeOptions'},
      ]);
    });
  });
});
