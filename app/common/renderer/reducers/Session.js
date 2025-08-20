import _ from 'lodash';

import {
  ABORT_DESIRED_CAPS_EDITOR,
  ABORT_DESIRED_CAPS_NAME_EDITOR,
  ADD_CAPABILITY,
  CHANGE_SERVER_TYPE,
  DELETE_SAVED_SESSION_DONE,
  DELETE_SAVED_SESSION_REQUESTED,
  ENABLE_DESIRED_CAPS_EDITOR,
  ENABLE_DESIRED_CAPS_NAME_EDITOR,
  GET_SAVED_SESSIONS_DONE,
  GET_SAVED_SESSIONS_REQUESTED,
  GET_SESSIONS_DONE,
  GET_SESSIONS_REQUESTED,
  HIDE_SAVE_AS_MODAL_REQUESTED,
  IS_ADDING_CLOUD_PROVIDER,
  NEW_SESSION_DONE,
  NEW_SESSION_LOADING,
  NEW_SESSION_REQUESTED,
  REMOVE_CAPABILITY,
  SAVE_AS_MODAL_REQUESTED,
  SAVE_DESIRED_CAPS_NAME,
  SAVE_RAW_DESIRED_CAPS,
  SAVE_SESSION_DONE,
  SAVE_SESSION_REQUESTED,
  SET_ADD_VENDOR_PREFIXES,
  SET_ATTACH_SESS_ID,
  SET_CAPABILITY_NAME_ERROR,
  SET_CAPABILITY_PARAM,
  SET_CAPS_AND_SERVER,
  SET_DESIRED_CAPS_NAME,
  SET_PROVIDERS,
  SET_RAW_DESIRED_CAPS,
  SET_SAVE_AS_TEXT,
  SET_SERVER,
  SET_SERVER_PARAM,
  SET_STATE_FROM_FILE,
  SET_STATE_FROM_URL,
  SHOW_DESIRED_CAPS_JSON_ERROR,
  SWITCHED_TABS,
} from '../actions/Session';
import {SERVER_TYPES, SESSION_BUILDER_TABS} from '../constants/session-builder';

const visibleProviders = []; // Pull this from the VISIBLE_PROVIDERS setting

const server = {};
for (const serverType of _.values(SERVER_TYPES)) {
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
};

let nextState;

