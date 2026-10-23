import {describe, expect, it} from 'vitest';

import {shouldTerminateSession} from '../../app/common/renderer/embedded/session-ownership.js';

describe('embedded session ownership', function () {
  it('never terminates an externally owned session', function () {
    expect(shouldTerminateSession({isSessionExternallyOwned: true, detachOnly: false})).toBe(false);
  });

  it('preserves standalone quit behavior', function () {
    expect(shouldTerminateSession({isSessionExternallyOwned: false, detachOnly: false})).toBe(true);
    expect(shouldTerminateSession({isSessionExternallyOwned: false, detachOnly: true})).toBe(false);
  });
});
