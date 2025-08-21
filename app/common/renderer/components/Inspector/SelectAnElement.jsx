import {TagOutlined} from '@ant-design/icons';
import {Card} from 'antd';

import InspectorStyles from './Inspector.module.css';

/**
 * Empty card shown in place of the Selected Element panel,
 * if no element is selected.
 */
const SelectAnElement = ({t}) => (
  <Card
    title={
      <span>
        <TagOutlined /> {t('selectedElement')}
      </span>
    }
    className={InspectorStyles['selected-element-card']}
  >
    <i>{t('selectElementInSource')}</i>
  </Card>
);

export default SelectAnElement;
