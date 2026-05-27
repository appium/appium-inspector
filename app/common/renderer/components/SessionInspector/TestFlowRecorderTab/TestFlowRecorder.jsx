import {
  IconCode,
  IconCopy,
  IconDeviceFloppy,
  IconEraser,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  InputNumber,
  List,
  Modal,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Refractor} from 'react-refractor';

import {BUTTON} from '../../../constants/antd-types.js';
import {TEST_FLOW_EXPORT_FORMATS} from '../../../constants/session-inspector.js';
import {DEFAULT_TEST_FLOW_STEP_DELAY_MS} from '../../../lib/test-flow-recorder/common.js';
import {getPytestTestFlowCode} from '../../../lib/test-flow-recorder/pytest.js';
import {copyToClipboard} from '../../../utils/other.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './TestFlowRecorder.module.css';

const DEFAULT_PYTEST_FILENAME = 'test_recorded_flow.py';
const TEST_FLOW_DRAFT_KEY = 'draft';

const STEP_TAG_COLORS = {
  action: 'blue',
  assertion: 'gold',
  branch: 'purple',
};

const ASSERTION_OPTIONS = [
  {value: 'exists', labelKey: 'Element exists'},
  {value: 'visible', labelKey: 'Element visible'},
  {value: 'enabled', labelKey: 'Element enabled'},
  {value: 'disabled', labelKey: 'Element disabled'},
  {value: 'textEquals', labelKey: 'Text equals'},
  {value: 'attributeEquals', labelKey: 'Attribute equals'},
];

const BRANCH_CONDITION_OPTIONS = [
  {value: 'exists', labelKey: 'Element exists'},
  {value: 'visible', labelKey: 'Element visible'},
];

const SCROLL_DIRECTION_OPTIONS = [
  {value: 'down', labelKey: 'Scroll down'},
  {value: 'up', labelKey: 'Scroll up'},
  {value: 'left', labelKey: 'Scroll left'},
  {value: 'right', labelKey: 'Scroll right'},
];

const getSelectedElementLabel = (selectedElement, t) => {
  if (!selectedElement) {
    return t('No element selected');
  }

  const attributes = selectedElement.attributes || {};
  return (
    attributes['content-desc'] ||
    attributes.label ||
    attributes.name ||
    attributes.text ||
    attributes.value ||
    attributes['resource-id'] ||
    selectedElement.tagName ||
    t('Unnamed Element')
  );
};

const getSelectedElementLocator = (selectedElement) => {
  const [strategy, value] = selectedElement?.strategyMap?.[0] || [];
  if (!strategy || !value) {
    return null;
  }
  return {strategy, value};
};

const getStepLocator = (step) => step?.locator || step?.condition?.locator || null;

const moveStep = (steps, fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= steps.length) {
    return steps;
  }

  const reorderedSteps = [...steps];
  const [movedStep] = reorderedSteps.splice(fromIndex, 1);
  if (!movedStep) {
    return steps;
  }
  reorderedSteps.splice(toIndex, 0, movedStep);
  return reorderedSteps;
};

const getRunStatus = ({isRunning, exitCode}, t) => {
  if (isRunning) {
    return {color: 'processing', label: t('Running')};
  }
  if (exitCode === 0) {
    return {color: 'success', label: t('Passed')};
  }
  if (exitCode !== null && exitCode !== undefined) {
    return {color: 'error', label: t('Failed')};
  }
  return {color: 'default', label: t('Ready')};
};

const formatRunTimestamp = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toLocaleString();
};

const getRunHistoryLabel = (run, t) => {
  if (!run) {
    return '';
  }

  const modeLabel = run.mode === 'currentSession' ? t('Current Session') : t('Pytest');
  const statusLabel =
    run.status === 'running'
      ? t('Running')
      : run.exitCode === 0
        ? t('Passed')
        : run.exitCode !== null && run.exitCode !== undefined
          ? t('Failed')
          : t('Ready');
  const startedAtLabel = formatRunTimestamp(run.startedAt);

  return [modeLabel, statusLabel, startedAtLabel].filter(Boolean).join(' | ');
};

const parseSuccessOutput = (output, t) => {
  if (!output) {
    return t('Test execution passed successfully.');
  }

  // Find the pytest summary line (e.g. 1 passed, 3 warnings in 10.74s)
  const passedMatch = /={5,}\s*([\d\s\w,]+passed.*?)\s*={5,}/.exec(output);
  if (passedMatch) {
    return passedMatch[1].trim();
  }

  return t('Test execution passed successfully.');
};

