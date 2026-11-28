export const MJPEG_STREAM_CHECK_INTERVAL = 1000;
export const SESSION_EXPIRY_PROMPT_TIMEOUT = 60 * 60 * 1000; // Give user 1 hour to reply
export const REFRESH_DELAY_MILLIS = 500;

export const APP_MODE = {
  NATIVE: 'native',
  WEB_HYBRID: 'web_hybrid',
};

export const NATIVE_APP = 'NATIVE_APP';

export const UNKNOWN_ERROR = 'unknown error';
export const SESSION_EXPIRED = 'Session Expired';

export const INSPECTOR_TABS = {
  SOURCE: 'source',
  COMMANDS: 'commands',
  GESTURES: 'gestures',
  RECORDER: 'recorder',
  SESSION_INFO: 'sessionInfo',
};

export const CLIENT_FRAMEWORKS = {
  DOTNET_NUNIT: 'dotNetNUnit',
  JS_WDIO: 'jsWdIo',
  JS_OXYGEN: 'jsOxygen',
  JAVA_JUNIT4: 'java', // historical
  JAVA_JUNIT5: 'javaJUnit5',
  PYTHON: 'python',
  ROBOT: 'robot',
  RUBY: 'ruby',
};
