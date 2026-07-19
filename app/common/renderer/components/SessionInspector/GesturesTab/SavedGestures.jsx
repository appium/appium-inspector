import {Space, Spin} from 'antd';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../SessionInspector.module.css';
import GesturesTabCard from './GesturesTabCard.jsx';
import SavedGesturesTable from './SavedGesturesTable.jsx';

/**
 * Contents of the gestures tab: list of saved gestures.
 */
const SavedGestures = (props) => {
  const {isUploadingGestureFiles} = props;

  const {t} = useTranslation();

  return (
    <GesturesTabCard>
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        {t('gesturesDescription')}
        <Spin spinning={isUploadingGestureFiles}>
          <SavedGesturesTable {...props} />
        </Spin>
      </Space>
    </GesturesTabCard>
  );
};

export default SavedGestures;