const parseFailureOutput = (output, codeLines, steps, t) => {
  if (!output) {
    return null;
  }

  // Find the failing line number in the test file
  const lineMatch = /test_recorded_flow\.py:(\d+):/.exec(output);
  if (!lineMatch) {
    return null;
  }

  const failingLineNum = parseInt(lineMatch[1], 10);
  if (isNaN(failingLineNum) || failingLineNum < 1 || failingLineNum > codeLines.length) {
    return null;
  }

  // Scan upwards to find the step annotation comment: # [Step X]
  let stepIndex = null;
  let stepName = null;

  for (let i = failingLineNum - 1; i >= 0; i--) {
    const line = codeLines[i];
    const stepCommentMatch = /#\s*\[Step\s+(\d+)\]\s*(.*)/.exec(line);
    if (stepCommentMatch) {
      stepIndex = parseInt(stepCommentMatch[1], 10);
      stepName = stepCommentMatch[2].trim();
      break;
    }
  }

  // Extract error lines (lines starting with "E       ")
  const errorLines = [];
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.startsWith('E       ')) {
      errorLines.push(line.substring(8).trim());
    }
  }

  let errorReason = errorLines.join('\n') || t('Unknown error occurred during test execution.');

  // Make common errors more friendly
  if (errorReason.includes('NoSuchElementException')) {
    errorReason = t(
      'Element not found on the page. Check if the element was loaded or if the locator is incorrect.',
    );
  } else if (errorReason.includes('AssertionError')) {
    const assertMatch = /AssertionError:\s*(.*)/.exec(errorReason);
    if (assertMatch) {
      errorReason = `${t('Assertion Failed')}: ${assertMatch[1]}`;
    } else {
      errorReason = t('Assertion Failed: The expected condition was not met.');
    }
  }

  const failedStepLabel =
    stepIndex !== null
      ? `${t('Step')} ${stepIndex}: ${stepName || steps[stepIndex - 1]?.name || steps[stepIndex - 1]?.type || t('Step')}`
      : t('Setup/Teardown phase');

  return {
    failedStepLabel,
    errorReason,
    failingLineNum,
    stepIndex,
  };
};

const getCurrentSessionFailureSummary = (result, steps, t) => {
  if (!result || result.ok || !result.failedStepIndex) {
    return null;
  }

  return {
    failedStepLabel: `${t('Step')} ${result.failedStepIndex}: ${result.failedStepName || steps[result.failedStepIndex - 1]?.name || t('Step')}`,
    errorReason: result.errorReason || t('Unknown error occurred during test execution.'),
    stepIndex: result.failedStepIndex,
  };
};

