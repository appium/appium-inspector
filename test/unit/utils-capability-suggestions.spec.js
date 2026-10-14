import {describe, expect, it} from 'vitest';

import {CAPABILITY_SUGGESTIONS} from '../../app/common/renderer/constants/capability-suggestions.js';
import {CAPABILITY_TYPES} from '../../app/common/renderer/constants/session-builder.js';
import {getCapabilitySuggestions, getTargetDrivers} from '../../app/common/renderer/utils/capability-suggestions.js';

const names = (suggestions) => suggestions.map(({name}) => name);
const capsFor = (platformName, automationName) => [
  {id: 1, name: 'platformName', value: platformName, enabled: true},
  ...(automationName ? [{id: 2, name: 'appium:automationName', value: automationName, enabled: true}] : []),
];

describe('constants/capability-suggestions.js', () => {
  it('has unique names with valid types', () => {
    const allNames = names(CAPABILITY_SUGGESTIONS);
    expect(new Set(allNames).size).toBe(allNames.length);
    for (const {type} of CAPABILITY_SUGGESTIONS) {
      expect(Object.values(CAPABILITY_TYPES)).toContain(type);
    }
  });
});

describe('utils/capability-suggestions.js', () => {
  describe('#getTargetDrivers', () => {
    it('returns nothing without platform or automation name', () => {
      expect(getTargetDrivers([])).toEqual([]);
      expect(getTargetDrivers(capsFor('Windows'))).toEqual([]);
    });

    it('uses the platform name case-insensitively', () => {
      expect(getTargetDrivers(capsFor('Android'))).toEqual(['uiautomator2', 'espresso']);
      expect(getTargetDrivers(capsFor('iOS'))).toEqual(['xcuitest']);
    });

    it('prefers the automation name, with or without the vendor prefix', () => {
      expect(getTargetDrivers(capsFor('Android', 'Espresso'))).toEqual(['espresso']);
      expect(getTargetDrivers([{name: 'automationName', value: ' UiAutomator2 '}])).toEqual(['uiautomator2']);
    });

    it('ignores disabled capabilities', () => {
      expect(getTargetDrivers([{name: 'platformName', value: 'iOS', enabled: false}])).toEqual([]);
    });
  });

  describe('#getCapabilitySuggestions', () => {
    it('returns nothing for an empty query', () => {
      expect(getCapabilitySuggestions('', [])).toEqual([]);
      expect(getCapabilitySuggestions('   ', [])).toEqual([]);
      expect(getCapabilitySuggestions(undefined, [])).toEqual([]);
    });

    it('matches anywhere in the name, case-insensitively', () => {
      const result = names(getCapabilitySuggestions('CHROME', []));
      expect(result).toContain('appium:chromedriverPort');
      expect(result).toContain('appium:recreateChromeDriverSessions');
      expect(result).toContain('appium:showChromedriverLog');
      expect(result.every((name) => name.toLowerCase().includes('chrome'))).toBe(true);
    });

    it('ignores the vendor prefix in the query', () => {
      expect(names(getCapabilitySuggestions('appium:udi', []))).toEqual(['appium:udid']);
      expect(names(getCapabilitySuggestions('appium:', []))).toEqual([]);
    });

    it('lists names starting with the query before other matches', () => {
      const result = names(getCapabilitySuggestions('chrome', []));
      const firstContained = result.findIndex((name) => !name.slice('appium:'.length).startsWith('chrome'));
      expect(firstContained).toBeGreaterThan(0);
      expect(result.slice(firstContained).every((name) => !name.slice('appium:'.length).startsWith('chrome'))).toBe(
        true,
      );
    });

    it('hides capabilities of other drivers when the platform is known', () => {
      expect(names(getCapabilitySuggestions('chrome', capsFor('iOS')))).toEqual([]);
      expect(names(getCapabilitySuggestions('bundle', capsFor('Android')))).toEqual([]);
      expect(names(getCapabilitySuggestions('bundle', capsFor('iOS')))).toEqual([
        'appium:bundleId',
        'appium:updatedWDABundleId',
      ]);
    });

    it('narrows Android suggestions to the selected automation name', () => {
      expect(names(getCapabilitySuggestions('espresso', capsFor('Android', 'UiAutomator2')))).toEqual([]);
      expect(names(getCapabilitySuggestions('uiautomator2Server', capsFor('Android', 'Espresso')))).toEqual([]);
      expect(names(getCapabilitySuggestions('espressoBuild', capsFor('Android', 'Espresso')))).toEqual([
        'appium:espressoBuildConfig',
      ]);
    });

    it('lists capabilities for the target driver before generic ones', () => {
      const result = getCapabilitySuggestions('app', capsFor('Android'));
      const firstGeneric = result.findIndex(({drivers}) => drivers.length === 0);
      expect(firstGeneric).toBeGreaterThan(0);
      expect(result.slice(firstGeneric).every(({drivers}) => drivers.length === 0)).toBe(true);
      expect(names(result)).toContain('appium:app');
    });

    it('excludes names already used by other capabilities but not by the edited one', () => {
      const caps = [
        {id: 1, name: 'appium:deviceName'},
        {id: 2, name: 'device'},
      ];
      expect(names(getCapabilitySuggestions('device', caps, 2))).toEqual([]);
      expect(names(getCapabilitySuggestions('devicen', [{id: 1, name: 'devicen'}], 1))).toEqual(['appium:deviceName']);
    });

    it('returns nothing once the name is complete', () => {
      expect(getCapabilitySuggestions('appium:udid', [])).toEqual([]);
      expect(getCapabilitySuggestions('udid', [])).toEqual([]);
    });
  });
});
