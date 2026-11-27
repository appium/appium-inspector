import {createSlice} from '@reduxjs/toolkit';

import {SERVER_TYPES, SESSION_BUILDER_TABS} from '../constants/session-builder.js';
import {isPlainObject, omit} from '../utils/common.js';
import {getRandomId} from '../utils/other.js';

const visibleProviders = []; // Pull this from the VISIBLE_PROVIDERS setting

const server = {};
for (const serverType of Object.values(SERVER_TYPES)) {
  server[serverType] = serverType === SERVER_TYPES.SAUCE ? {dataCenter: 'us-west-1'} : {};
}

// Make sure there's always at least one cap
const INITIAL_STATE = {
  savedSessions: [],
  tabKey: SESSION_BUILDER_TABS.CAPS_BUILDER,
  serverType: SERVER_TYPES.REMOTE,
  visibleProviders,
  server,
  attachSessId: null,

  // Make sure there's always at least one cap
  caps: [
    {
      id: getRandomId(),
      type: 'text',
      enabled: true,
    },
  ],

  isCapsDirty: true,
  isDuplicateCapsName: false,
  gettingSessions: false,
  runningAppiumSessions: [],
  isEditingDesiredCapsName: false,
  isEditingDesiredCaps: false,
  isValidCapsJson: true,
  isValidatingCapsJson: false,
  isAddingCloudProvider: false,
  addVendorPrefixes: true,
  isUploadingSessionFiles: false,
};

// `server` is always exactly two levels deep (serverType -> flat scalar config), so merging
// each serverType's config one level deep is equivalent to a full recursive deep merge here.
function mergeServerState(currentServer, incomingServer) {
  const nextServer = {...currentServer};
  for (const [serverType, config] of Object.entries(incomingServer)) {
    nextServer[serverType] = isPlainObject(config) ? {...(nextServer[serverType] || {}), ...config} : config;
  }
  return nextServer;
}

