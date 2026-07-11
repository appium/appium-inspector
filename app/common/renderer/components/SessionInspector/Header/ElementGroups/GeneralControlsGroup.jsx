import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconSearch,
  IconVideo,
} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import LocatorSearchModal from '../LocatorSearch/LocatorSearchModal.jsx';

/**
 * Controls for general session actions.
 */
const GeneralControlsGroup = (props) => {
  const {
    isUsingMjpegMode,
    isSourceRefreshOn,
    setRefreshingState,
    applyClientMethod,
    showLocatorSearchModal,
    isRecording,
    startRecording,
    pauseRecording,
  } = props;
  const {t} = useTranslation();

  return (
    <Space.Compact>
      {isUsingMjpegMode && !isSourceRefreshOn && (
        <Tooltip title={t('Start Refreshing Source')}>
          <Button
            id="btnStartRefreshing"
            icon={<IconPlayerPlay size={18} />}
            onClick={() => setRefreshingState({source: true})}
          />
        </Tooltip>
      )}
      {isUsingMjpegMode && isSourceRefreshOn && (
        <Tooltip title={t('Pause Refreshing Source')}>
          <Button
            id="btnPauseRefreshing"
            icon={<IconPlayerPause size={18} />}
            onClick={() => setRefreshingState({source: false})}
          />
        </Tooltip>
      )}
      <Tooltip title={t('refreshSource')}>
        <Button
          id="btnReload"
          icon={<IconRefresh size={18} />}
          onClick={() => applyClientMethod({methodName: 'getPageSource'})}
        />
      </Tooltip>
      <Tooltip title={t('Search for element')}>
        <Button
          id="searchForElement"
          icon={<IconSearch size={18} />}
          onClick={showLocatorSearchModal}
        />
      </Tooltip>
      <LocatorSearchModal {...props} />
      {!isRecording && (
        <Tooltip title={t('Start Recording')}>
          <Button id="btnStartRecording" icon={<IconVideo size={18} />} onClick={startRecording} />
        </Tooltip>
      )}
      {isRecording && (
        <Tooltip title={t('Pause Recording')}>
          <Button
            id="btnPause"
            icon={<IconVideo size={18} />}
            type={BUTTON.PRIMARY}
            danger
            onClick={pauseRecording}
          />
        </Tooltip>
      )}
    </Space.Compact>
  );
};

export default GeneralControlsGroup;
