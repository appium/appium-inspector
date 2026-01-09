import {ImportOutlined} from '@ant-design/icons';
import {Button, Upload} from 'antd';
import {useRef} from 'react';

const FileUploader = (props) => {
  const {multiple, onUpload, type, title} = props;

  const fileCounterRef = useRef(1);

  // If multiple files are uploaded at once, this function is called once for every file.
  // In order to upload everything only once, use a counter to track invocation count.
  const beforeUpload = (_file, list) => {
    if (fileCounterRef.current >= list.length) {
      onUpload(list);
      fileCounterRef.current = 1;
    } else {
      fileCounterRef.current += 1;
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
      <Button icon={<ImportOutlined />}>{title}</Button>
    </Upload>
  );
};

export default FileUploader;
