import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {rendered} = vi.hoisted(() => ({rendered: {buttons: [], tabs: []}}));

vi.mock('#local-polyfills', () => ({
  settings: {},
  openLink: vi.fn(),
}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));
vi.mock('../../app/common/renderer/utils/file-handling.js', () => ({downloadFile: vi.fn()}));
vi.mock('antd', async () => {
  const {createElement} = await import('react');
  const Passthrough = ({children}) => children ?? null;
  const Space = Object.assign(Passthrough, {Compact: Passthrough});
  const Splitter = Object.assign(({children}) => children, {Panel: Passthrough});
  return {
    Alert: ({title}) => createElement('div', null, title),
    Button: (props) => {
      rendered.buttons.push(props);
      return createElement(
        'button',
        {'aria-label': props['aria-label'], id: props.id, disabled: props.disabled},
        props.children,
      );
    },
    Card: ({title, extra, children}) => createElement('section', null, title, extra, children),
    Col: Passthrough,
    Divider: () => null,
    Flex: Passthrough,
    Input: () => null,
    Row: Passthrough,
    Space,
    Spin: Passthrough,
    Splitter,
    Table: ({columns, dataSource}) =>
      createElement(
        'table',
        null,
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            columns.map(({key, title}) => createElement('th', {key}, title)),
          ),
        ),
        createElement(
          'tbody',
          null,
          dataSource.map((row) =>
            createElement(
              'tr',
              {key: row.key},
              columns.map(({key, dataIndex, render}) => createElement('td', {key}, render(row[dataIndex]))),
            ),
          ),
        ),
      ),
    Tabs: ({items}) => {
      rendered.tabs = items;
      return createElement(
        'div',
        null,
        items.map(({key, label, children}) => createElement('section', {key}, label, children)),
      );
    },
    Tooltip: Passthrough,
  };
});
vi.mock('../../app/common/renderer/components/SessionInspector/Header/DeviceControls/DeviceControlsGroup.jsx', () => ({
  default: () => 'Device controls',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/Header/DriverControls/DriverControlsGroup.jsx', () => ({
  default: () => 'Driver controls',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/Header/ContextControlsGroup.jsx', () => ({
  default: () => 'Context controls',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/Header/SessionReloadButton.jsx', () => ({
  default: () => 'Session reload',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/Header/LocatorSearch/LocatorSearchModal.jsx', () => ({
  default: () => 'Locator search modal',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/CommandsTab/Commands.jsx', () => ({
  default: () => 'Live commands',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/GesturesTab/GestureEditor/GestureEditor.jsx', () => ({
  default: () => 'Gesture editor',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/GesturesTab/SavedGestures.jsx', () => ({
  default: () => 'Saved gestures',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/RecorderTab/Recorder.jsx', () => ({
  default: () => 'Live recorder',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/SessionInfoTab/SessionInfo.jsx', () => ({
  default: () => 'Live session information',
}));
vi.mock('../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTreeWrapper.jsx', () => ({
  default: () => 'Source tree',
}));

import HeaderButtons from '../../app/common/renderer/components/SessionInspector/Header/HeaderButtons.jsx';
import ScreenshotControls from '../../app/common/renderer/components/SessionInspector/Screenshot/ScreenshotControls.jsx';
import SessionInspectorTabs from '../../app/common/renderer/components/SessionInspector/SessionInspectorTabs.jsx';
import {SCREENSHOT_INTERACTION_MODE} from '../../app/common/renderer/constants/screenshot.js';
import {INSPECTOR_TABS, NATIVE_APP} from '../../app/common/renderer/constants/session-inspector.js';
import {downloadFile} from '../../app/common/renderer/utils/file-handling.js';

const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));
const button = (label) => rendered.buttons.find((props) => props['aria-label'] === label);
const buttonLabels = () => rendered.buttons.map((props) => props['aria-label']);

const baseProps = () => ({
  isSnapshot: true,
  featureCaps: {platformName: 'android', automationName: 'uiautomator2'},
  serverDetails: {},
  sessionSettings: {},
  sourceXML: '<hierarchy><Button text="Login"/></hierarchy>',
  screenshot: 'snapshot-png',
  showScreenshot: true,
  isUsingMjpegMode: false,
  screenshotInteractionMode: SCREENSHOT_INTERACTION_MODE.SELECT,
  selectedInspectorTab: INSPECTOR_TABS.SOURCE,
  currentContext: NATIVE_APP,
  selectedElementPath: '0',
  selectedElement: {
    path: '0',
    attributes: {text: 'Login', bounds: '[0,0][20,40]'},
    strategyMap: [
      ['accessibility id', 'sign-in'],
      ['xpath', '//Button'],
    ],
  },
  findElementsExecutionTimes: [],
  applyClientMethod: vi.fn(),
  exportSnapshot: vi.fn(),
  quitSessionAndReturn: vi.fn(),
});

