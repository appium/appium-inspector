import {Alert, Col, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {ALERT} from '../../../../constants/antd-types.js';
import {DRIVERS} from '../../../../constants/common.js';
import {LOCATOR_STRATEGIES} from '../../../../constants/session-inspector.js';
import inspectorStyles from '../../SessionInspector.module.css';

/**
 * Info message shown when an ID locator search for a UiAutomator2 session returns no results,
 * which may be due to the disableIdLocatorAutocompletion setting not being enabled.
 */
const DisableIdAutocompletionMessage = ({
  locatorSearchStrategy,
  locatorSearchValue,
  automationName,
  sessionSettings,
}) => {
  const {t} = useTranslation();

  const shouldShowMessage =
    automationName === DRIVERS.UIAUTOMATOR2 &&
    locatorSearchStrategy === LOCATOR_STRATEGIES.ID &&
    !locatorSearchValue.includes(':id/') &&
    !sessionSettings.disableIdLocatorAutocompletion;

  return (
    <>
      {shouldShowMessage && (
        <Row>
          <Alert title={t('idAutocompletionCanBeDisabled')} type={ALERT.INFO} showIcon />
        </Row>
      )}
    </>
  );
};

/**
 * Locator search results for when no locators were found.
 */
const LocatorSearchEmptyResults = ({
  locatorSearchStrategy,
  locatorSearchValue,
  automationName,
  sessionSettings,
}) => {
  const {t} = useTranslation();

  return (
    <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
      <Row>
        <i>{t('couldNotFindAnyElements')}</i>
      </Row>
      <Row>
        <Col span={6}>{t('locatorStrategy')}</Col>
        <Col span={18}>
          <span className={inspectorStyles.monoFont}>{locatorSearchStrategy}</span>
        </Col>
      </Row>
      <Row>
        <Col span={6}>{t('selector')}</Col>
        <Col span={18}>
          <span className={inspectorStyles.monoFont}>{locatorSearchValue}</span>
        </Col>
      </Row>
      <DisableIdAutocompletionMessage
        locatorSearchStrategy={locatorSearchStrategy}
        locatorSearchValue={locatorSearchValue}
        automationName={automationName}
        sessionSettings={sessionSettings}
      />
    </Space>
  );
};

export default LocatorSearchEmptyResults;