const builderSlice = createSlice({
  name: 'builder',
  initialState: INITIAL_STATE,
  reducers: {
    newSessionRequested: (state) => {
      state.newSessionRequested = true;
    },

    newSessionLoading: (state) => {
      state.newSessionLoading = true;
      delete state.newSessionRequested;
    },

    newSessionDone: (state) => {
      delete state.newSessionLoading;
    },

    addCapability: (state) => {
      state.caps.push({id: getRandomId(), type: 'text', enabled: true});
    },

    removeCapability: (state, action) => {
      state.caps = state.caps.filter((cap) => cap.id !== action.payload);
      state.isCapsDirty = true;
    },

    setCapabilityParam: (state, action) => {
      const {id, name, value} = action.payload;
      state.isCapsDirty = true;
      for (const cap of state.caps) {
        if (cap.id === id) {
          cap[name] = value;
        }
      }
    },

    setCapsAndServer: (state, action) => {
      const {server: incomingServer, serverType, caps, uuid, name} = action.payload;
      state.server = {...state.server, ...incomingServer};
      state.serverType = serverType;
      state.caps = caps.map((cap) => ({
        id: getRandomId(),
        enabled: true,
        ...cap,
      }));
      state.capsUUID = uuid;
      state.capsName = name;
      if (serverType !== SERVER_TYPES.REMOTE) {
        state.visibleProviders = [...new Set([...state.visibleProviders, serverType])];
      }
      delete state.isCapsDirty;
    },

    loadCapabilityTemplate: (state, action) => {
      state.caps = action.payload;
      state.isCapsDirty = true;
      state.isEditingDesiredCaps = false;
      state.rawDesiredCaps = null;
      state.isValidCapsJson = true;
      state.isValidatingCapsJson = false;
      state.invalidCapsJsonReason = null;
    },

    saveSessionRequested: (state) => {
      state.saveSessionRequested = true;
      delete state.showSaveAsModal;
    },

    saveSessionDone: (state) => {
      state.isEditingDesiredCapsName = false;
      state.isDuplicateCapsName = false;
      delete state.saveSessionRequested;
      delete state.saveAsText;
    },

    getSavedSessionsRequested: (state) => {
      state.getSavedSessionsRequested = true;
    },

    getSavedSessionsDone: (state, action) => {
      state.savedSessions = action.payload || [];
      delete state.getSavedSessionsRequested;
    },

    deleteSavedSessionRequested: (state) => {
      state.deletingSession = true;
    },

    deleteSavedSessionDone: (state) => {
      state.deletingSession = false;
      state.capsUUID = null;
      state.capsName = null;
    },

    switchedTabs: (state, action) => {
      state.tabKey = action.payload;
    },

    saveAsModalRequested: (state) => {
      state.showSaveAsModal = true;
    },

    hideSaveAsModalRequested: (state) => {
      state.isDuplicateCapsName = false;
      delete state.saveAsText;
      delete state.showSaveAsModal;
    },

    setSaveAsText: (state, action) => {
      state.saveAsText = action.payload;
    },

    changeServerType: (state, action) => {
      state.serverType = action.payload;
    },

    setServerParam: (state, action) => {
      const {serverType, name, value} = action.payload;
      state.server[serverType] = {
        ...state.server[serverType],
        [name]: value,
      };
      state.isCapsDirty = true;
    },

    setServer: (state, action) => {
      const {server: incomingServer = {}, serverType} = action.payload;
      for (const serverName of Object.keys(state.server)) {
        if (incomingServer[serverName]) {
          state.server[serverName] = {
            ...state.server[serverName],
            ...incomingServer[serverName],
          };
        }
      }
      state.serverType = serverType || SERVER_TYPES.LOCAL;
    },

    getSessionsRequested: (state) => {
      state.gettingSessions = true;
    },

    getSessionsDone: (state, action) => {
      const sessions = action.payload;
      state.gettingSessions = false;
      state.attachSessId = sessions ? state.attachSessId : null;
      state.runningAppiumSessions = sessions || [];
    },

    enableDesiredCapsNameEditor: (state) => {
      state.isEditingDesiredCapsName = true;
      state.desiredCapsName = state.capsName;
    },

    abortDesiredCapsNameEditor: (state) => {
      state.isEditingDesiredCapsName = false;
      state.isDuplicateCapsName = false;
      state.desiredCapsName = null;
    },

    saveDesiredCapsName: (state, action) => {
      state.capsName = action.payload;
    },

    setDesiredCapsName: (state, action) => {
      state.desiredCapsName = action.payload;
    },

    enableDesiredCapsEditor: (state) => {
      state.isEditingDesiredCaps = true;
      state.rawDesiredCaps = JSON.stringify(
        // Translate the caps definition to a proper capabilities JS Object
        state.caps.reduce(
          (result, obj) => ({
            ...result,
            [obj.name]: obj.value,
          }),
          {},
        ),
        null,
        2,
      );
      state.isValidCapsJson = true;
      state.isValidatingCapsJson = false; // Don't start validating JSON until the user has attempted to save the JSON
    },

    abortDesiredCapsEditor: (state) => {
      state.isEditingDesiredCaps = false;
      state.rawDesiredCaps = null;
    },

    saveRawDesiredCaps: (state, action) => {
      state.isEditingDesiredCaps = false;
      state.caps = action.payload;
      state.isCapsDirty = true;
    },

    showDesiredCapsJsonError: (state, action) => {
      state.invalidCapsJsonReason = action.payload;
      state.isValidCapsJson = false;
      state.isValidatingCapsJson = true;
    },

    setRawDesiredCaps: (state, action) => {
      const {rawDesiredCaps, isValidCapsJson, invalidCapsJsonReason} = action.payload;
      state.rawDesiredCaps = rawDesiredCaps;
      state.isValidCapsJson = isValidCapsJson;
      state.invalidCapsJsonReason = invalidCapsJsonReason;
    },

    isAddingCloudProvider: (state, action) => {
      state.isAddingCloudProvider = action.payload;
    },

    setProviders: (state, action) => {
      state.visibleProviders = action.payload || [];
    },

    setAddVendorPrefixes: (state, action) => {
      state.addVendorPrefixes = action.payload;
    },

    setStateFromUrl: (state, action) => {
      const incomingState = action.payload;
      // The (sanitized) state from a link replaces the saved server state instead of merging into
      // it, so a session started from the link only uses the server the link itself describes and
      // never inherits saved cloud credentials
      Object.assign(state, omit(incomingState, ['server']));
      state.server = mergeServerState(structuredClone(INITIAL_STATE.server), incomingState.server || {});
      state.serverType = incomingState.serverType || INITIAL_STATE.serverType;
    },

    setCapabilityNameError: (state) => {
      state.isDuplicateCapsName = true;
    },

    setStateFromFile: (state, action) => {
      const sessionJSON = action.payload;
      // caps will always be defined as per parseSessionFileContents
      state.caps = sessionJSON.caps.map((cap) => ({
        id: getRandomId(),
        enabled: true,
        ...cap,
      }));
      // reset capsName since we now have an unnamed session
      state.capsName = null;
      state.server = {
        ...state.server,
        ...sessionJSON.server,
      };
      state.serverType = sessionJSON.serverType;
      state.visibleProviders = [...new Set([...state.visibleProviders, ...(sessionJSON.visibleProviders || [])])];
    },

    sessionUploadRequested: (state) => {
      state.isUploadingSessionFiles = true;
    },

    sessionUploadDone: (state) => {
      state.isUploadingSessionFiles = false;
    },
  },
});

export const {
  abortDesiredCapsEditor,
  abortDesiredCapsNameEditor,
  addCapability,
  changeServerType,
  deleteSavedSessionDone,
  deleteSavedSessionRequested,
  enableDesiredCapsEditor,
  enableDesiredCapsNameEditor,
  getSavedSessionsDone,
  getSavedSessionsRequested,
  getSessionsDone,
  getSessionsRequested,
  hideSaveAsModalRequested,
  isAddingCloudProvider,
  loadCapabilityTemplate,
  newSessionDone,
  newSessionLoading,
  newSessionRequested,
  removeCapability,
  saveAsModalRequested,
  saveDesiredCapsName,
  saveRawDesiredCaps,
  saveSessionDone,
  saveSessionRequested,
  sessionUploadDone,
  sessionUploadRequested,
  setAddVendorPrefixes,
  setCapabilityNameError,
  setCapabilityParam,
  setCapsAndServer,
  setDesiredCapsName,
  setProviders,
  setRawDesiredCaps,
  setSaveAsText,
  setServer,
  setServerParam,
  setStateFromFile,
  setStateFromUrl,
  showDesiredCapsJsonError,
  switchedTabs,
} = builderSlice.actions;

export default builderSlice.reducer;
