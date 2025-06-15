export const NOTIFICATION_EVENT = 'notificationEvent';

function dispatchNotificationEvent(type, args) {
  document.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: {
        type,
        args,
      },
    }),
  );
}

export const notification = {
  success: (args) => {
    dispatchNotificationEvent('success', args);
  },
  error: (args) => {
    dispatchNotificationEvent('error', args);
  },
  info: (args) => {
    dispatchNotificationEvent('info', args);
  },
  warning: (args) => {
    dispatchNotificationEvent('warning', args);
  },
  open: (args) => {
    dispatchNotificationEvent('open', args);
  },
};
