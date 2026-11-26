import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';

const {savedSettings, wdNewSession, downloadFileMock, readTextFromUploadedFilesMock, loadSessionFileIfOpenedMock} =
  vi.hoisted(() => ({
    savedSettings: new Map(),
    wdNewSession: vi.fn(),
    downloadFileMock: vi.fn(),
    readTextFromUploadedFilesMock: vi.fn(),
    loadSessionFileIfOpenedMock: vi.fn().mockResolvedValue(null),
  }));

vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn()},
}));
vi.mock('../../app/common/renderer/utils/notification.js', () => ({
  notification: {error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn()},
}));
vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
    t: (key) => key,
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key) => key}),
}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  getSetting: vi.fn((key) => Promise.resolve(savedSettings.has(key) ? savedSettings.get(key) : null)),
  setSetting: vi.fn((key, value) => {
    savedSettings.set(key, value);
    return Promise.resolve();
  }),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  localesPath: '',
  loadSessionFileIfOpened: loadSessionFileIfOpenedMock,
}));
vi.mock('../../app/common/renderer/lib/appium/session-starter.js', () => ({
  default: {
    newSession: wdNewSession,
    attachToSession: vi.fn(),
  },
}));
vi.mock('../../app/common/renderer/utils/file-handling.js', () => ({
  downloadFile: downloadFileMock,
  readTextFromUploadedFiles: readTextFromUploadedFilesMock,
}));

function createStoreHarness(actions, builderReducer, inspectorReducer) {
  let builderState = builderReducer(undefined, {type: '@@INIT'});
  let inspectorState = inspectorReducer(undefined, {type: '@@INIT'});

  const dispatch = (action) => {
    builderState = builderReducer(builderState, action);
    inspectorState = inspectorReducer(inspectorState, action);
  };
  const getState = () => ({builder: builderState, inspector: inspectorState});

  return {
    dispatch,
    getState,
    getBuilder: () => builderState,
    getInspector: () => inspectorState,
    run: (thunk) => thunk(dispatch, getState),
  };
}

