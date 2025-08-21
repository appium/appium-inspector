import {TagOutlined} from '@ant-design/icons';
import {Card} from 'antd';

import InspectorStyles from './Inspector.module.css';
import SelectedElement from './SelectedElement.jsx';

/**
 * Wrapper for the Selected Element panel,
 * both when an element is actually selected and when not
 */
const SelectedElementContainer = (props) => {
  const {selectedElement = {}, t} = props;

  return (
    <Card
      title={
        <span>
          <TagOutlined /> {t('selectedElement')}
        </span>
      }
      className={InspectorStyles['selected-element-card']}
    >
      {selectedElement.path && <SelectedElement {...props} />}
      {!selectedElement.path && <i>{t('selectElementInSource')}</i>}
    </Card>
  );
};

export default SelectedElementContainer;
