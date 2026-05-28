import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconCode,
  IconCopy,
  IconFileCode,
  IconPlayerPlay,
  IconRefresh,
  IconSparkles,
  IconTool,
} from '@tabler/icons-react';
import {Alert, Button, Flex, Progress, Segmented, Space, Table, Tag, Tooltip} from 'antd';
import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {copyToClipboard} from '../../../../utils/other.js';
import {getReadableCodeLanguage} from '../../../../utils/smart-locators/locator-code-sample.js';
import {getSmartLocatorRepairSuggestions} from '../../../../utils/smart-locators/locator-repair.js';
import {rankSmartLocators} from '../../../../utils/smart-locators/locator-scoring.js';
import {generatePageObject} from '../../../../utils/smart-locators/page-object-generator.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './SelectedElement.module.css';

const CODE_LANGUAGES = [
  {label: 'Python', value: 'python'},
  {label: 'Java', value: 'java'},
  {label: 'JavaScript', value: 'javascript'},
];

const PREVIEW_CANDIDATES_LIMIT = 5;

const SCORE_COLORS = {
  Recommended: 'green',
  Good: 'blue',
  Medium: 'gold',
  Weak: 'red',
  Invalid: 'red',
};

const PROGRESS_COLORS = {
  Recommended: 'var(--ant-green-6)',
  Good: 'var(--ant-blue-6)',
  Medium: 'var(--ant-gold-6)',
  Weak: 'var(--ant-red-6)',
  Invalid: 'var(--ant-red-6)',
};

/**
 * Smart ranking and explanation panel for locators derived from the selected element.
 */
