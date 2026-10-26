import {Alert, Button, Col, Modal, Row, Space} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import LocatorSearchForm from './LocatorSearchForm.jsx';

import styles from './LocatorSearch.module.css';

const LocatorComparisonModal = ({
  onCancel,
  compareLocators,
  locatorSearchStrategy,
  locatorSearchValue,
  automationName,
  currentContext,
}) => {
  const {t} = useTranslation();
  const [locators, setLocators] = useState([
    {id: 'first', strategy: locatorSearchStrategy, selector: locatorSearchValue},
    {id: 'second', strategy: locatorSearchStrategy, selector: ''},
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  const updateLocator = (index, changes) => {
    setLocators((previous) => previous.map((locator, i) => (i === index ? {...locator, ...changes} : locator)));
    setResults(null);
    setError(null);
  };
  const cancelComparison = () => {
    request.current?.abort();
    onCancel();
  };
  const compare = async () => {
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setIsComparing(true);
    setResults(null);
    setError(null);
    try {
      const comparison = await compareLocators(locators, controller.signal);
      if (!controller.signal.aborted) {
        setResults(comparison);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err?.message || String(err));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsComparing(false);
      }
    }
  };

  return (
    <Modal
      open
      width={900}
      title={t('compareLocators')}
      onCancel={cancelComparison}
      footer={
        <>
          <Button onClick={cancelComparison}>{t('Back')}</Button>
          <Button
            type="primary"
            loading={isComparing}
            disabled={locators.some(({selector}) => !selector)}
            onClick={compare}
          >
            {t('Compare')}
          </Button>
        </>
      }
    >
      <p>{t('locatorComparisonTimingDescription')}</p>
      {error && <Alert title={t('locatorComparisonFailed')} description={error} type="error" showIcon />}
      <Row gutter={[16, 16]}>
        {locators.map((locator, index) => {
          const result = results?.[index];
          return (
            <Col xs={24} md={12} key={locator.id}>
              <fieldset className={styles.locatorComparisonInput} disabled={isComparing}>
                <legend>{t('comparisonLocator', {number: index + 1})}</legend>
                <LocatorSearchForm
                  locatorSearchStrategy={locator.strategy}
                  locatorSearchValue={locator.selector}
                  setLocatorSearchStrategy={(strategy) => updateLocator(index, {strategy})}
                  setLocatorSearchValue={(selector) => updateLocator(index, {selector})}
                  automationName={automationName}
                  currentContext={currentContext}
                />
              </fieldset>
              {result && (
                <div className={styles.locatorComparisonResult}>
                  {result.error ? (
                    <Alert title={t('locatorComparisonFailed')} description={result.error} type="error" showIcon />
                  ) : (
                    <Space orientation="vertical" size="small">
                      <strong>
                        {t('Time')}: {result.executionTime}
                      </strong>
                      <span>
                        {t('elementsCount')} {result.elementIds.length}
                      </span>
                      <pre className={styles.locatorComparisonIds}>{result.elementIds.join('\n')}</pre>
                    </Space>
                  )}
                </div>
              )}
            </Col>
          );
        })}
      </Row>
    </Modal>
  );
};

export default LocatorComparisonModal;
