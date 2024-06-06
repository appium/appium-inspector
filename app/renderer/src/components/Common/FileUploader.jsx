import {Button, Upload} from 'antd';
import React, {useState, useEffect} from 'react';
import {UploadOutlined} from '@ant-design/icons';
import {set} from 'lodash';

const FileUploader = (props) => {
  const {multiple, onUpload, type, icon} = props;

  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (fileList.length > 0) {
      onUpload(fileList);
      setFileList([]);
    }
  }, [fileList]);

  const handleFileUpload = (file, list) => {
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
      <Button icon={icon || <UploadOutlined />} />
    </Upload>
  );
};

export default FileUploader;
