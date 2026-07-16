import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconSearch,
  IconVideo,
} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import LocatorSearchModal from './LocatorSearch/LocatorSearchModal.jsx';

/**
 * Controls related to refreshing the app source/screenshot.
 */
const RefreshControlsGroup = ({
  isUsingMjpegMode,
  isSourceRefreshOn,
  setRefreshingState,
  applyClientMethod,
}) => {
  const {t} = useTranslation();

  return (
    <>
      {isUsingMjpegMode &&
        (isSourceRefreshOn ? (
          <Tooltip title={t('Pause Refreshing Source')}>
            <Button
              id="btnPauseRefreshing"
              icon={<IconPlayerPause size={18} />}
              onClick={() => setRefreshingState({source: false})}
            />
          </Tooltip>
        ) : (
          <Tooltip title={t('Start Refreshing Source')}>
            <Button
              id="btnStartRefreshing"
              icon={<IconPlayerPlay size={18} />}
              onClick={() => setRefreshingState({source: true})}
            />
          </Tooltip>
        ))}
      <Tooltip title={t('refreshSource')}>
        <Button
          id="btnReload"
          icon={<IconRefresh size={18} />}
          onClick={() => applyClientMethod({methodName: 'getPageSource'})}
        />
      </Tooltip>
    </>
  );
};

/**
 * Controls related to locator search.
 */
const SearchControlsGroup = (props) => {
  const {showLocatorSearchModal} = props;
  const {t} = useTranslation();

  return (
    <>
      <Tooltip title={t('Search for element')}>
        <Button
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
 * Controls related to recording user interactions.
 */
const RecordingControlsGroup = ({isRecording, startRecording, pauseRecording}) => {
  const {t} = useTranslation();

  return isRecording ? (
    <Tooltip title={t('Pause Recording')}>
      <Button
        id="btnPause"
        icon={<IconVideo size={18} />}
        type={BUTTON.PRIMARY}
        danger
        onClick={pauseRecording}
      />
    </Tooltip>
  ) : (
    <Tooltip title={t('Start Recording')}>
      <Button id="btnStartRecording" icon={<IconVideo size={18} />} onClick={startRecording} />
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
      <RefreshControlsGroup
        isUsingMjpegMode={isUsingMjpegMode}
        isSourceRefreshOn={isSourceRefreshOn}
        setRefreshingState={setRefreshingState}
        applyClientMethod={applyClientMethod}
      />
      <SearchControlsGroup {...props} />
      <RecordingControlsGroup
        isRecording={isRecording}
        startRecording={startRecording}
        pauseRecording={pauseRecording}
      />
    </Space.Compact>
  );
};

export default GeneralControlsGroup;
