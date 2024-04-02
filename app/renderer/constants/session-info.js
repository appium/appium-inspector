// Columns in the session information table
export const SESSION_INFO_PROPS = {
  session_id: 'Session ID',
  session_url: 'Session URL',
  server_details: 'Server Details',
  session_length: 'Session Length',
  session_details: 'Session Details',
  active_appId: 'Currently Active App ID',
};

export const SESSION_INFO_TABLE_PARAMS = {
  OUTER_KEY: 'sessionInfo',
  SESSION_KEY: 'sessionDetails',
  SERVER_KEY: 'serverDetails',
  SCROLL_DISTANCE_Y: 104,
  COLUMN_WIDTH: 200,
};
