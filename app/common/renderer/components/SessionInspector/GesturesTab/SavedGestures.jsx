import {Flex} from 'antd';
import {useTranslation} from 'react-i18next';

import GesturesTabCard from './GesturesTabCard.jsx';
import SavedGesturesTable from './SavedGesturesTable.jsx';

/**
 * Contents of the gestures tab: list of saved gestures.
 */
const SavedGestures = (props) => {
  const {t} = useTranslation();

  return (
    <GesturesTabCard>
      <Flex gap={8} orientation="vertical" style={{height: '100%'}}>
        {t('gesturesDescription')}
        <div style={{flex: 1, minHeight: '100px'}}>
          <SavedGesturesTable {...props} />
        </div>
      </Flex>
    </GesturesTabCard>
  );
};

export default SavedGestures;
