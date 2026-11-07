import {IconClockX, IconHistory} from '@tabler/icons-react';
import {Button, Col, Modal, Row, Space, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {LOCATOR_SEARCH_HISTORY} from '../../../../../shared/setting-defs.js';
import {BUTTON} from '../../../../constants/antd-types.js';
import {getSetting, setSetting} from '../../../../polyfills.js';
import {addLocatorSearchHistoryEntry} from '../../../../utils/locator-search.js';
import LocatorSearchEmptyResults from './LocatorSearchEmptyResults.jsx';
import LocatorSearchForm from './LocatorSearchForm.jsx';
import LocatorSearchFoundResults from './LocatorSearchFoundResults.jsx';

import styles from './LocatorSearch.module.css';

let retrievedSearchHistory = await getSetting(LOCATOR_SEARCH_HISTORY);

/**
 * Footer buttons of the modal used for locator search.
 */
const LocatorSearchModalFooter = ({
  locatedElements,
  isSearchingForElements,
  clearSearchResults,
  onSubmit,
  searchHistory,
  showSearchHistory,
  setShowSearchHistory,
  clearSearchHistory,
}) => {
  const {t} = useTranslation();
  const toggleHistoryLabel = t('toggleSearchHistory');
  const clearHistoryLabel = t('clearSearchHistory');

  return (
    <Row>
      <Col span={12}>
        {!locatedElements && (
          <Space.Compact>
            <Tooltip title={toggleHistoryLabel}>
              <Button
                aria-label={toggleHistoryLabel}
                id="btnToggleSearchHistory"
                icon={<IconHistory size={18} />}
                disabled={!searchHistory.length}
                type={showSearchHistory ? BUTTON.PRIMARY : BUTTON.DEFAULT}
                onClick={() => setShowSearchHistory(!showSearchHistory)}
              />
            </Tooltip>
            <Tooltip title={clearHistoryLabel}>
              <Button
                aria-label={clearHistoryLabel}
                id="btnClearSearchHistory"
                icon={<IconClockX size={18} />}
                disabled={!searchHistory.length}
                onClick={clearSearchHistory}
              />
            </Tooltip>
          </Space.Compact>
        )}
      </Col>
      <Col span={12} className={styles.searchModalFooterRightCol}>
        {locatedElements && <Button onClick={(e) => e.preventDefault() || clearSearchResults()}>{t('Back')}</Button>}
        <Button loading={isSearchingForElements} onClick={onSubmit} type={BUTTON.PRIMARY}>
          {locatedElements ? t('Done') : t('Search')}
        </Button>
      </Col>
    </Row>
  );
};

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
  } = props;
  const {t} = useTranslation();

  const [searchHistory, setSearchHistory] = useState(retrievedSearchHistory);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const updateSearchHistory = async (updatedHistory) => {
    setSearchHistory(updatedHistory);
    // New sessions remount this component without reloading the module.
    retrievedSearchHistory = updatedHistory;
    await setSetting(LOCATOR_SEARCH_HISTORY, updatedHistory);
  };

  const clearSearchHistory = async () => {
    setShowSearchHistory(false);
    await updateSearchHistory([]);
  };

  const onCancel = () => {
    const {hideLocatorSearchModal} = props;
    setShowSearchHistory(false);
    hideLocatorSearchModal();
    clearSearchResults();
  };

  const onSubmit = async () => {
    const {locatorSearchStrategy, locatorSearchValue, searchForElement} = props;
    if (locatedElements) {
      onCancel();
    } else {
      const updatedHistory = addLocatorSearchHistoryEntry(searchHistory, {
        strategy: locatorSearchStrategy,
        selector: locatorSearchValue,
      });
      await updateSearchHistory(updatedHistory);
      searchForElement(locatorSearchStrategy, locatorSearchValue);
    }
  };

  return (
    <Modal
      open={isLocatorSearchModalVisible}
      title={t('Search for element')}
      className={styles.searchModal}
      onCancel={onCancel}
      footer={
        <LocatorSearchModalFooter
          locatedElements={locatedElements}
          isSearchingForElements={isSearchingForElements}
          clearSearchResults={clearSearchResults}
          onSubmit={onSubmit}
          searchHistory={searchHistory}
          showSearchHistory={showSearchHistory}
          setShowSearchHistory={setShowSearchHistory}
          clearSearchHistory={clearSearchHistory}
        />
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
          searchHistory={searchHistory}
          showSearchHistory={showSearchHistory}
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
  );
};

export default LocatorSearchModal;
