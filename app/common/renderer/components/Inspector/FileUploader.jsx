import {UploadOutlined} from '@ant-design/icons';
import {Button, Tooltip, Upload} from 'antd';
import {useEffect, useState} from 'react';

const FileUploader = (props) => {
  const {multiple, onUpload, type, icon, tooltipTitle} = props;

  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (fileList.length > 0) {
      onUpload(fileList);
      setFileList([]);
    }
  }, [fileList]);

  const handleFileUpload = (_file, list) => {
    if (fileList.length !== list.length) {
      setFileList(list);
    }
    return false;
  };

  return (
    <Upload
      type="select"
      accept={type}
      multiple={!!multiple}
      beforeUpload={handleFileUpload}
      showUploadList={false}
    >
      <Tooltip title={tooltipTitle}>
        <Button icon={icon || <UploadOutlined />} />
      </Tooltip>
    </Upload>
  );
};

export default FileUploader;
