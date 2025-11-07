import {UploadOutlined} from '@ant-design/icons';
import {Button, Tooltip, Upload} from 'antd';
import {useRef} from 'react';

const FileUploader = (props) => {
  const {multiple, onUpload, type, icon, tooltipTitle} = props;

  const fileCounter = useRef(1);

  // If multiple files are uploaded at once, this function is called once for every file.
  // In order to upload everything only once, use a counter to track invocation count.
  const beforeUpload = (_file, list) => {
    if (fileCounter.current >= list.length) {
      onUpload(list);
      fileCounter.current = 1;
    } else {
      fileCounter.current += 1;
    }
    return false;
  };

  return (
    <Upload
      type="select"
      accept={type}
      multiple={!!multiple}
      beforeUpload={beforeUpload}
      showUploadList={false}
    >
      <Tooltip title={tooltipTitle}>
        <Button icon={icon || <UploadOutlined />} />
      </Tooltip>
    </Upload>
  );
};

export default FileUploader;
