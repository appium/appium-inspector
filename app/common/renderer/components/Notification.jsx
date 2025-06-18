import {App} from 'antd';
import {useEffect} from 'react';

import {NOTIFICATION_EVENT} from '../utils/notification';

export default function Notification() {
  const {notification} = App.useApp();

  useEffect(() => {
    const handleMessage = (event) => {
      const {args, type} = event.detail;
      notification[type](args);
    };

    document.addEventListener(NOTIFICATION_EVENT, handleMessage);

    return () => {
      document.removeEventListener(NOTIFICATION_EVENT, handleMessage);
    };
  }, [notification]);

  return null;
}
