import {describe, expect, it} from 'vitest';

import {getPytestTestFlowCode} from '../../app/common/renderer/lib/test-flow-recorder/pytest.js';

describe('test-flow-recorder/pytest.js', function () {
  it('should insert time.sleep between top-level steps when delay is enabled', function () {
    const code = getPytestTestFlowCode({
      steps: [
        {
          type: 'action',
          name: 'Tap login',
          action: 'tap',
          locator: {strategy: 'accessibility id', value: 'login-btn'},
        },
        {
          type: 'assertion',
          name: 'Verify welcome',
          assertion: 'exists',
          locator: {strategy: 'accessibility id', value: 'welcome-text'},
        },
      ],
      stepDelayMs: 750,
    });

    expect(code).toContain('import time');
    expect(code).toContain('# [Step 1] Tap login');
    expect(code).toContain('driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login-btn").click()');
    expect(code).toContain('time.sleep(0.75)');
    expect(code).toContain('# [Step 2] Verify welcome');
  });

  it('should insert time.sleep between branch child steps', function () {
    const code = getPytestTestFlowCode({
      steps: [
        {
          type: 'branch',
          name: 'Branch on modal',
          condition: {
            assertion: 'exists',
            locator: {strategy: 'accessibility id', value: 'modal'},
          },
          thenSteps: [
            {
              type: 'action',
              action: 'tap',
              locator: {strategy: 'accessibility id', value: 'confirm'},
            },
            {
              type: 'action',
              action: 'tap',
              locator: {strategy: 'accessibility id', value: 'continue'},
            },
          ],
          elseSteps: [{type: 'action', action: 'back'}],
        },
      ],
      stepDelayMs: 500,
    });

    expect(code).toContain('import time');
    expect(code).toContain('if driver.find_elements(AppiumBy.ACCESSIBILITY_ID, "modal"):');
    expect(code).toContain('time.sleep(0.5)');
    expect(code).toContain('driver.find_element(AppiumBy.ACCESSIBILITY_ID, "continue").click()');
  });

  it('should omit time import and sleeps when delay is disabled', function () {
    const code = getPytestTestFlowCode({
      steps: [
        {
          type: 'action',
          action: 'tap',
          locator: {strategy: 'accessibility id', value: 'only-step'},
        },
      ],
      stepDelayMs: 0,
    });

    expect(code).not.toContain('import time');
    expect(code).not.toContain('time.sleep(');
  });
});
