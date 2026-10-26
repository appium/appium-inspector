import {Button, Modal} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import LocatorComparisonModal from './LocatorComparisonModal.jsx';
import LocatorSearchEmptyResults from './LocatorSearchEmptyResults.jsx';
import LocatorSearchForm from './LocatorSearchForm.jsx';
import LocatorSearchFoundResults from './LocatorSearchFoundResults.jsx';

/**
 * Modal container used for locator search.
 */
const LocatorSearchModal = (props) => {
  const {
    isLocatorSearchModalVisible,
    isSearchingForElements,
    clearSearchResults,
    setLocatorSearchStrategy,
    setLocatorSearchValue,
    locatedElements,
    locatorSearchStrategy,
    locatorSearchValue,
    featureCaps,
    sessionSettings,
    currentContext,
    driver,
    compareLocators,
  } = props;
  const {t} = useTranslation();
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const onCancel = () => {
    const {hideLocatorSearchModal} = props;
    hideLocatorSearchModal();
    clearSearchResults();
  };

  const onSubmit = () => {
    const {locatorSearchStrategy, locatorSearchValue, searchForElement} = props;
    if (locatedElements) {
      onCancel();
    } else {
      searchForElement(locatorSearchStrategy, locatorSearchValue);
    }
  };

  return (
    <>
      {isComparisonOpen && isLocatorSearchModalVisible && (
        <LocatorComparisonModal
          key={`${driver?.sessionId}:${currentContext}`}
          onCancel={() => setIsComparisonOpen(false)}
          compareLocators={compareLocators}
          locatorSearchStrategy={locatorSearchStrategy}
          locatorSearchValue={locatorSearchValue}
          automationName={featureCaps.automationName}
          currentContext={currentContext}
        />
      )}
      <Modal
        open={isLocatorSearchModalVisible && !isComparisonOpen}
        title={t('Search for element')}
        onCancel={onCancel}
        footer={
          <>
            {!locatedElements && (
              <Button disabled={isSearchingForElements} onClick={() => setIsComparisonOpen(true)}>
                {t('compareLocators')}
              </Button>
            )}
            {locatedElements && (
              <Button onClick={(e) => e.preventDefault() || clearSearchResults()}>{t('Back')}</Button>
            )}
            <Button loading={isSearchingForElements} onClick={onSubmit} type="primary">
              {locatedElements ? t('Done') : t('Search')}
            </Button>
          </>
        }
      >
        {!locatedElements && (
          <LocatorSearchForm
            setLocatorSearchValue={setLocatorSearchValue}
            locatorSearchValue={locatorSearchValue}
            setLocatorSearchStrategy={setLocatorSearchStrategy}
            locatorSearchStrategy={locatorSearchStrategy}
            automationName={featureCaps.automationName}
            currentContext={currentContext}
          />
        )}
        {locatedElements && (
          <>
            {locatedElements.length === 0 && (
              <LocatorSearchEmptyResults
                locatorSearchStrategy={locatorSearchStrategy}
                locatorSearchValue={locatorSearchValue}
                automationName={featureCaps.automationName}
                sessionSettings={sessionSettings}
              />
            )}
            {locatedElements.length > 0 && <LocatorSearchFoundResults {...props} />}
          </>
        )}
      </Modal>
    </>
  );
};

export default LocatorSearchModal;
