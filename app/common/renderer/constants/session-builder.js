export const SESSION_BUILDER_TABS = {
  CAPS_BUILDER: 'new',
  SAVED_CAPS: 'saved',
  ATTACH_TO_SESSION: 'attach',
};

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
};

export const SAVED_SESSIONS_TABLE_VALUES = {
  DATE_COLUMN_WIDTH: '25%',
  ACTIONS_COLUMN_WIDTH: '106px',
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
};

export const ADD_CLOUD_PROVIDER_TAB_KEY = 'addCloudProvider';

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
  'unhandledPromptBehavior',
  'webSocketUrl', // WebDriver BiDi
];
