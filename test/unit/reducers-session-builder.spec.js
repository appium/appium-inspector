import {describe, expect, it} from 'vitest';

import {SERVER_TYPES, SESSION_BUILDER_TABS} from '../../app/common/renderer/constants/session-builder.js';
import builder, {
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
} from '../../app/common/renderer/reducers/SessionBuilder.js';

describe('reducers/SessionBuilder', function () {
  it('should initialize with default builder state', function () {
    const state = builder(undefined, {type: '@@INIT'});
    expect(state.tabKey).toBe(SESSION_BUILDER_TABS.CAPS_BUILDER);
    expect(state.serverType).toBe(SERVER_TYPES.REMOTE);
    expect(state.server[SERVER_TYPES.SAUCE]).toEqual({dataCenter: 'us-west-1'});
    expect(state.caps).toHaveLength(1);
    expect(state.caps[0]).toMatchObject({type: 'text', enabled: true});
    expect(state.isCapsDirty).toBe(true);
    expect(state.addVendorPrefixes).toBe(true);
  });

  it('should transition new session request/loading/done flags cleanly', function () {
    let state = builder(undefined, newSessionRequested());
    expect(state.newSessionRequested).toBe(true);

    state = builder(state, newSessionLoading());
    expect(state.newSessionLoading).toBe(true);
    expect(state).not.toHaveProperty('newSessionRequested');

    state = builder(state, newSessionDone());
    expect(state).not.toHaveProperty('newSessionLoading');
  });

  it('should add, update, remove capabilities and load templates', function () {
    let state = builder(undefined, addCapability());
    expect(state.caps).toHaveLength(2);
    const secondId = state.caps[1].id;

    state = builder(state, setCapabilityParam({id: secondId, name: 'name', value: 'platformName'}));
    state = builder(state, setCapabilityParam({id: secondId, name: 'value', value: 'Android'}));
    expect(state.caps[1]).toMatchObject({id: secondId, name: 'platformName', value: 'Android'});
    expect(state.isCapsDirty).toBe(true);

    state = builder(state, removeCapability(secondId));
    expect(state.caps).toHaveLength(1);

    const templateCaps = [{id: 'tpl-1', enabled: true, type: 'text', name: 'deviceName', value: 'Pixel'}];
    state = builder(state, loadCapabilityTemplate(templateCaps));
    expect(state.caps).toEqual(templateCaps);
    expect(state.isEditingDesiredCaps).toBe(false);
    expect(state.rawDesiredCaps).toBeNull();
    expect(state.isValidCapsJson).toBe(true);
    expect(state.isValidatingCapsJson).toBe(false);
    expect(state.invalidCapsJsonReason).toBeNull();
  });

  it('should handle save session modals, saved session lifecycle, tabs, and deletion', function () {
    let state = builder(undefined, saveAsModalRequested());
    expect(state.showSaveAsModal).toBe(true);

    state = builder(state, setSaveAsText('My Session'));
    expect(state.saveAsText).toBe('My Session');

    state = builder(state, setCapabilityNameError());
    expect(state.isDuplicateCapsName).toBe(true);

    state = builder(state, hideSaveAsModalRequested());
    expect(state.isDuplicateCapsName).toBe(false);
    expect(state).not.toHaveProperty('saveAsText');
    expect(state).not.toHaveProperty('showSaveAsModal');

    state = builder(state, saveAsModalRequested());
    state = builder(state, saveSessionRequested());
    expect(state.saveSessionRequested).toBe(true);
    expect(state).not.toHaveProperty('showSaveAsModal');

    state = builder(
      state,
      setCapsAndServer({
        server: {sauce: {username: 'u'}},
        serverType: SERVER_TYPES.SAUCE,
        caps: [{name: 'platformName', value: 'iOS', type: 'text'}],
        uuid: 'uuid-1',
        name: 'Saved',
      }),
    );
    expect(state.capsUUID).toBe('uuid-1');
    expect(state.capsName).toBe('Saved');
    expect(state.visibleProviders).toContain(SERVER_TYPES.SAUCE);
    expect(state).not.toHaveProperty('isCapsDirty');

    state = builder(state, saveSessionDone());
    expect(state.isEditingDesiredCapsName).toBe(false);
    expect(state.isDuplicateCapsName).toBe(false);
    expect(state).not.toHaveProperty('saveSessionRequested');
    expect(state).not.toHaveProperty('saveAsText');

    state = builder(state, getSavedSessionsRequested());
    expect(state.getSavedSessionsRequested).toBe(true);

    state = builder(state, getSavedSessionsDone(null));
    expect(state.savedSessions).toEqual([]);
    expect(state).not.toHaveProperty('getSavedSessionsRequested');

    state = builder(state, deleteSavedSessionRequested());
    expect(state.deletingSession).toBe(true);
    state = builder(state, deleteSavedSessionDone());
    expect(state.deletingSession).toBe(false);
    expect(state.capsUUID).toBeNull();
    expect(state.capsName).toBeNull();

    state = builder(state, switchedTabs(SESSION_BUILDER_TABS.SAVED_SESSIONS));
    expect(state.tabKey).toBe(SESSION_BUILDER_TABS.SAVED_SESSIONS);
  });

  it('should manage server parameters, server state merging, and running sessions', function () {
    let state = builder(undefined, changeServerType(SERVER_TYPES.LOCAL));
    expect(state.serverType).toBe(SERVER_TYPES.LOCAL);

    state = builder(state, setServerParam({serverType: SERVER_TYPES.REMOTE, name: 'port', value: '4723'}));
    expect(state.server[SERVER_TYPES.REMOTE].port).toBe('4723');

    state = builder(state, setServer({server: {sauce: {username: 'alice'}}, serverType: undefined}));
    expect(state.server[SERVER_TYPES.SAUCE]).toEqual({dataCenter: 'us-west-1', username: 'alice'});
    expect(state.serverType).toBe(SERVER_TYPES.LOCAL);

    state = builder(state, setStateFromUrl({attachSessId: 'sess-1', caps: [], serverType: SERVER_TYPES.REMOTE}));
    state = builder(state, getSessionsRequested());
    expect(state.gettingSessions).toBe(true);

    state = builder(state, getSessionsDone([{id: 'sess-1'}]));
    expect(state.gettingSessions).toBe(false);
    expect(state.attachSessId).toBe('sess-1');
    expect(state.runningAppiumSessions).toEqual([{id: 'sess-1'}]);

    state = builder(state, getSessionsDone(undefined));
    expect(state.attachSessId).toBeNull();
    expect(state.runningAppiumSessions).toEqual([]);
  });

  it('should handle desired caps editors, providers, and state from URL/file cleanly', function () {
    let state = builder(
      undefined,
      setCapsAndServer({
        server: {},
        serverType: SERVER_TYPES.REMOTE,
        caps: [{name: 'platformName', value: 'Android', type: 'text'}],
        uuid: 'u1',
        name: 'Android Caps',
      }),
    );

    state = builder(state, enableDesiredCapsNameEditor());
    expect(state.isEditingDesiredCapsName).toBe(true);
    expect(state.desiredCapsName).toBe('Android Caps');

    state = builder(state, setDesiredCapsName('Renamed'));
    state = builder(state, saveDesiredCapsName('Renamed'));
    expect(state.capsName).toBe('Renamed');

    state = builder(state, abortDesiredCapsNameEditor());
    expect(state.isEditingDesiredCapsName).toBe(false);
    expect(state.desiredCapsName).toBeNull();

    state = builder(state, enableDesiredCapsEditor());
    expect(state.isEditingDesiredCaps).toBe(true);
    expect(JSON.parse(state.rawDesiredCaps)).toEqual({platformName: 'Android'});

    state = builder(
      state,
      setRawDesiredCaps({rawDesiredCaps: '{bad', isValidCapsJson: false, invalidCapsJsonReason: 'Unexpected token'}),
    );
    expect(state.isValidCapsJson).toBe(false);

    state = builder(state, showDesiredCapsJsonError('Bad JSON'));
    expect(state.invalidCapsJsonReason).toBe('Bad JSON');
    expect(state.isValidatingCapsJson).toBe(true);

    state = builder(state, saveRawDesiredCaps([{name: 'platformName', value: 'iOS', type: 'text'}]));
    expect(state.isEditingDesiredCaps).toBe(false);
    expect(state.isCapsDirty).toBe(true);

    state = builder(state, enableDesiredCapsEditor());
    state = builder(state, abortDesiredCapsEditor());
    expect(state.isEditingDesiredCaps).toBe(false);
    expect(state.rawDesiredCaps).toBeNull();

    state = builder(state, isAddingCloudProvider(true));
    expect(state.isAddingCloudProvider).toBe(true);
    state = builder(state, setProviders([SERVER_TYPES.BROWSERSTACK]));
    expect(state.visibleProviders).toEqual([SERVER_TYPES.BROWSERSTACK]);
    state = builder(state, setAddVendorPrefixes(false));
    expect(state.addVendorPrefixes).toBe(false);

    state = builder(state, sessionUploadRequested());
    expect(state.isUploadingSessionFiles).toBe(true);
    state = builder(state, sessionUploadDone());
    expect(state.isUploadingSessionFiles).toBe(false);

    state = builder(
      state,
      setStateFromFile({
        caps: [{name: 'platformName', value: 'Android', type: 'text'}],
        server: {sauce: {username: 'u2'}},
        serverType: SERVER_TYPES.SAUCE,
        visibleProviders: [SERVER_TYPES.SAUCE],
      }),
    );
    expect(state.capsName).toBeNull();
    expect(state.server[SERVER_TYPES.SAUCE]).toEqual({username: 'u2'});
    expect(state.visibleProviders).toEqual([SERVER_TYPES.BROWSERSTACK, SERVER_TYPES.SAUCE]);

    // Repeated setStateFromUrl must still replace server cleanly without mutating INITIAL_STATE.server
    state = builder(state, setStateFromUrl({serverType: SERVER_TYPES.REMOTE, server: {remote: {hostname: 'h1'}}}));
    expect(state.server[SERVER_TYPES.SAUCE]).toEqual({dataCenter: 'us-west-1'});
    expect(state.server[SERVER_TYPES.REMOTE]).toEqual({hostname: 'h1'});
  });
});
