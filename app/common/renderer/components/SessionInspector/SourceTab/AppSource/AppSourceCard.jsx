import {IconDownload, IconFiles, IconFileText} from '@tabler/icons-react';
import {Button, Card, Flex, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {downloadFile} from '../../../../utils/file-handling.js';
import {copyToClipboard} from '../../../../utils/other.js';

const downloadXML = (sourceXML) => {
  const href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(sourceXML);
  const filename = `app-source-${new Date().toJSON()}.xml`;
  downloadFile(href, filename);
};

/**
 * Title of the app source panel card.
 */
const AppSourcePanelTitle = () => {
  const {t} = useTranslation();

  return (
    <Flex gap={4} align="center">
      <IconFileText size={18} />
      {t('App Source')}
    </Flex>
  );
};

/**
 * Header action buttons for source XML copy and download.
 */
const AppSourceHeaderButtons = ({sourceXML}) => {
  const {t} = useTranslation();

  return (
    <span>
      <Tooltip title={t('Copy XML Source to Clipboard')}>
        <Button
          type="text"
          id="btnSourceXML"
          icon={<IconFiles size={18} />}
          onClick={() => copyToClipboard(sourceXML)}
        />
      </Tooltip>
      <Tooltip title={t('Download Source as .XML File')}>
        <Button
          type="text"
          id="btnDownloadSourceXML"
          icon={<IconDownload size={18} />}
          onClick={() => downloadXML(sourceXML)}
        />
      </Tooltip>
    </span>
  );
};

/**
 * Wrapper card for the app source tree.
 */
const AppSourceCard = ({sourceXML, children}) => (
  <Card title={<AppSourcePanelTitle />} extra={<AppSourceHeaderButtons sourceXML={sourceXML} />}>
    {children}
  </Card>
);

export default AppSourceCard;
