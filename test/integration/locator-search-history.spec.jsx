import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {savedSettings, rendered} = vi.hoisted(() => ({
  savedSettings: new Map(),
  rendered: {modal: null, form: null, buttons: []},
}));

vi.mock('#local-polyfills', () => ({
  settings: {
    has: (key) => savedSettings.has(key),
    get: (key) => savedSettings.get(key),
    set: (key, value) => savedSettings.set(key, value),
  },
}));
vi.mock('antd', () => ({
  Button: (props) => {
    rendered.buttons.push(props);
    return props.children ?? null;
  },
  Col: ({children}) => children,
  Modal: (props) => {
    rendered.modal = props;
    return createElement('div', null, props.footer, props.children);
  },
  Row: ({children}) => children,
  Space: Object.assign(({children}) => children, {Compact: ({children}) => children}),
  Tooltip: ({children}) => children,
}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));
vi.mock('../../app/common/renderer/components/SessionInspector/Header/LocatorSearch/LocatorSearchForm.jsx', () => ({
  default: (props) => {
    rendered.form = props;
    return null;
  },
}));
vi.mock(
  '../../app/common/renderer/components/SessionInspector/Header/LocatorSearch/LocatorSearchEmptyResults.jsx',
  () => ({
    default: () => null,
  }),
);
vi.mock(
  '../../app/common/renderer/components/SessionInspector/Header/LocatorSearch/LocatorSearchFoundResults.jsx',
  () => ({
    default: () => null,
  }),
);

const settingKey = 'LOCATOR_SEARCH_HISTORY';

const loadModal = async () =>
  (await import('../../app/common/renderer/components/SessionInspector/Header/LocatorSearch/LocatorSearchModal.jsx'))
    .default;

const renderModal = (ModalComponent, overrides = {}) => {
  rendered.buttons = [];
  return renderToStaticMarkup(
    createElement(ModalComponent, {
      isLocatorSearchModalVisible: true,
      isSearchingForElements: false,
      clearSearchResults: vi.fn(),
      hideLocatorSearchModal: vi.fn(),
      setLocatorSearchStrategy: vi.fn(),
      setLocatorSearchValue: vi.fn(),
      searchForElement: vi.fn(),
      locatedElements: undefined,
      locatorSearchStrategy: 'id',
      locatorSearchValue: 'login_button',
      featureCaps: {automationName: 'uiautomator2'},
      sessionSettings: {},
      currentContext: 'NATIVE_APP',
      ...overrides,
    }),
  );
};

describe('Saved locator search history', () => {
  beforeEach(() => {
    vi.resetModules();
    savedSettings.clear();
    rendered.modal = null;
    rendered.form = null;
    rendered.buttons = [];
  });

  it('initializes the first session with an empty history from shared defaults', async () => {
    const {DEFAULT_SETTINGS} = await import('../../app/common/shared/setting-defs.js');
    renderModal(await loadModal());

    expect(DEFAULT_SETTINGS[settingKey]).toEqual([]);
    expect(rendered.form.searchHistory).toEqual([]);
    expect(rendered.form.showSearchHistory).toBe(false);
    const toggleBtn = rendered.buttons.find((btn) => btn.id === 'btnToggleSearchHistory');
    expect(toggleBtn.disabled).toBe(true);
  });

  it('loads saved search history before rendering the first session', async () => {
    const existingHistory = [{strategy: 'xpath', selector: '//XCUIElementTypeButton'}];
    savedSettings.set(settingKey, existingHistory);
    renderModal(await loadModal());

    expect(rendered.form.searchHistory).toEqual(existingHistory);
    const toggleBtn = rendered.buttons.find((btn) => btn.id === 'btnToggleSearchHistory');
    expect(toggleBtn.disabled).toBe(false);
  });

  it('saves submitted searches and keeps them when a new session mounts in the same renderer', async () => {
    const ModalComponent = await loadModal();
    const searchForElement = vi.fn();
    renderModal(ModalComponent, {
      locatorSearchStrategy: 'accessibility id',
      locatorSearchValue: 'Submit',
      searchForElement,
    });

    const submitBtn = rendered.buttons.at(-1);
    await submitBtn.onClick();

    expect(searchForElement).toHaveBeenCalledWith('accessibility id', 'Submit');
    expect(savedSettings.get(settingKey)).toEqual([{strategy: 'accessibility id', selector: 'Submit'}]);

    renderModal(ModalComponent);
    expect(rendered.form.searchHistory).toEqual([{strategy: 'accessibility id', selector: 'Submit'}]);
  });

  it('populates both strategy and selector fields when a history entry is selected', async () => {
    savedSettings.set(settingKey, [{strategy: 'xpath', selector: '//Button[@text="OK"]'}]);
    const setLocatorSearchStrategy = vi.fn();
    const setLocatorSearchValue = vi.fn();
    renderModal(await loadModal(), {setLocatorSearchStrategy, setLocatorSearchValue});

    rendered.form.selectSearchHistoryEntry({strategy: 'xpath', selector: '//Button[@text="OK"]'});

    expect(setLocatorSearchStrategy).toHaveBeenCalledWith('xpath');
    expect(setLocatorSearchValue).toHaveBeenCalledWith('//Button[@text="OK"]');
  });

  it('clears saved history across sessions and after reloading settings', async () => {
    savedSettings.set(settingKey, [{strategy: 'id', selector: 'login_button'}]);
    const ModalComponent = await loadModal();
    renderModal(ModalComponent);

    const clearBtn = rendered.buttons.find((btn) => btn.id === 'btnClearSearchHistory');
    expect(clearBtn.disabled).toBe(false);
    await clearBtn.onClick();

    renderModal(ModalComponent);
    expect(rendered.form.searchHistory).toEqual([]);
    expect(savedSettings.get(settingKey)).toEqual([]);

    vi.resetModules();
    renderModal(await loadModal());
    expect(rendered.form.searchHistory).toEqual([]);
  });
});