describe('Snapshot inspection controls', () => {
  beforeEach(() => {
    rendered.buttons = [];
    rendered.tabs = [];
  });

  it('offers save and close without rendering live session header controls', () => {
    const props = baseProps();
    const markup = render(HeaderButtons, props);

    expect(buttonLabels()).toEqual(['Save Snapshot', 'Close Snapshot']);
    expect(button('Save Snapshot').disabled).toBeFalsy();
    button('Save Snapshot').onClick();
    button('Close Snapshot').onClick();
    expect(props.exportSnapshot).toHaveBeenCalledOnce();
    expect(props.quitSessionAndReturn).toHaveBeenCalledOnce();
    expect(props.applyClientMethod).not.toHaveBeenCalled();
    for (const control of [
      'Device controls',
      'Driver controls',
      'Context controls',
      'Session reload',
      'Locator search modal',
    ]) {
      expect(markup).not.toContain(control);
    }
  });

  it('keeps live header controls, recording, search and detach available for a session', () => {
    const markup = render(HeaderButtons, {...baseProps(), isSnapshot: false});

    expect(buttonLabels()).toEqual([
      'Save Snapshot',
      'refreshSource',
      'Search for element',
      'Start Recording',
      'detachFromSession',
      'Quit Session',
    ]);
    for (const control of [
      'Device controls',
      'Driver controls',
      'Context controls',
      'Session reload',
      'Locator search modal',
    ]) {
      expect(markup).toContain(control);
    }
  });

  it.each([
    {sourceXML: ''},
    {screenshot: ''},
    {sourceError: new Error('source unavailable')},
    {screenshotError: new Error('screenshot unavailable')},
    {isUsingMjpegMode: true},
    {methodCallInProgress: true},
  ])('does not allow saving incomplete, streaming or changing snapshot data: %o', (overrides) => {
    render(HeaderButtons, {...baseProps(), ...overrides});
    expect(button('Save Snapshot').disabled).toBeTruthy();
  });

  it('keeps selection, element handles and screenshot download without tap modes', () => {
    render(ScreenshotControls, baseProps());

    expect(buttonLabels()).toEqual(['Show Element Handles', 'Select Elements', 'Download Screenshot']);
    expect(button('Download Screenshot').disabled).toBeFalsy();
    button('Download Screenshot').onClick();
    expect(downloadFile).toHaveBeenCalledWith('data:image/png;base64,snapshot-png', expect.stringMatching(/\.png$/));
  });

  it('retains tap modes and capture-mode switching for a live session', () => {
    render(ScreenshotControls, {
      ...baseProps(),
      isSnapshot: false,
      serverDetails: {mjpegScreenshotUrl: 'http://localhost:9100'},
    });

    expect(buttonLabels()).toEqual([
      'useMjpegStream',
      'useScreenshotApi',
      'Show Element Handles',
      'Select Elements',
      'Tap By Element',
      'Tap/Swipe By Coordinates',
      'Download Screenshot',
    ]);
  });

  it('renders source, attributes and locators without live tabs or element interactions', () => {
    const props = baseProps();
    const markup = render(SessionInspectorTabs, props);

    expect(rendered.tabs.map(({key}) => key)).toEqual([INSPECTOR_TABS.SOURCE]);
    expect(rendered.tabs[0].disabled).toBe(false);
    for (const localContent of [
      'Source tree',
      'Find By',
      'Selector',
      'sign-in',
      '//Button',
      'Attribute',
      'Login',
      'Box Model',
    ]) {
      expect(markup).toContain(localContent);
    }
    for (const remoteContent of [
      'Live commands',
      'Saved gestures',
      'Live recorder',
      'Live session information',
      'elementId',
    ]) {
      expect(markup).not.toContain(remoteContent);
    }
    expect(buttonLabels()).toEqual([
      'Copy XML Source to Clipboard',
      'Download Source as .XML File',
      'Copy Attributes to Clipboard',
    ]);
    button('Download Source as .XML File').onClick();
    expect(downloadFile).toHaveBeenCalledWith(
      'data:application/xml;charset=utf-8,' + encodeURIComponent(props.sourceXML),
      expect.stringMatching(/\.xml$/),
    );
    expect(props.applyClientMethod).not.toHaveBeenCalled();
  });

  it('retains live tabs, element interaction buttons, timing and element screenshots', () => {
    const markup = render(SessionInspectorTabs, {...baseProps(), isSnapshot: false, selectedElementId: 'live-element'});

    expect(rendered.tabs.map(({key}) => key)).toEqual(Object.values(INSPECTOR_TABS));
    for (const liveContent of [
      'Live commands',
      'Saved gestures',
      'Live recorder',
      'Live session information',
      'live-element',
    ]) {
      expect(markup).toContain(liveContent);
    }
    expect(buttonLabels()).toEqual([
      'Copy XML Source to Clipboard',
      'Download Source as .XML File',
      'Copy Attributes to Clipboard',
      'Download Screenshot',
      'Tap',
      'Send Keys',
      'Clear',
      'Get Timing',
    ]);
  });
});
