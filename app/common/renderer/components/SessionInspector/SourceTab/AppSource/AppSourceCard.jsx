import {
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconFiles,
  IconFileText,
} from '@tabler/icons-react';
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
 * Toggle button that collapses/expands the card body while keeping its
 * header visible. Only shown when panels are stacked (narrow layout),
 * since the side-by-side layout already offers a full collapse via the
 * Splitter divider.
 */
const CollapseToggleButton = ({collapsed, onClick}) => {
  const {t} = useTranslation();

  return (
    <Tooltip title={t(collapsed ? 'Expand Panel' : 'Collapse Panel')}>
      <Button
        type="text"
        icon={collapsed ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
        onClick={onClick}
      />
    </Tooltip>
  );
};

/**
 * Wrapper card for the app source tree.
 */
const AppSourceCard = ({sourceXML, collapsible, collapsed, onToggleCollapse, children}) => (
  <Card
    title={<AppSourcePanelTitle />}
    extra={
      <span>
        <AppSourceHeaderButtons sourceXML={sourceXML} />
        {collapsible && <CollapseToggleButton collapsed={collapsed} onClick={onToggleCollapse} />}
      </span>
    }
  >
    {!collapsed && children}
  </Card>
);

export default AppSourceCard;