describe('SessionBuilder environment variables', function () {
  let actions;
  let builderReducer;
  let inspectorReducer;
  let EnvironmentVariables;

  beforeAll(async () => {
    actions = await import('../../app/common/renderer/actions/SessionBuilder.js');
    builderReducer = (await import('../../app/common/renderer/reducers/SessionBuilder.js')).default;
    inspectorReducer = (await import('../../app/common/renderer/reducers/SessionInspector.js')).default;
    EnvironmentVariables = (
      await import('../../app/common/renderer/components/SessionBuilder/EnvironmentVariablesTab/EnvironmentVariables.jsx')
    ).default;
  }, 60_000);

  beforeEach(() => {
    savedSettings.clear();
    wdNewSession.mockReset();
    downloadFileMock.mockReset();
    readTextFromUploadedFilesMock.mockReset();
    loadSessionFileIfOpenedMock.mockReset();
    loadSessionFileIfOpenedMock.mockResolvedValue(null);
  });

  it('adds, updates, and removes environment variables while marking session dirty', function () {
    const store = createStoreHarness(actions, builderReducer, inspectorReducer);

    store.run(actions.addEnvVar());
    expect(store.getBuilder().envVars).toHaveLength(1);
    expect(store.getBuilder().envVars[0]).toMatchObject({name: '', value: '', isSecret: true});
    expect(store.getBuilder().isCapsDirty).toBe(true);

    const {id} = store.getBuilder().envVars[0];
    store.run(actions.setEnvVarParam(id, 'name', 'XCODE_ORG_ID'));
    store.run(actions.setEnvVarParam(id, 'value', 'TEAM123'));
    store.run(actions.setEnvVarParam(id, 'isSecret', false));

    expect(store.getBuilder().envVars[0]).toEqual({
      id,
      name: 'XCODE_ORG_ID',
      value: 'TEAM123',
      isSecret: false,
    });

    store.run(actions.removeEnvVar(id));
    expect(store.getBuilder().envVars).toEqual([]);
    expect(store.getBuilder().isCapsDirty).toBe(true);
  });

  it('persists per-session environment variables across save, rename, and switching saved sessions', async function () {
    const store = createStoreHarness(actions, builderReducer, inspectorReducer);
    const server = store.getBuilder().server;
    const iosCaps = [
      {id: 'c1', type: 'text', name: 'platformName', value: 'iOS', enabled: true},
      {id: 'c2', type: 'text', name: 'appium:xcodeOrgId', value: '${XCODE_ORG_ID}', enabled: true},
    ];
    const iosEnvVars = [{id: 'e1', name: 'XCODE_ORG_ID', value: 'TEAM123', isSecret: true}];

    await store.run(
      actions.saveSession({
        server,
        serverType: 'remote',
        caps: iosCaps,
        envVars: iosEnvVars,
        name: 'iOS Dev',
      }),
    );

    const savedAfterCreate = store.getBuilder().savedSessions;
    expect(savedAfterCreate).toHaveLength(1);
    expect(savedAfterCreate[0].envVars).toEqual(iosEnvVars);
    expect(store.getBuilder().isCapsDirty).toBeUndefined();

    // Renaming the saved capability set preserves its envVars
    store.run(actions.startDesiredCapsNameEditor());
    store.run(actions.setDesiredCapsName('iOS Team'));
    store.run(actions.saveDesiredCapsName());
    await vi.waitFor(() => {
      expect(store.getBuilder().savedSessions[0].name).toBe('iOS Team');
    });
    expect(store.getBuilder().savedSessions[0].envVars).toEqual(iosEnvVars);

    // Selecting a legacy saved session without envVars clears current envVars
    store.run(
      actions.setCapsAndServer(
        server,
        'remote',
        [{type: 'text', name: 'platformName', value: 'Android', enabled: true}],
        'legacy-uuid',
        'Legacy Android',
        [],
      ),
    );
    expect(store.getBuilder().envVars).toEqual([]);

    // Selecting back the saved iOS session restores its envVars
    const iosSession = store.getBuilder().savedSessions[0];
    store.run(
      actions.setCapsAndServer(
        iosSession.server,
        iosSession.serverType,
        iosSession.caps,
        iosSession.uuid,
        iosSession.name,
        iosSession.envVars || [],
      ),
    );
    expect(store.getBuilder().envVars).toEqual(iosEnvVars);

    // Overwriting an existing saved session with empty envVars clears stored envVars
    await store.run(
      actions.saveSession({
        server: iosSession.server,
        serverType: iosSession.serverType,
        caps: iosSession.caps,
        envVars: [],
        name: iosSession.name,
        uuid: iosSession.uuid,
      }),
    );
    expect(store.getBuilder().savedSessions[0].envVars).toEqual([]);
    expect(store.getBuilder().envVars).toEqual([]);
  });

  it('interpolates capabilities for WebDriver while keeping placeholders in builder state and omitting secrets from sessionDetails', async function () {
    const store = createStoreHarness(actions, builderReducer, inspectorReducer);
    wdNewSession.mockResolvedValue({capabilities: {platformName: 'iOS'}});

    const caps = [
      {id: 'c1', type: 'text', name: 'platformName', value: '${PLATFORM}', enabled: true},
      {id: 'c2', type: 'text', name: 'xcodeOrgId', value: '${XCODE_ORG_ID}', enabled: true},
      {id: 'c3', type: 'text', name: 'appium:app', value: 'https://${HOST}/app.ipa', enabled: true},
      {
        id: 'c4',
        type: 'object',
        name: 'appium:nested',
        value: '{"org":"${XCODE_ORG_ID}","env":"${HOST}"}',
        enabled: true,
      },
    ];
    const envVars = [
      {id: 'e1', name: 'PLATFORM', value: 'iOS', isSecret: false},
      {id: 'e2', name: 'XCODE_ORG_ID', value: 'SECRET_TEAM', isSecret: true},
      {id: 'e3', name: 'HOST', value: 'builds.example.com', isSecret: false},
    ];

    store.run(actions.setCapsAndServer(store.getBuilder().server, 'remote', caps, 'u1', 'iOS Session', envVars));
    const started = await store.run(actions.newSession(structuredClone(store.getBuilder().caps)));

    expect(started).toBe(true);
    expect(wdNewSession).toHaveBeenCalledTimes(1);

    // WebDriver receives fully interpolated capabilities (plus custom iOS cap derived from interpolated platformName)
    const sentCaps = wdNewSession.mock.calls[0][1];
    expect(sentCaps).toMatchObject({
      platformName: 'iOS',
      'appium:xcodeOrgId': 'SECRET_TEAM',
      'appium:app': 'https://builds.example.com/app.ipa',
      'appium:nested': {org: 'SECRET_TEAM', env: 'builds.example.com'},
      'appium:includeSafariInWebviews': true,
    });

    // Builder state keeps placeholders and retains envVars even after auto-adding vendor prefixes
    expect(store.getBuilder().caps.find((c) => c.name === 'appium:xcodeOrgId').value).toBe('${XCODE_ORG_ID}');
    expect(store.getBuilder().envVars).toEqual(envVars);

    // Session inspector details (used by Recorder & Session Info code snippets) expand non-secrets but keep secret placeholders
    expect(store.getInspector().sessionCaps).toMatchObject({
      platformName: 'iOS',
      'appium:xcodeOrgId': '${XCODE_ORG_ID}',
      'appium:app': 'https://builds.example.com/app.ipa',
      'appium:nested': {org: '${XCODE_ORG_ID}', env: 'builds.example.com'},
    });
  });

  it('strips secret values on export and restores envVars on session file import', async function () {
    const store = createStoreHarness(actions, builderReducer, inspectorReducer);
    const server = store.getBuilder().server;

    await store.run(
      actions.exportSavedSession({
        name: 'Shared iOS',
        serverType: 'remote',
        server,
        caps: [{id: 'c1', type: 'text', name: 'appium:xcodeOrgId', value: '${XCODE_ORG_ID}', enabled: true}],
        envVars: [
          {id: 'e1', name: 'XCODE_ORG_ID', value: 'TOP_SECRET', isSecret: true},
          {id: 'e2', name: 'APP_ENV', value: 'qa', isSecret: false},
        ],
      }),
    );

    expect(downloadFileMock).toHaveBeenCalledTimes(1);
    const [href, fileName] = downloadFileMock.mock.calls[0];
    expect(fileName).toBe('Shared iOS.appiumsession');
    const exportedJson = decodeURIComponent(href.replace(/^data:text\/json;charset=utf-8,/, ''));
    const parsedExport = JSON.parse(exportedJson);
    expect(parsedExport.envVars).toEqual([
      {name: 'XCODE_ORG_ID', value: '', isSecret: true},
      {name: 'APP_ENV', value: 'qa', isSecret: false},
    ]);

    // Importing the exported file saves its envVars with secret placeholder intact
    readTextFromUploadedFilesMock.mockResolvedValue([{fileName, content: exportedJson}]);
    await store.run(actions.importSessionFiles([{}]));

    expect(store.getBuilder().savedSessions).toHaveLength(1);
    expect(store.getBuilder().savedSessions[0].envVars).toHaveLength(2);
    expect(store.getBuilder().savedSessions[0].envVars[0]).toMatchObject({
      name: 'XCODE_ORG_ID',
      value: '',
      isSecret: true,
    });
    expect(store.getBuilder().savedSessions[0].envVars[1]).toMatchObject({
      name: 'APP_ENV',
      value: 'qa',
      isSecret: false,
    });
  });

  it('omits envVars from exported file when session has none', async function () {
    const store = createStoreHarness(actions, builderReducer, inspectorReducer);
    await store.run(
      actions.exportSavedSession({
        name: 'Plain Session',
        serverType: 'remote',
        server: store.getBuilder().server,
        caps: [{id: 'c1', type: 'text', name: 'platformName', value: 'Android', enabled: true}],
        envVars: [],
      }),
    );

    const [href] = downloadFileMock.mock.calls[0];
    const parsedExport = JSON.parse(decodeURIComponent(href.replace(/^data:text\/json;charset=utf-8,/, '')));
    expect(parsedExport).not.toHaveProperty('envVars');
  });

  it('loads envVars when opening a session file via initFromSessionFile', async function () {
    const store = createStoreHarness(actions, builderReducer, inspectorReducer);
    loadSessionFileIfOpenedMock.mockResolvedValue(
      JSON.stringify({
        version: 2,
        name: 'Opened Session',
        server: {remote: {hostname: '127.0.0.1'}, advanced: {}},
        caps: [{type: 'text', name: 'appium:xcodeOrgId', value: '${XCODE_ORG_ID}'}],
        envVars: [
          {name: 'XCODE_ORG_ID', value: '', isSecret: true},
          {name: 'APP_ENV', value: 'prod', isSecret: false},
        ],
      }),
    );

    await store.run(actions.initFromSessionFile());

    expect(store.getBuilder().envVars).toHaveLength(2);
    expect(store.getBuilder().envVars[0]).toMatchObject({name: 'XCODE_ORG_ID', value: '', isSecret: true});
    expect(store.getBuilder().envVars[1]).toMatchObject({name: 'APP_ENV', value: 'prod', isSecret: false});
  });

  it('renders secret variables with password inputs and non-secret variables as plain text inputs', function () {
    const html = renderToStaticMarkup(
      createElement(EnvironmentVariables, {
        envVars: [
          {id: 'sec-1', name: 'XCODE_ORG_ID', value: 'TEAM_SECRET', isSecret: true},
          {id: 'pub-1', name: 'APP_ENV', value: 'staging', isSecret: false},
        ],
        addEnvVar: vi.fn(),
        removeEnvVar: vi.fn(),
        setEnvVarParam: vi.fn(),
      }),
    );

    expect(html).toContain('id="envVarName_sec-1"');
    expect(html).toContain('id="envVarValue_sec-1"');
    expect(html).toContain('type="password"');
    expect(html).toContain('id="envVarName_pub-1"');
    expect(html).toContain('value="staging"');
    expect(html).toContain('id="btnAddEnvVar"');
  });
});