const TestFlowRecorder = (props) => {
  const {
    appendTestFlowActionStep,
    appendTestFlowAssertionStep,
    appendTestFlowBranchStep,
    applyClientMethod,
    clearTestFlow,
    clearTestFlowPytestOutput,
    elementInteractionsNotAvailable,
    exportTestFlowPytestFile,
    isExportingTestFlowPytest,
    isRunningTestFlowCurrentSession,
    isRunningTestFlowPytest,
    isTestFlowRecording,
    pauseTestFlowRecording,
    recordedTestFlowSteps,
    removeTestFlowStep,
    reorderTestFlowSteps,
    runTestFlowCurrentSession,
    runTestFlowPytest,
    selectElementByLocator,
    selectedElement,
    selectedElementId,
    selectedElementSearchInProgress,
    serverDetails,
    sessionCaps,
    setTestFlowExportFormat,
    setTestFlowStepDelayMs,
    startTestFlowRecording,
    testFlowExportFilePath,
    testFlowExportFormat,
    testFlowStepDelayMs,
    testFlowRunHistoryByFlowKey = {},
    updateTestFlowStep,
    savedTestFlows = [],
    currentTestFlowId = null,
    getSavedTestFlows,
    saveTestFlow,
    deleteTestFlow,
    loadTestFlow,
    createNewTestFlow,
  } = props;
  const {t} = useTranslation();
  const [inputText, setInputText] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState('code'); // 'code' | 'logs'
  const [localTheme, setLocalTheme] = useState('dark'); // 'dark' | 'light'
  const terminalRef = useRef(null);
  const [showResultSummary, setShowResultSummary] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [flowNameInput, setFlowNameInput] = useState('');
  const [expandedStepId, setExpandedStepId] = useState(null);
  const [selectedLogRunId, setSelectedLogRunId] = useState(null);

  const toggleExpandStep = (id) => {
    setExpandedStepId((prevId) => (prevId === id ? null : id));
  };

  useEffect(() => {
    getSavedTestFlows();
  }, [getSavedTestFlows]);

  const currentFlow = savedTestFlows?.find((f) => f.id === currentTestFlowId);
  const currentFlowKey = currentTestFlowId || TEST_FLOW_DRAFT_KEY;
  const currentFlowName = currentFlow?.name || t('Draft Flow');
  const flowRunHistory = testFlowRunHistoryByFlowKey[currentFlowKey] || [];
  const activeRunRecord =
    flowRunHistory.find((run) => run.id === selectedLogRunId) || flowRunHistory[0] || null;

  useEffect(() => {
    if (!flowRunHistory.length) {
      setSelectedLogRunId(null);
      return;
    }

    if (
      !selectedLogRunId ||
      !flowRunHistory.some((run) => run.id === selectedLogRunId) ||
      flowRunHistory[0]?.status === 'running'
    ) {
      setSelectedLogRunId(flowRunHistory[0].id);
    }
  }, [flowRunHistory, selectedLogRunId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = activeRunRecord?.status === 'running' ? 999999 : 0;
    }
  }, [activeRunRecord?.id, activeRunRecord?.output, activeRunRecord?.status, showResultSummary]);

  const hasStepChanges = currentTestFlowId
    ? JSON.stringify(currentFlow?.steps || []) !== JSON.stringify(recordedTestFlowSteps)
    : recordedTestFlowSteps.length > 0;
  const hasDelayChanges = currentTestFlowId
    ? (currentFlow?.stepDelayMs ?? DEFAULT_TEST_FLOW_STEP_DELAY_MS) !== testFlowStepDelayMs
    : testFlowStepDelayMs !== DEFAULT_TEST_FLOW_STEP_DELAY_MS;
  const isDirty = hasStepChanges || hasDelayChanges;

  const handleSave = () => {
    if (currentTestFlowId && currentFlow) {
      saveTestFlow(currentFlow.name, recordedTestFlowSteps, currentTestFlowId, testFlowStepDelayMs);
    } else {
      setFlowNameInput('');
      setSaveModalOpen(true);
    }
  };

  const handleSaveConfirm = () => {
    if (!flowNameInput.trim()) {
      Modal.error({
        title: t('Flow name is required'),
      });
      return;
    }
    saveTestFlow(
      flowNameInput.trim(),
      recordedTestFlowSteps,
      currentTestFlowId,
      testFlowStepDelayMs,
    );
    setSaveModalOpen(false);
  };

  const handleSaveAs = () => {
    setFlowNameInput(currentFlow ? `${currentFlow.name} (Copy)` : '');
    setSaveModalOpen(true);
  };

  const handleDelete = () => {
    if (!currentTestFlowId) {
      return;
    }
    Modal.confirm({
      title: t('Are you sure you want to delete this flow?'),
      onOk() {
        deleteTestFlow(currentTestFlowId);
      },
    });
  };

  const handleNewFlow = () => {
    if (isDirty) {
      Modal.confirm({
        title: t('Unsaved changes will be lost. Do you want to proceed?'),
        onOk() {
          createNewTestFlow();
        },
      });
    } else {
      createNewTestFlow();
    }
  };

  const handleFlowSelect = (val) => {
    const activeValue = currentTestFlowId || 'draft';
    if (val === activeValue) {
      return;
    }
    if (isDirty) {
      Modal.confirm({
        title: t('Unsaved changes will be lost. Do you want to proceed?'),
        onOk() {
          if (val === 'draft') {
            createNewTestFlow();
          } else {
            loadTestFlow(val);
          }
        },
      });
    } else {
      if (val === 'draft') {
        createNewTestFlow();
      } else {
        loadTestFlow(val);
      }
    }
  };

  // Reset failure summary visibility when a new run begins
  // This state is reset directly in the button's onClick handler below to avoid synchronous useEffect re-renders.

  const stepCounts = recordedTestFlowSteps.reduce(
    (acc, step) => {
      if (step.type === 'assertion') {
        acc.assertion += 1;
      } else if (step.type === 'branch') {
        acc.branch += 1;
      } else {
        acc.action += 1;
      }
      return acc;
    },
    {action: 0, assertion: 0, branch: 0},
  );

  const selectedElementLabel = getSelectedElementLabel(selectedElement, t);
  const selectedElementLocator = getSelectedElementLocator(selectedElement);
  const hasSelectedElement = !!selectedElementLocator;
  const deviceInteractionDisabled =
    !(elementInteractionsNotAvailable || selectedElementId) || selectedElementSearchInProgress;
  const isRunningAnyTestFlow = isRunningTestFlowCurrentSession || isRunningTestFlowPytest;
  const activeRunMode = activeRunRecord?.mode || null;
  const activeRunExitCode = activeRunRecord?.exitCode;
  const activeRunOutput = activeRunRecord?.output || '';
  const activeRunSteps = activeRunRecord?.steps || [];
  const activeRunCodeLines = (activeRunRecord?.code || '').split('\n');
  const activeRunError = activeRunRecord?.error || null;
  const logMetadataItems = [
    {
      key: 'flow',
      label: t('Flow'),
      value: activeRunRecord?.flowName || currentFlowName,
    },
    {
      key: 'mode',
      label: t('Mode'),
      value:
        activeRunMode === 'currentSession'
          ? t('Current Session')
          : activeRunMode === 'pytest'
            ? t('Pytest')
            : null,
    },
    {
      key: 'startedAt',
      label: t('Started'),
      value: formatRunTimestamp(activeRunRecord?.startedAt),
    },
    {
      key: 'file',
      label: t('Last Run File'),
      value: activeRunRecord?.filePath || null,
    },
    {
      key: 'export',
      label: t('Last Export Path'),
      value: testFlowExportFilePath,
    },
    {
      key: 'command',
      label: t('Command'),
      value: activeRunRecord?.command || null,
    },
  ].filter(({value}) => Boolean(value));
  const runStatus = getRunStatus(
    {isRunning: activeRunRecord?.status === 'running', exitCode: activeRunExitCode},
    t,
  );
  const runHistoryOptions = flowRunHistory.map((run) => ({
    value: run.id,
    label: getRunHistoryLabel(run, t),
  }));

  const pytestCode = getPytestTestFlowCode({
    serverUrl: serverDetails?.serverUrl,
    sessionCaps,
    steps: recordedTestFlowSteps,
    stepDelayMs: testFlowStepDelayMs,
  });
  const codeLines = pytestCode.split('\n');

  const failureSummary =
    showResultSummary && activeRunMode === 'currentSession'
      ? getCurrentSessionFailureSummary(activeRunRecord?.result, activeRunSteps, t)
      : showResultSummary &&
          activeRunMode === 'pytest' &&
          activeRunExitCode !== 0 &&
          activeRunExitCode !== null &&
          activeRunExitCode !== undefined
        ? parseFailureOutput(
            activeRunOutput || activeRunError,
            activeRunCodeLines,
            activeRunSteps,
            t,
          )
        : null;

  const successSummary =
    showResultSummary && activeRunMode === 'currentSession'
      ? activeRunRecord?.result?.ok
        ? t('Current session run completed successfully.')
        : null
      : showResultSummary && activeRunMode === 'pytest' && activeRunExitCode === 0
        ? parseSuccessOutput(activeRunOutput, t)
        : null;

  const updateStep = (stepId, updates) => updateTestFlowStep(stepId, updates);

  const addActionStep = () => {
    appendTestFlowActionStep({
      name: t('Tap selected element'),
      action: 'tap',
      locator: selectedElementLocator,
    });
  };

  const addInputStep = () => {
    appendTestFlowActionStep({
      name: t('Type into selected input'),
      action: 'sendKeys',
      locator: selectedElementLocator,
      value: inputText || t('Sample input text'),
    });
    setInputText('');
  };

  const tapOnDevice = () => {
    if (isTestFlowRecording && selectedElementLocator) {
      appendTestFlowActionStep({
        name: t('Tap selected element'),
        action: 'tap',
        locator: selectedElementLocator,
      });
    }

    applyClientMethod({
      methodName: 'elementClick',
      elementId: selectedElementId,
      skipRecord: isTestFlowRecording,
    });
  };

  const typeOnDevice = () => {
    if (isTestFlowRecording && selectedElementLocator) {
      appendTestFlowActionStep({
        name: t('Type into selected input'),
        action: 'sendKeys',
        locator: selectedElementLocator,
        value: inputText || '',
      });
    }

    applyClientMethod({
      methodName: 'elementSendKeys',
      elementId: selectedElementId,
      args: [inputText || ''],
      skipRecord: isTestFlowRecording,
    });
    setInputText('');
  };

  const focusStepElement = async (step) => {
    const locator = getStepLocator(step);
    if (!locator?.strategy || !locator?.value) {
      return;
    }

    await selectElementByLocator(locator.strategy, locator.value);
  };

  const handleStepRowClick = (step) => {
    toggleExpandStep(step.id);
    focusStepElement(step);
  };

  const addAssertionStep = () => {
    appendTestFlowAssertionStep({
      name: t('Assert selected element is visible'),
      assertion: 'visible',
      locator: selectedElementLocator,
    });
  };

  const addBranchStep = () => {
    appendTestFlowBranchStep({
      name: t('If selected element is visible'),
      condition: {
        assertion: 'visible',
        locator: selectedElementLocator,
      },
      thenSteps: [{type: 'action', action: 'custom', name: 'Then branch'}],
      elseSteps: [{type: 'action', action: 'custom', name: 'Else branch'}],
    });
  };

  const addScrollStep = (direction) => {
    appendTestFlowActionStep({
      name: t(direction === 'down' ? 'Scroll down' : 'Scroll up'),
      action: 'scrollViewport',
      direction,
    });
  };

  const renderStepEditor = (step) => {
    if (step.type === 'action') {
      return (
        <div className={styles.stepEditor}>
          <div className={styles.editorGrid}>
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Step Name')}</div>
              <Input
                value={step.name || ''}
                size="small"
                onChange={(e) => updateStep(step.id, {name: e.target.value})}
              />
            </div>
            {step.action === 'scrollViewport' && (
              <div className={styles.editorBlock}>
                <div className={styles.editorLabel}>{t('Scroll direction')}</div>
                <Select
                  value={step.direction || 'down'}
                  size="small"
                  onChange={(direction) => updateStep(step.id, {direction})}
                  options={SCROLL_DIRECTION_OPTIONS.map(({value, labelKey}) => ({
                    value,
                    label: t(labelKey),
                  }))}
                />
              </div>
            )}
          </div>
          {step.action === 'sendKeys' && (
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Input Value')}</div>
              <Input
                value={step.value || ''}
                size="small"
                onChange={(e) => updateStep(step.id, {value: e.target.value})}
                placeholder={t('Value to type into selected input')}
              />
            </div>
          )}
        </div>
      );
    }

    if (step.type === 'assertion') {
      return (
        <div className={styles.stepEditor}>
          <div className={styles.editorGrid}>
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Step Name')}</div>
              <Input
                value={step.name || ''}
                size="small"
                onChange={(e) => updateStep(step.id, {name: e.target.value})}
              />
            </div>
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Assertion Type')}</div>
              <Select
                value={step.assertion || 'exists'}
                size="small"
                onChange={(assertion) => updateStep(step.id, {assertion})}
                options={ASSERTION_OPTIONS.map(({value, labelKey}) => ({
                  value,
                  label: t(labelKey),
                }))}
              />
            </div>
          </div>
          {step.assertion === 'textEquals' && (
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Expected text')}</div>
              <Input
                value={step.expectedText || ''}
                size="small"
                onChange={(e) => updateStep(step.id, {expectedText: e.target.value})}
              />
            </div>
          )}
          {step.assertion === 'attributeEquals' && (
            <div className={styles.editorGrid}>
              <div className={styles.editorBlock}>
                <div className={styles.editorLabel}>{t('Attribute name')}</div>
                <Input
                  value={step.attributeName || ''}
                  size="small"
                  onChange={(e) => updateStep(step.id, {attributeName: e.target.value})}
                />
              </div>
              <div className={styles.editorBlock}>
                <div className={styles.editorLabel}>{t('Expected value')}</div>
                <Input
                  value={step.expectedValue || ''}
                  size="small"
                  onChange={(e) => updateStep(step.id, {expectedValue: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step.type === 'branch') {
      return (
        <div className={styles.stepEditor}>
          <div className={styles.editorGrid}>
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Step Name')}</div>
              <Input
                value={step.name || ''}
                size="small"
                onChange={(e) => updateStep(step.id, {name: e.target.value})}
              />
            </div>
            <div className={styles.editorBlock}>
              <div className={styles.editorLabel}>{t('Branch condition type')}</div>
              <Select
                value={step.condition?.assertion || 'exists'}
                size="small"
                onChange={(assertion) =>
                  updateStep(step.id, {
                    condition: {
                      ...step.condition,
                      assertion,
                    },
                  })
                }
                options={BRANCH_CONDITION_OPTIONS.map(({value, labelKey}) => ({
                  value,
                  label: t(labelKey),
                }))}
              />
            </div>
          </div>
          <div className={styles.branchSummary}>
            <Tag size="small">
              {t('Then steps')}: {step.thenSteps?.length || 0}
            </Tag>
            <Tag size="small">
              {t('Else steps')}: {step.elseSteps?.length || 0}
            </Tag>
          </div>
        </div>
      );
    }

    return null;
  };

  const actionBar = (
    <Space size="middle" wrap>
      <Tooltip
        title={t(isTestFlowRecording ? 'Pause Test Flow Recording' : 'Start Test Flow Recording')}
      >
        <Button
          icon={isTestFlowRecording ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
          type={isTestFlowRecording ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          danger={isTestFlowRecording}
          onClick={isTestFlowRecording ? pauseTestFlowRecording : startTestFlowRecording}
        />
      </Tooltip>
      <Tooltip title={t('Clear Test Flow')}>
        <Button
          icon={<IconEraser size={18} />}
          onClick={clearTestFlow}
          disabled={!recordedTestFlowSteps.length}
        />
      </Tooltip>
      <Select
        value={testFlowExportFormat}
        onChange={setTestFlowExportFormat}
        className={inspectorStyles.frameworkDropdown}
        options={[
          {
            value: TEST_FLOW_EXPORT_FORMATS.PYTEST,
            label: t('Pytest'),
          },
        ]}
      />
    </Space>
  );

  return (
    <Card
      title={
        <Flex gap={4} align="center">
          <IconCode size={18} />
          {t('Test Flow Recorder*')}
        </Flex>
      }
      className={`${inspectorStyles.interactionTabCard} ${styles.testFlowCard}`}
      extra={actionBar}
    >
      <div className={styles.recorderShell}>
        {/* 2-Column Workspace Grid */}
        <div className={styles.workspaceGrid}>
          {/* LEFT COLUMN: Test Flow Recording and Steps */}
          <div className={styles.leftColumn}>
            {/* Saved Flows Manager */}
            <div className={styles.flowsPanelSingleRow}>
              <span className={styles.flowLabel}>
                {t('Flow')}
                {isDirty && (
                  <span className={styles.dirtyDotCompact} title={t('Unsaved changes')} />
                )}
                :
              </span>
              <Select
                value={currentTestFlowId || 'draft'}
                onChange={handleFlowSelect}
                className={styles.flowSelect}
                size="small"
                options={[
                  {
                    value: 'draft',
                    label: t('Draft Flow') + (isDirty && !currentTestFlowId ? ' *' : ''),
                  },
                  ...(savedTestFlows || []).map((flow) => ({
                    value: flow.id,
                    label: flow.name + (isDirty && currentTestFlowId === flow.id ? ' *' : ''),
                  })),
                ]}
              />
              <div className={styles.flowButtons}>
                <Tooltip title={t('Save Flow')}>
                  <Button
                    size="small"
                    icon={<IconDeviceFloppy size={14} />}
                    onClick={handleSave}
                    disabled={!isDirty}
                  />
                </Tooltip>
                <Tooltip title={t('Save Flow As')}>
                  <Button
                    size="small"
                    icon={<IconCopy size={14} />}
                    onClick={handleSaveAs}
                    disabled={!recordedTestFlowSteps.length}
                  />
                </Tooltip>
                <Tooltip title={t('Delete Flow')}>
                  <Button
                    size="small"
                    icon={<IconTrash size={14} />}
                    onClick={handleDelete}
                    disabled={!currentTestFlowId}
                    danger
                  />
                </Tooltip>
                <Tooltip title={t('New Flow')}>
                  <Button size="small" icon={<IconPlus size={14} />} onClick={handleNewFlow} />
                </Tooltip>
              </div>
            </div>

            {/* Selected Element Section */}
            <div className={styles.elementPanel}>
              <div className={styles.panelHeader}>
                <div className={styles.sectionTitle}>{t('Selected Element')}</div>
                <Tag
                  color={hasSelectedElement ? 'blue' : 'default'}
                  className={styles.elementNameTag}
                >
                  {selectedElementLabel}
                </Tag>
              </div>

              {selectedElementLocator ? (
                <div className={styles.elementDetails}>
                  <div className={styles.locatorCode}>
                    <code>{selectedElementLocator.strategy}</code>
                    <span className={styles.metaArrow}> {'->'} </span>
                    <code>{selectedElementLocator.value}</code>
                  </div>

                  {/* Actions Grid */}
                  <div className={styles.actionGrid}>
                    <Button
                      type={BUTTON.PRIMARY}
                      size="small"
                      onClick={tapOnDevice}
                      disabled={deviceInteractionDisabled}
                      className={styles.actionBtn}
                    >
                      {t('Tap on Device')}
                    </Button>
                    <Button size="small" onClick={addActionStep} className={styles.actionBtn}>
                      {t('+ Tap Step')}
                    </Button>
                    <Button size="small" onClick={addAssertionStep} className={styles.actionBtn}>
                      {t('+ Assert Step')}
                    </Button>
                    <Button size="small" onClick={addBranchStep} className={styles.actionBtn}>
                      {t('+ Branch Step')}
                    </Button>
                  </div>

                  <div className={styles.inputActionRow}>
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={t('Type text...')}
                      disabled={deviceInteractionDisabled}
                      size="small"
                      className={styles.typeInput}
                    />
                    <Space size={4}>
                      <Button
                        size="small"
                        onClick={typeOnDevice}
                        disabled={deviceInteractionDisabled || !inputText.trim()}
                      >
                        {t('Type')}
                      </Button>
                      <Button size="small" type={BUTTON.PRIMARY} onClick={addInputStep}>
                        {t('+ Step')}
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
                <div className={styles.noElementPlaceholder}>
                  {t('Select an element in screenshot or source tree to add steps')}
                </div>
              )}

              {/* Scroll controls */}
              <div className={styles.scrollActionsRow}>
                <span className={styles.scrollLabel}>{t('Viewport Scroll')}:</span>
                <Space size={6}>
                  <Button size="small" onClick={() => addScrollStep('down')}>
                    {t('Scroll Down')}
                  </Button>
                  <Button size="small" onClick={() => addScrollStep('up')}>
                    {t('Scroll Up')}
                  </Button>
                </Space>
              </div>
            </div>

            {/* Steps List Section */}
            <div className={styles.stepsPanel}>
              <div className={styles.panelHeader}>
                <div className={styles.sectionTitle}>
                  {t('Recorded Steps')}
                  <span className={styles.recordingStatusBadge}>
                    <span
                      className={`${styles.statusDot} ${isTestFlowRecording ? styles.recordingDot : ''}`}
                    />
                    <span className={styles.statusText}>
                      {isTestFlowRecording ? t('Recording') : t('Idle')}
                    </span>
                  </span>
                </div>
                <Space size={4}>
                  <Tag color="blue" className={styles.compactTag}>
                    {t('Actions')}: {stepCounts.action}
                  </Tag>
                  <Tag color="gold" className={styles.compactTag}>
                    {t('Assertions')}: {stepCounts.assertion}
                  </Tag>
                  <Tag color="purple" className={styles.compactTag}>
                    {t('Branches')}: {stepCounts.branch}
                  </Tag>
                </Space>
              </div>

              <div className={styles.stepsListWrapper}>
                {!recordedTestFlowSteps.length ? (
                  <div className={styles.emptyStepsPlaceholder}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t(
                        'No steps recorded yet. Interact with the app or click Quick Add buttons above.',
                      )}
                    />
                  </div>
                ) : (
                  <List
                    className={styles.stepList}
                    dataSource={recordedTestFlowSteps}
                    renderItem={(step, index) => (
                      <List.Item
                        className={`${styles.stepItem} ${expandedStepId === step.id ? styles.stepItemExpanded : ''}`}
                      >
                        <div
                          className={styles.stepHeaderRow}
                          onClick={() => handleStepRowClick(step)}
                        >
                          <span className={styles.expandCaret}>
                            {expandedStepId === step.id ? '▾' : '▸'}
                          </span>
                          <span className={styles.stepIndexBadge}>{index + 1}</span>
                          <span className={styles.stepNameText}>
                            {step.name || `${t('Recorded Step')} ${index + 1}`}
                          </span>
                          <div className={styles.stepActionsContainer}>
                            <Tag
                              color={STEP_TAG_COLORS[step.type] || 'default'}
                              className={styles.stepTypeTag}
                            >
                              {t(step.type)}
                            </Tag>
                            <div className={styles.hoverActions}>
                              <Space size={2}>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<span>↑</span>}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderTestFlowSteps(
                                      moveStep(recordedTestFlowSteps, index, index - 1),
                                    );
                                  }}
                                  disabled={index === 0}
                                  className={styles.compactArrowBtn}
                                />
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<span>↓</span>}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderTestFlowSteps(
                                      moveStep(recordedTestFlowSteps, index, index + 1),
                                    );
                                  }}
                                  disabled={index === recordedTestFlowSteps.length - 1}
                                  className={styles.compactArrowBtn}
                                />
                                <Button
                                  size="small"
                                  type="text"
                                  danger
                                  icon={<IconTrash size={12} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTestFlowStep(step.id);
                                  }}
                                  className={styles.compactDeleteBtn}
                                />
                              </Space>
                            </div>
                          </div>
                        </div>

                        {/* Step Details & Editor - visible only when expanded */}
                        {expandedStepId === step.id && (
                          <div
                            className={styles.expandedContent}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {step.locator?.value && (
                              <div className={styles.stepDetailMeta}>
                                <span className={styles.metaLabel}>{t('Locator')}:</span>{' '}
                                <code>
                                  {step.locator.strategy} = {step.locator.value}
                                </code>
                              </div>
                            )}
                            {step.value !== undefined && (
                              <div className={styles.stepDetailMeta}>
                                <span className={styles.metaLabel}>{t('Value')}:</span>{' '}
                                <code>{JSON.stringify(step.value)}</code>
                              </div>
                            )}
                            {step.condition?.locator?.value && (
                              <div className={styles.stepDetailMeta}>
                                <span className={styles.metaLabel}>{t('Condition')}:</span>{' '}
                                <code>
                                  {step.condition.locator.strategy} = {step.condition.locator.value}
                                </code>
                              </div>
                            )}

                            {renderStepEditor(step)}
                          </div>
                        )}
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Code View and Runner */}
          <div className={styles.rightColumn}>
            {/* Runner Control Card */}
            <div className={styles.runnerPanel}>
              <div className={styles.runnerHeader}>
                <div className={styles.sectionTitle}>
                  {t('Execution')}
                  <Tag color={runStatus.color} className={styles.runnerStatusTag}>
                    {runStatus.label}
                  </Tag>
                </div>
                <Space size={6}>
                  <Tooltip title={t('Run in Current Session')}>
                    <Button
                      type={BUTTON.PRIMARY}
                      size="small"
                      onClick={() => {
                        setRightPanelTab('logs');
                        setShowResultSummary(true);
                        runTestFlowCurrentSession({
                          flowId: currentTestFlowId,
                          flowName: currentFlowName,
                          steps: recordedTestFlowSteps,
                          stepDelayMs: testFlowStepDelayMs,
                        });
                      }}
                      disabled={!recordedTestFlowSteps.length || isRunningAnyTestFlow}
                    >
                      {t('Run')}
                    </Button>
                  </Tooltip>
                  <Button
                    size="small"
                    onClick={() => {
                      setRightPanelTab('logs');
                      setShowResultSummary(true);
                      runTestFlowPytest({
                        flowId: currentTestFlowId,
                        flowName: currentFlowName,
                        steps: recordedTestFlowSteps,
                        stepDelayMs: testFlowStepDelayMs,
                        code: pytestCode,
                        suggestedName: DEFAULT_PYTEST_FILENAME,
                      });
                    }}
                    disabled={!recordedTestFlowSteps.length || isRunningAnyTestFlow}
                  >
                    {t('Run Pytest')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => exportTestFlowPytestFile(pytestCode, DEFAULT_PYTEST_FILENAME)}
                    disabled={!recordedTestFlowSteps.length || isExportingTestFlowPytest}
                  >
                    {t('Export')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(pytestCode)}
                    disabled={!recordedTestFlowSteps.length}
                  >
                    {t('Copy')}
                  </Button>
                  {rightPanelTab === 'logs' && (
                    <Button
                      size="small"
                      onClick={() => clearTestFlowPytestOutput(currentFlowKey)}
                      disabled={!flowRunHistory.length}
                    >
                      {t('Clear logs')}
                    </Button>
                  )}
                </Space>
              </div>

              <div className={styles.runnerSettingsRow}>
                <div className={styles.delaySettingBlock}>
                  <div className={styles.delaySettingLabel}>{t('Delay between steps')}</div>
                  <InputNumber
                    min={0}
                    max={60000}
                    step={100}
                    precision={0}
                    size="small"
                    value={testFlowStepDelayMs}
                    onChange={(value) => setTestFlowStepDelayMs(value ?? 0)}
                    addonAfter="ms"
                    className={styles.delayInput}
                  />
                </div>
                <div className={styles.delaySettingHint}>{t('0 disables extra waiting')}</div>
              </div>

              {/* Segmented Selector for output */}
              <div className={styles.outputSelectorRow}>
                <Flex justify="space-between" align="center" gap={8}>
                  <Segmented
                    options={[
                      {label: t('Generated Code'), value: 'code'},
                      {label: t('Execution Log'), value: 'logs'},
                    ]}
                    value={rightPanelTab}
                    onChange={setRightPanelTab}
                    className={styles.tabSwitcher}
                  />
                  <Segmented
                    options={[
                      {label: t('Light'), value: 'light'},
                      {label: t('Dark'), value: 'dark'},
                    ]}
                    value={localTheme}
                    onChange={setLocalTheme}
                    size="small"
                    className={styles.localThemeSwitcher}
                  />
                  {rightPanelTab === 'logs' && flowRunHistory.length > 0 && (
                    <Select
                      value={activeRunRecord?.id}
                      onChange={setSelectedLogRunId}
                      size="small"
                      options={runHistoryOptions}
                      className={styles.runHistorySelect}
                    />
                  )}
                </Flex>
              </div>
            </div>

            {/* Code/Logs Output Display */}
            <div className={styles.outputDisplayPanel}>
              {rightPanelTab === 'code' ? (
                <div
                  className={`${styles.codeWrapper} ${localTheme === 'dark' ? styles.codeWrapperDark : styles.codeWrapperLight}`}
                >
                  <div className={styles.codeContainer}>
                    <pre className={styles.gutter}>
                      {codeLines.map((_, index) => `${index + 1}\n`).join('')}
                    </pre>
                    <Refractor
                      language="python"
                      value={pytestCode}
                      className={styles.codePreview}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles.logsWrapper} ${localTheme === 'dark' ? styles.logsWrapperDark : styles.logsWrapperLight}`}
                >
                  <div className={styles.terminalContainer}>
                    <div ref={terminalRef} className={styles.terminalScrollArea}>
                      {logMetadataItems.length > 0 && (
                        <div className={styles.logMetadataStrip}>
                          {logMetadataItems.map(({key, label, value}) => (
                            <div key={key} className={styles.logMetadataChip}>
                              <span className={styles.logMetadataLabel}>{label}:</span>
                              <span className={styles.logMetadataValue}>{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {failureSummary && (
                        <div className={styles.failureSummaryBox}>
                          <Alert
                            message={t('Execution Failed')}
                            description={
                              <div>
                                <div style={{marginBottom: 8}}>
                                  <strong>{t('Reason')}:</strong> {failureSummary.errorReason}
                                </div>
                                <div className={styles.alertStepsList}>
                                  <strong>{t('Step Execution Status')}:</strong>
                                  <div
                                    style={{
                                      marginTop: 6,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                    }}
                                  >
                                    {activeRunSteps.map((step, index) => {
                                      const stepNum = index + 1;
                                      let statusIcon = <span style={{color: '#1890ff'}}>○</span>; // not executed
                                      let statusText = t('Not executed');
                                      let textColor = 'rgba(0, 0, 0, 0.45)';

                                      if (failureSummary.stepIndex !== null) {
                                        if (stepNum < failureSummary.stepIndex) {
                                          statusIcon = (
                                            <span style={{color: '#52c41a', fontWeight: 'bold'}}>
                                              ✓
                                            </span>
                                          );
                                          statusText = t('Passed');
                                          textColor = 'inherit';
                                        } else if (stepNum === failureSummary.stepIndex) {
                                          statusIcon = (
                                            <span style={{color: '#f5222d', fontWeight: 'bold'}}>
                                              ✗
                                            </span>
                                          );
                                          statusText = t('Failed');
                                          textColor = '#f5222d';
                                        }
                                      }

                                      return (
                                        <div
                                          key={step.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: '11px',
                                            color: textColor,
                                          }}
                                        >
                                          {statusIcon}
                                          <span style={{opacity: 0.85}}>
                                            {t('Step')} {stepNum}:
                                          </span>
                                          <span
                                            style={{
                                              fontWeight:
                                                stepNum === failureSummary.stepIndex
                                                  ? 'bold'
                                                  : 'normal',
                                            }}
                                          >
                                            {step.name || step.type}
                                          </span>
                                          <span style={{fontSize: '10px', opacity: 0.65}}>
                                            ({statusText})
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            }
                            type="error"
                            showIcon
                            closable
                            onClose={() => setShowResultSummary(false)}
                          />
                        </div>
                      )}
                      {successSummary && (
                        <div className={styles.failureSummaryBox}>
                          <Alert
                            message={t('Execution Passed')}
                            description={
                              <div>
                                <div style={{marginBottom: 8}}>
                                  <strong>{t('Summary')}:</strong> {successSummary}
                                </div>
                                <div className={styles.alertStepsList}>
                                  <strong>{t('Executed Steps')}:</strong>
                                  <div
                                    style={{
                                      marginTop: 6,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                    }}
                                  >
                                    {activeRunSteps.map((step, index) => (
                                      <div
                                        key={step.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          fontSize: '11px',
                                        }}
                                      >
                                        <span style={{color: '#52c41a', fontWeight: 'bold'}}>
                                          ✓
                                        </span>
                                        <span style={{color: 'rgba(0, 0, 0, 0.45)'}}>
                                          {t('Step')} {index + 1}:
                                        </span>
                                        <span>{step.name || step.type}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            }
                            type="success"
                            showIcon
                            closable
                            onClose={() => setShowResultSummary(false)}
                          />
                        </div>
                      )}
                      {!activeRunOutput && !activeRunError ? (
                        <div className={styles.emptyTerminal}>
                          {!activeRunRecord
                            ? t(
                                'No execution logs yet. Click Run or Run Pytest above to start the test.',
                              )
                            : t('Selected run has no output.')}
                        </div>
                      ) : (
                        <pre className={styles.terminalTextArea}>
                          {activeRunOutput || activeRunError || ''}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Modal
          title={currentTestFlowId ? t('Save Flow As') : t('Save Flow')}
          open={saveModalOpen}
          onOk={handleSaveConfirm}
          onCancel={() => setSaveModalOpen(false)}
          okText={t('Save')}
          cancelText={t('Cancel')}
          destroyOnClose
        >
          <div style={{marginTop: 16}}>
            <div style={{marginBottom: 8}}>{t('Enter flow name')}:</div>
            <Input
              value={flowNameInput}
              onChange={(e) => setFlowNameInput(e.target.value)}
              placeholder={t('Enter flow name')}
              autoFocus
            />
          </div>
        </Modal>
      </div>
    </Card>
  );
};

export default TestFlowRecorder;