export default function session(state = INITIAL_STATE, action) {
  switch (action.type) {
    case NEW_SESSION_REQUESTED:
      return {
        ...state,
        newSessionRequested: true,
      };

    case NEW_SESSION_LOADING:
      nextState = {
        ...state,
        newSessionLoading: true,
      };
      return _.omit(nextState, 'newSessionRequested');

    case NEW_SESSION_DONE:
      return _.omit(state, 'newSessionLoading');

    case ADD_CAPABILITY:
      return {
        ...state,
        caps: [...state.caps, {type: 'text', enabled: true}],
      };

    case REMOVE_CAPABILITY:
      return {
        ...state,
        caps: state.caps.filter((cap, index) => index !== action.index),
        isCapsDirty: true,
      };

    case SET_CAPABILITY_PARAM:
      return {
        ...state,
        isCapsDirty: true,
        caps: state.caps.map((cap, index) =>
          index !== action.index
            ? cap
            : {
                ...cap,
                [action.name]: action.value,
              },
        ),
      };

    case SET_CAPS_AND_SERVER:
      nextState = {
        ...state,
        server: action.server,
        serverType: action.serverType,
        caps: action.caps.map((cap) => ({
          ...cap,
          enabled: cap.enabled ?? true,
        })),
        capsUUID: action.uuid,
        capsName: action.name,
      };
      return _.omit(nextState, 'isCapsDirty');

    case SAVE_SESSION_REQUESTED:
      nextState = {
        ...state,
        saveSessionRequested: true,
      };
      return _.omit(nextState, 'showSaveAsModal');

    case SAVE_SESSION_DONE:
      nextState = {
        ...state,
        isEditingDesiredCapsName: false,
        isDuplicateCapsName: false,
      };
      return _.omit(nextState, ['saveSessionRequested', 'saveAsText']);

    case GET_SAVED_SESSIONS_REQUESTED:
      return {
        ...state,
        getSavedSessionsRequested: true,
      };

    case GET_SAVED_SESSIONS_DONE:
      nextState = {
        ...state,
        savedSessions: action.savedSessions || [],
      };
      return _.omit(nextState, 'getSavedSessionsRequested');

    case DELETE_SAVED_SESSION_REQUESTED:
      return {
        ...state,
        deletingSession: true,
      };

    case DELETE_SAVED_SESSION_DONE:
      return {
        ...state,
        deletingSession: false,
        capsUUID: null,
        capsName: null,
      };

    case SWITCHED_TABS:
      return {
        ...state,
        tabKey: action.key,
      };

    case SAVE_AS_MODAL_REQUESTED:
      return {
        ...state,
        showSaveAsModal: true,
      };

    case HIDE_SAVE_AS_MODAL_REQUESTED:
      nextState = {
        ...state,
        isDuplicateCapsName: false,
      };
      return _.omit(nextState, ['saveAsText', 'showSaveAsModal']);

    case SET_SAVE_AS_TEXT:
      return {
        ...state,
        saveAsText: action.saveAsText,
      };

    case CHANGE_SERVER_TYPE:
      return {
        ...state,
        serverType: action.serverType,
      };

    case SET_SERVER_PARAM:
      return {
        ...state,
        server: {
          ...state.server,
          [action.serverType]: {
            ...state.server[action.serverType],
            [action.name]: action.value,
          },
        },
      };

    case SET_SERVER:
      return {
        ...state,
        server: {
          ...(function extendCurrentServerStateWithNewServerState(
            currentServerState,
            newServerState,
          ) {
            // Copy current server state and extend it with new server state
            const nextServerState = _.cloneDeep(currentServerState || {});

            // Extend each server (sauce, remote, kobiton, etc...)
            for (let serverName of _.keys(nextServerState)) {
              nextServerState[serverName] = {
                ...(nextServerState[serverName] || {}),
                ...(newServerState[serverName] || {}),
              };
            }
            return nextServerState;
          })(state.server, action.server),
        },
        serverType: action.serverType || SERVER_TYPES.LOCAL,
      };

    case SET_ATTACH_SESS_ID:
      return {
        ...state,
        attachSessId: action.attachSessId,
      };

    case GET_SESSIONS_REQUESTED:
      return {
        ...state,
        gettingSessions: true,
      };

    case GET_SESSIONS_DONE: {
      return {
        ...state,
        gettingSessions: false,
        attachSessId: action.sessions ? state.attachSessId : null,
        runningAppiumSessions: action.sessions || [],
      };
    }

    case ENABLE_DESIRED_CAPS_NAME_EDITOR:
      return {
        ...state,
        isEditingDesiredCapsName: true,
        desiredCapsName: state.capsName,
      };

    case ABORT_DESIRED_CAPS_NAME_EDITOR:
      return {
        ...state,
        isEditingDesiredCapsName: false,
        isDuplicateCapsName: false,
        desiredCapsName: null,
      };

    case SAVE_DESIRED_CAPS_NAME:
      return {
        ...state,
        capsName: action.name,
      };

    case SET_DESIRED_CAPS_NAME:
      return {
        ...state,
        desiredCapsName: action.desiredCapsName,
      };

    case ENABLE_DESIRED_CAPS_EDITOR:
      return {
        ...state,
        isEditingDesiredCaps: true,
        rawDesiredCaps: JSON.stringify(
          // Translate the caps definition to a proper capabilities JS Object
          _.reduce(
            state.caps,
            (result, obj) => ({
              ...result,
              [obj.name]: obj.value,
            }),
            {},
          ),
          null,
          2,
        ),
        isValidCapsJson: true,
        isValidatingCapsJson: false, // Don't start validating JSON until the user has attempted to save the JSON
      };

    case ABORT_DESIRED_CAPS_EDITOR:
      return {
        ...state,
        isEditingDesiredCaps: false,
        rawDesiredCaps: null,
      };

    case SAVE_RAW_DESIRED_CAPS:
      return {
        ...state,
        isEditingDesiredCaps: false,
        caps: action.caps,
        isCapsDirty: true,
      };

    case SHOW_DESIRED_CAPS_JSON_ERROR:
      return {
        ...state,
        invalidCapsJsonReason: action.message,
        isValidCapsJson: false,
        isValidatingCapsJson: true,
      };

    case SET_RAW_DESIRED_CAPS:
      return {
        ...state,
        rawDesiredCaps: action.rawDesiredCaps,
        isValidCapsJson: action.isValidCapsJson,
        invalidCapsJsonReason: action.invalidCapsJsonReason,
      };

    case IS_ADDING_CLOUD_PROVIDER:
      return {
        ...state,
        isAddingCloudProvider: action.isAddingProvider,
      };

    case SET_PROVIDERS:
      return {
        ...state,
        visibleProviders: action.providers || [],
      };

    case SET_ADD_VENDOR_PREFIXES:
      return {
        ...state,
        addVendorPrefixes: action.addVendorPrefixes,
      };

    case SET_STATE_FROM_URL:
      return {
        ...state,
        server: {
          ...state.server,
          ...(action.state.server || {}),
        },
        ..._.omit(action.state, ['server']),
      };

    case SET_CAPABILITY_NAME_ERROR:
      return {
        ...state,
        isDuplicateCapsName: true,
      };

    case SET_STATE_FROM_FILE:
      return {
        ...state,
        caps: action.sessionJSON.caps || [],
        server: {
          ...state.server,
          ...action.sessionJSON.server,
        },
        serverType: action.sessionJSON.serverType,
        visibleProviders: action.sessionJSON.visibleProviders || [],
      };

    default:
      return {...state};
  }
}
