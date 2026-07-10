import {Button, Modal} from 'antd';
import {useTranslation} from 'react-i18next';

import LocatorSearchForm from './LocatorSearchForm.jsx';
import LocatorSearchResults from './LocatorSearchResults.jsx';

const LocatorSearchModal = (props) => {
  const {isLocatorSearchModalVisible, isSearchingForElements, clearSearchResults, locatedElements} =
    props;
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

  // Footer displays all the buttons at the bottom of the Modal
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
      {!locatedElements && <LocatorSearchForm {...props} />}
      {locatedElements && <LocatorSearchResults {...props} />}
    </Modal>
  );
};

export default LocatorSearchModal;
