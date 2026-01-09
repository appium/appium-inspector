export const SESSION_BUILDER_TABS = {
  CAPS_BUILDER: 'new',
  SAVED_CAPS: 'saved',
  ATTACH_TO_SESSION: 'attach',
};

export const SESSION_FILE_EXTENSION = '.appiumsession';

export const SESSION_FILE_VERSIONS = {
  V1: '1.0',
  V2: 2,
  LATEST: 2,
};

export const DEFAULT_SESSION_NAME = '(unnamed)';

export const SERVER_TYPES = {
  LOCAL: 'local',
  REMOTE: 'remote',
  ADVANCED: 'advanced',
  SAUCE: 'sauce',
  HEADSPIN: 'headspin',
  BROWSERSTACK: 'browserstack',
  LAMBDATEST: 'lambdatest',
  TESTINGBOT: 'testingbot',
  EXPERITEST: 'experitest',
  ROBOTQA: 'roboticmobi',
  REMOTETESTKIT: 'remotetestkit',
  BITBAR: 'bitbar',
  KOBITON: 'kobiton',
  PERFECTO: 'perfecto',
  PCLOUDY: 'pcloudy',
  MOBITRU: 'mobitru',
  TVLABS: 'tvlabs',
  TESTCRIBE: 'testcribe',
  WEBMATE: 'webmate',
  FIREFLINKDEVICEFARM: 'fireflinkdevicefarm',
};

export const SAVED_SESSIONS_TABLE_VALUES = {
  DATE_COLUMN_WIDTH: '25%',
  ACTIONS_COLUMN_WIDTH: '124px',
};

// Placeholder values for specific cloud provider input fields
export const PROVIDER_VALUES = {
  EXPERITEST_ACCESS_KEY: 'accessKey',
  EXPERITEST_URL: 'https://example.experitest.com',
  HEADSPIN_URL: 'https://xxxx.headspin.io:4723/v0/your-api-token/wd/hub',
  PCLOUDY_USERNAME: 'username@pcloudy.com',
  PCLOUDY_HOST: 'cloud.pcloudy.com',
  PCLOUDY_ACCESS_KEY: 'kjdgtdwn65fdasd78uy6y',
  PERFECTO_URL: 'cloud.Perfectomobile.com',
  TESTCRIBE_API_KEY: 'your-api-key',
};

export const ADD_CLOUD_PROVIDER_TAB_KEY = 'addCloudProvider';

export const SERVER_ADVANCED_PARAMS = {
  ALLOW_UNAUTHORIZED: 'allowUnauthorized',
  PROXY: 'proxy',
  USE_PROXY: 'useProxy',
};

export const CAPABILITY_TYPES = {
  TEXT: 'text',
  BOOL: 'boolean',
  NUM: 'number',
  OBJECT: 'object',
  // historical
  FILE: 'file',
  JSON_OBJECT: 'json_object',
};

export const STANDARD_W3C_CAPS = [
  'platformName',
  'browserName',
  'browserVersion',
  'acceptInsecureCerts',
  'pageLoadStrategy',
  'proxy',
  'setWindowRect',
  'timeouts',
  'strictFileInteractability',
  'unhandledPromptBehavior',
  'userAgent',
  'webSocketUrl', // WebDriver BiDi
];
