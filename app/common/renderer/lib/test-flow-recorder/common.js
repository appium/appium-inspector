export const DEFAULT_TEST_FLOW_STEP_DELAY_MS = 500;
export const MAX_TEST_FLOW_STEP_DELAY_MS = 60000;

export function normalizeTestFlowStepDelayMs(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_TEST_FLOW_STEP_DELAY_MS;
  }

  return Math.min(Math.max(Math.round(numericValue), 0), MAX_TEST_FLOW_STEP_DELAY_MS);
}
