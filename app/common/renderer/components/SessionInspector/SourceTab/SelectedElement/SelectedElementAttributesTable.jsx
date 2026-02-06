import {useTranslation} from 'react-i18next';

import SelectedElementTable from './SelectedElementTable.jsx';
import SelectedElementTableCell from './SelectedElementTableCell.jsx';

/**
 * Table listing the selected element's attributes.
 */
const SelectedElementAttributesTable = ({elementAttributesData}) => {
  const {t} = useTranslation();

  const elementAttributesCols = [
    {
      title: t('Attribute'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'start',
      render: (text) => <SelectedElementTableCell text={text} isCopyable={false} />,
    },
    {
      title: t('Value'),
      dataIndex: 'value',
      key: 'value',
      render: (text) => <SelectedElementTableCell text={text} isCopyable={true} />,
    },
  ];

  return (
    <SelectedElementTable columns={elementAttributesCols} dataSource={elementAttributesData} />
  );
};

export default SelectedElementAttributesTable;
