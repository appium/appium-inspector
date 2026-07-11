import {Button, Modal} from 'antd';
import {useTranslation} from 'react-i18next';

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
    automationName,
    sessionSettings,
    currentContext,
  } = props;
  const {t} = useTranslation();

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
    <Modal
      open={isLocatorSearchModalVisible}
      title={t('Search for element')}
      onCancel={onCancel}
      footer={
        <>
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
          automationName={automationName}
          currentContext={currentContext}
        />
      )}
      {locatedElements && (
        <>
          {locatedElements.length === 0 && (
            <LocatorSearchEmptyResults
              locatorSearchStrategy={locatorSearchStrategy}
              locatorSearchValue={locatorSearchValue}
              automationName={automationName}
              sessionSettings={sessionSettings}
            />
          )}
          {locatedElements.length > 0 && <LocatorSearchFoundResults {...props} />}
        </>
      )}
    </Modal>
  );
};

export default LocatorSearchModal;
