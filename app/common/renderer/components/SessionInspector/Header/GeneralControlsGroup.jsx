import {IconPlayerPause, IconPlayerPlay, IconRefresh, IconSearch, IconVideo} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import LocatorSearchModal from './LocatorSearch/LocatorSearchModal.jsx';

/**
 * Button for toggling automatic source/screenshot refresh.
 */
const ToggleAutomaticRefreshButton = ({isSourceRefreshOn, setRefreshingState}) => {
  const {t} = useTranslation();
  const pauseRefreshLabel = t('Pause Refreshing Source');
  const startRefreshLabel = t('Start Refreshing Source');

  return isSourceRefreshOn ? (
    <Tooltip title={pauseRefreshLabel}>
      <Button
        aria-label={pauseRefreshLabel}
        id="btnPauseRefreshing"
        icon={<IconPlayerPause size={18} />}
        onClick={() => setRefreshingState({source: false})}
      />
    </Tooltip>
  ) : (
    <Tooltip title={startRefreshLabel}>
      <Button
        aria-label={startRefreshLabel}
        id="btnStartRefreshing"
        icon={<IconPlayerPlay size={18} />}
        onClick={() => setRefreshingState({source: true})}
      />
    </Tooltip>
  );
};

/**
 * Button for explicitly refreshing the app source/screenshot.
 */
const ManualRefreshButton = ({applyClientMethod}) => {
  const {t} = useTranslation();
  const refreshLabel = t('refreshSource');

  return (
    <Tooltip title={refreshLabel}>
      <Button
        aria-label={refreshLabel}
        id="btnReload"
        icon={<IconRefresh size={18} />}
        onClick={() => applyClientMethod({methodName: 'getPageSource'})}
      />
    </Tooltip>
  );
};

/**
 * Button to open the locator search modal.
 */
const SearchForElementButton = (props) => {
  const {showLocatorSearchModal} = props;
  const {t} = useTranslation();
  const searchLabel = t('Search for element');

  return (
    <>
      <Tooltip title={searchLabel}>
        <Button
          aria-label={searchLabel}
          id="searchForElement"
          icon={<IconSearch size={18} />}
          onClick={showLocatorSearchModal}
        />
      </Tooltip>
      <LocatorSearchModal {...props} />
    </>
  );
};

/**
 * Button for toggling recording of user interactions.
 */
const ToggleRecordingButton = ({isRecording, startRecording, pauseRecording}) => {
  const {t} = useTranslation();
  const pauseLabel = t('Pause Recording');
  const startLabel = t('Start Recording');

  return isRecording ? (
    <Tooltip title={pauseLabel}>
      <Button
        aria-label={pauseLabel}
        id="btnPause"
        icon={<IconVideo size={18} />}
        type={BUTTON.PRIMARY}
        danger
        onClick={pauseRecording}
      />
    </Tooltip>
  ) : (
    <Tooltip title={startLabel}>
      <Button aria-label={startLabel} id="btnStartRecording" icon={<IconVideo size={18} />} onClick={startRecording} />
    </Tooltip>
  );
};

/**
 * Controls for general session actions.
 */
const GeneralControlsGroup = (props) => {
  const {
    isUsingMjpegMode,
    isSourceRefreshOn,
    setRefreshingState,
    applyClientMethod,
    isRecording,
    startRecording,
    pauseRecording,
  } = props;
  return (
    <Space.Compact>
      {isUsingMjpegMode && (
        <ToggleAutomaticRefreshButton
          isUsingMjpegMode={isUsingMjpegMode}
          isSourceRefreshOn={isSourceRefreshOn}
          setRefreshingState={setRefreshingState}
        />
      )}
      <ManualRefreshButton applyClientMethod={applyClientMethod} />
      <SearchForElementButton {...props} />
      <ToggleRecordingButton
        isRecording={isRecording}
        startRecording={startRecording}
        pauseRecording={pauseRecording}
      />
    </Space.Compact>
  );
};

export default GeneralControlsGroup;