const SmartLocatorRecommendation = ({
  selectedElement,
  sourceXML,
  currentContext,
  automationName,
  selectedElementId,
  isValidatingSmartLocators,
  runtimeValidationResults,
  validateSmartLocators,
}) => {
  const {t} = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedPageObjectLanguage, setSelectedPageObjectLanguage] = useState('python');
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [uniquenessCheckVersion, setUniquenessCheckVersion] = useState(0);

  const rankedLocators = useMemo(() => {
    const checkVersion = uniquenessCheckVersion;
    return rankSmartLocators({
      selectedElement,
      sourceXML,
      currentContext,
      automationName,
      runtimeValidationResults,
      checkVersion,
    });
  }, [
    automationName,
    currentContext,
    runtimeValidationResults,
    selectedElement,
    sourceXML,
    uniquenessCheckVersion,
  ]);

  if (!rankedLocators.length) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('No smart locator candidates found')}
        className={styles.smartLocatorPanel}
      />
    );
  }

  const bestLocator = rankedLocators[0];
  const visibleCandidates = showAllCandidates
    ? rankedLocators
    : rankedLocators.slice(0, PREVIEW_CANDIDATES_LIMIT);
  const selectedCodeSample = bestLocator.codeSamples[selectedLanguage];
  const repairSuggestions = getSmartLocatorRepairSuggestions({bestLocator, selectedElement});
  const pageObjectSample = generatePageObject({
    locator: bestLocator,
    selectedElement,
    language: selectedPageObjectLanguage,
  });
  const hasRuntimeValidation = Boolean(Object.keys(runtimeValidationResults || {}).length);

  const columns = [
    {
      title: t('Rank'),
      dataIndex: 'rank',
      key: 'rank',
      width: 56,
    },
    {
      title: t('Strategy'),
      dataIndex: 'label',
      key: 'label',
      width: 150,
      render: (label, locator) => <Tag color={SCORE_COLORS[locator.status]}>{label}</Tag>,
    },
    {
      title: t('Value'),
      dataIndex: 'value',
      key: 'value',
      render: (value) => (
        <Tooltip title={t('Copied!')} trigger="click">
          <span className={styles.copyableCell} onClick={() => copyToClipboard(value)}>
            <span className={`${inspectorStyles.monoFont} ${styles.smartLocatorTableValue}`}>
              {value}
            </span>
          </span>
        </Tooltip>
      ),
    },
    {
      title: t('Score'),
      dataIndex: 'score',
      key: 'score',
      width: 82,
      render: (score) => `${score}/100`,
    },
    {
      title: t('Matches'),
      dataIndex: 'matchCount',
      key: 'matchCount',
      width: 84,
      render: (matchCount) => (matchCount === null ? t('Source unavailable') : matchCount),
    },
    {
      title: t('Runtime'),
      dataIndex: 'runtime',
      key: 'runtime',
      width: 110,
      render: (runtime) => {
        if (!runtime) {
          return t('Not run');
        }
        if (runtime.error) {
          return <Tag color="red">{t('Failed')}</Tag>;
        }
        return `${runtime.matchCount} / ${runtime.executionTime} ms`;
      },
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 112,
      render: (status) => <Tag color={SCORE_COLORS[status]}>{status}</Tag>,
    },
  ];

  return (
    <section id="smartLocatorRecommendation" className={styles.smartLocatorPanel}>
      <Flex className={styles.smartLocatorHeader} align="center" justify="space-between" gap={8}>
        <Flex align="center" gap={6} className={styles.smartLocatorTitle}>
          <IconSparkles size={18} />
          <span>{t('Smart Locator Ranking*')}</span>
        </Flex>
        <Space.Compact>
          <Tooltip title={t('Copy locator')}>
            <Button
              icon={<IconCopy size={18} />}
              onClick={() => copyToClipboard(bestLocator.formattedLocator)}
            />
          </Tooltip>
          <Tooltip title={t('Run uniqueness check')}>
            <Button
              icon={<IconRefresh size={18} />}
              onClick={() => setUniquenessCheckVersion((version) => version + 1)}
            />
          </Tooltip>
          <Tooltip title={t('Validate locators with Appium')}>
            <Button
              icon={<IconPlayerPlay size={18} />}
              loading={isValidatingSmartLocators}
              disabled={!selectedElementId || isValidatingSmartLocators}
              onClick={() => validateSmartLocators(rankedLocators, selectedElementId)}
            />
          </Tooltip>
        </Space.Compact>
      </Flex>

      <div className={styles.smartLocatorBest}>
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Tag color={SCORE_COLORS[bestLocator.status]}>{t('Best Locator')}</Tag>
          <span className={styles.smartLocatorMatchText}>
            {bestLocator.matchCount === null
              ? t('Source unavailable')
              : t('Checked against current source', {count: bestLocator.matchCount})}
            {bestLocator.runtime &&
              ` / ${t('Runtime checked', {
                count: bestLocator.runtime.matchCount,
                time: bestLocator.runtime.executionTime,
              })}`}
          </span>
        </Flex>
        <div className={`${inspectorStyles.monoFont} ${styles.smartLocatorLocatorLine}`}>
          {bestLocator.formattedLocator}
        </div>
        <Progress
          percent={bestLocator.score}
          size="small"
          strokeColor={PROGRESS_COLORS[bestLocator.status]}
          format={() => `${bestLocator.score}/100`}
        />
      </div>

      <div>
        <div className={styles.smartLocatorSubheading}>{t('Why this locator?')}</div>
        <ul className={styles.smartLocatorReasonList}>
          {bestLocator.reasons.map((reason) => (
            <li key={reason}>
              <IconCircleCheck size={14} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className={styles.smartLocatorSubheading}>{t('Warnings')}</div>
        {bestLocator.warnings.length ? (
          <ul className={styles.smartLocatorWarningList}>
            {bestLocator.warnings.map((warning) => (
              <li key={warning}>
                <IconAlertTriangle size={14} />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.smartLocatorNoWarnings}>
            <IconCircleCheck size={14} />
            <span>{t('No locator warnings')}</span>
          </div>
        )}
      </div>

      {hasRuntimeValidation && (
        <div>
          <div className={styles.smartLocatorSubheading}>{t('Runtime Validation')}</div>
          <div className={styles.smartLocatorRuntimeGrid}>
            <div>
              <span>{t('Runtime matches')}</span>
              <strong>{bestLocator.runtime?.matchCount ?? '-'}</strong>
            </div>
            <div>
              <span>{t('Execution time')}</span>
              <strong>
                {bestLocator.runtime?.executionTime !== undefined
                  ? `${bestLocator.runtime.executionTime} ms`
                  : '-'}
              </strong>
            </div>
            <div>
              <span>{t('Matches selected element')}</span>
              <strong>
                {bestLocator.runtime?.matchesSelectedElement === null
                  ? '-'
                  : bestLocator.runtime?.matchesSelectedElement
                    ? t('Yes')
                    : t('No')}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div>
        <Flex align="center" gap={6} className={styles.smartLocatorSubheading}>
          <IconTool size={16} />
          <span>{t('Smart Repair Suggestions')}</span>
        </Flex>
        <ul className={styles.smartLocatorRepairList}>
          {repairSuggestions.map((suggestion) => (
            <li key={suggestion.key}>
              <div>
                <strong>{suggestion.title}</strong>
                <div>{suggestion.detail}</div>
                {(suggestion.value || suggestion.suggestedValue) && (
                  <Tooltip title={t('Copied!')} trigger="click">
                    <code
                      className={styles.smartLocatorInlineCode}
                      onClick={() => copyToClipboard(suggestion.value || suggestion.suggestedValue)}
                    >
                      {suggestion.value || suggestion.suggestedValue}
                    </code>
                  </Tooltip>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Flex align="center" gap={6} className={styles.smartLocatorSubheading}>
            <IconCode size={16} />
            <span>{t('Code Sample')}</span>
          </Flex>
          <Segmented
            size="small"
            options={CODE_LANGUAGES.map(({label, value}) => ({
              label,
              value,
            }))}
            value={selectedLanguage}
            onChange={setSelectedLanguage}
          />
        </Flex>
        <pre className={styles.smartLocatorCodeBlock}>
          <code>{selectedCodeSample}</code>
        </pre>
        <Button
          size="small"
          icon={<IconCopy size={16} />}
          onClick={() => copyToClipboard(selectedCodeSample)}
        >
          {t('Copy code')} {getReadableCodeLanguage(selectedLanguage)}
        </Button>
      </div>

      <div>
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Flex align="center" gap={6} className={styles.smartLocatorSubheading}>
            <IconFileCode size={16} />
            <span>{t('Page Object')}</span>
          </Flex>
          <Segmented
            size="small"
            options={CODE_LANGUAGES.map(({label, value}) => ({
              label,
              value,
            }))}
            value={selectedPageObjectLanguage}
            onChange={setSelectedPageObjectLanguage}
          />
        </Flex>
        <pre className={styles.smartLocatorCodeBlock}>
          <code>{pageObjectSample}</code>
        </pre>
        <Button
          size="small"
          icon={<IconCopy size={16} />}
          onClick={() => copyToClipboard(pageObjectSample)}
        >
          {t('Copy page object')} {getReadableCodeLanguage(selectedPageObjectLanguage)}
        </Button>
      </div>

      <div>
        <Flex
          className={styles.smartLocatorCandidateActions}
          align="center"
          justify="space-between"
          gap={8}
        >
          <span className={styles.smartLocatorSubheading}>{t('Other candidates')}</span>
          <Button
            size="small"
            icon={showAllCandidates ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            onClick={() => setShowAllCandidates((isVisible) => !isVisible)}
          >
            {showAllCandidates ? t('Show fewer candidates') : t('Show all candidates')}
          </Button>
        </Flex>
        <Table
          columns={columns}
          dataSource={visibleCandidates.map((locator, index) => ({
            ...locator,
            rank: index + 1,
          }))}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{x: 'max-content'}}
        />
      </div>
    </section>
  );
};

export default SmartLocatorRecommendation;
