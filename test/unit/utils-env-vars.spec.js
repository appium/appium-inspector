import {describe, expect, it} from 'vitest';

import {
  buildEnvVarMap,
  findDuplicateEnvVarNames,
  interpolateCapabilities,
  interpolateEnvVarsInString,
  normalizeEnvVars,
  prepareEnvVarsForExport,
} from '../../app/common/renderer/utils/env-vars.js';

describe('utils/env-vars.js', function () {
  describe('#normalizeEnvVars', function () {
    it('should return an empty array for non-array inputs', function () {
      expect(normalizeEnvVars(null)).toEqual([]);
      expect(normalizeEnvVars(undefined)).toEqual([]);
      expect(normalizeEnvVars('invalid')).toEqual([]);
    });

    it('should normalize entries with default id and isSecret flag', function () {
      const result = normalizeEnvVars([
        {name: 'XCODE_ORG_ID', value: 'TEAM123'},
        {id: 'custom-id', name: 'APP_ENV', value: 'staging', isSecret: false},
        null,
        42,
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({name: 'XCODE_ORG_ID', value: 'TEAM123', isSecret: true});
      expect(result[0].id).toBeTypeOf('string');
      expect(result[0].id.length).toBeGreaterThan(0);
      expect(result[1]).toEqual({id: 'custom-id', name: 'APP_ENV', value: 'staging', isSecret: false});
    });
  });

  describe('#buildEnvVarMap', function () {
    it('should map trimmed names to string values and skip blank names', function () {
      const map = buildEnvVarMap([
        {name: '  XCODE_ORG_ID  ', value: 'TEAM123', isSecret: true},
        {name: '', value: 'ignored', isSecret: false},
        {name: '   ', value: 'ignored', isSecret: false},
        {name: 'PORT', value: 4723, isSecret: false},
      ]);

      expect(map.size).toBe(2);
      expect(map.get('XCODE_ORG_ID')).toBe('TEAM123');
      expect(map.get('PORT')).toBe('4723');
    });

    it('should exclude secret variables when includeSecrets is false', function () {
      const map = buildEnvVarMap(
        [
          {name: 'SECRET_KEY', value: 'super-secret', isSecret: true},
          {name: 'IMPLICIT_SECRET', value: 'hidden'},
          {name: 'PLAIN_HOST', value: 'staging.example.com', isSecret: false},
        ],
        {includeSecrets: false},
      );

      expect(map.has('SECRET_KEY')).toBe(false);
      expect(map.has('IMPLICIT_SECRET')).toBe(false);
      expect(map.get('PLAIN_HOST')).toBe('staging.example.com');
    });

    it('should keep the latest value when duplicate names are present', function () {
      const map = buildEnvVarMap([
        {name: 'TOKEN', value: 'old', isSecret: true},
        {name: 'TOKEN', value: 'new', isSecret: true},
      ]);
      expect(map.get('TOKEN')).toBe('new');
    });
  });

  describe('#interpolateEnvVarsInString', function () {
    it('should substitute full and embedded placeholders', function () {
      const map = new Map([
        ['HOST', 'device-farm.example'],
        ['TOKEN', 'abc-123'],
        ['EMPTY', ''],
      ]);

      expect(interpolateEnvVarsInString('${TOKEN}', map)).toBe('abc-123');
      expect(interpolateEnvVarsInString('https://${HOST}/app?token=${TOKEN}', map)).toBe(
        'https://device-farm.example/app?token=abc-123',
      );
      expect(interpolateEnvVarsInString('prefix-${EMPTY}-suffix', map)).toBe('prefix--suffix');
    });

    it('should keep unmatched placeholders and prototype keys untouched', function () {
      const map = new Map([['KNOWN', 'value']]);

      expect(interpolateEnvVarsInString('${UNKNOWN}', map)).toBe('${UNKNOWN}');
      expect(interpolateEnvVarsInString('${toString}-${__proto__}-${constructor}', map)).toBe(
        '${toString}-${__proto__}-${constructor}',
      );
      expect(interpolateEnvVarsInString('${KNOWN} and ${MISSING}', map)).toBe('value and ${MISSING}');
    });

    it('should not recursively expand placeholders produced by substitution', function () {
      const map = new Map([
        ['FIRST', '${SECOND}'],
        ['SECOND', 'expanded'],
      ]);
      expect(interpolateEnvVarsInString('${FIRST}', map)).toBe('${SECOND}');
    });
  });

  describe('#interpolateCapabilities', function () {
    const envVars = [
      {name: 'XCODE_ORG_ID', value: 'TEAM999', isSecret: true},
      {name: 'XCODE_SIGNING_ID', value: 'iPhone Developer', isSecret: true},
      {name: 'ENV_NAME', value: 'staging', isSecret: false},
    ];

    it('should recursively interpolate strings in nested objects and arrays without mutating input', function () {
      const caps = Object.freeze({
        platformName: 'iOS',
        'appium:xcodeOrgId': '${XCODE_ORG_ID}',
        'appium:xcodeSigningId': '${XCODE_SIGNING_ID}',
        'appium:noReset': true,
        'appium:newCommandTimeout': 120,
        'appium:customOptions': Object.freeze({
          env: '${ENV_NAME}',
          tags: Object.freeze(['${ENV_NAME}', '${XCODE_ORG_ID}', '${UNDEFINED_VAR}', 42]),
        }),
      });

      const resolved = interpolateCapabilities(caps, envVars);

      expect(resolved).toEqual({
        platformName: 'iOS',
        'appium:xcodeOrgId': 'TEAM999',
        'appium:xcodeSigningId': 'iPhone Developer',
        'appium:noReset': true,
        'appium:newCommandTimeout': 120,
        'appium:customOptions': {
          env: 'staging',
          tags: ['staging', 'TEAM999', '${UNDEFINED_VAR}', 42],
        },
      });
      expect(caps['appium:xcodeOrgId']).toBe('${XCODE_ORG_ID}');
    });

    it('should preserve secret placeholders while interpolating plain variables when includeSecrets is false', function () {
      const caps = {
        platformName: 'iOS',
        'appium:xcodeOrgId': '${XCODE_ORG_ID}',
        'appium:app': 'https://${ENV_NAME}.example.com/app.ipa',
      };

      const sanitized = interpolateCapabilities(caps, envVars, {includeSecrets: false});

      expect(sanitized).toEqual({
        platformName: 'iOS',
        'appium:xcodeOrgId': '${XCODE_ORG_ID}',
        'appium:app': 'https://staging.example.com/app.ipa',
      });
    });

    it('should return non-object caps unchanged', function () {
      expect(interpolateCapabilities(null, envVars)).toBeNull();
    });
  });

  describe('#prepareEnvVarsForExport', function () {
    it('should strip ids, clear secret values, and keep plain values', function () {
      const exported = prepareEnvVarsForExport([
        {id: '1', name: 'XCODE_ORG_ID', value: 'TEAM999', isSecret: true},
        {id: '2', name: 'ENV_NAME', value: 'staging', isSecret: false},
        {id: '3', name: 'IMPLICIT_SECRET', value: 'top-secret'},
      ]);

      expect(exported).toEqual([
        {name: 'XCODE_ORG_ID', value: '', isSecret: true},
        {name: 'ENV_NAME', value: 'staging', isSecret: false},
        {name: 'IMPLICIT_SECRET', value: '', isSecret: true},
      ]);
    });

    it('should return an empty array for missing or non-array inputs', function () {
      expect(prepareEnvVarsForExport(undefined)).toEqual([]);
      expect(prepareEnvVarsForExport(null)).toEqual([]);
    });
  });

  describe('#findDuplicateEnvVarNames', function () {
    it('should detect duplicate trimmed variable names and ignore blank names', function () {
      const duplicates = findDuplicateEnvVarNames([
        {name: 'A', value: '1'},
        {name: ' A ', value: '2'},
        {name: 'B', value: '3'},
        {name: '', value: '4'},
        {name: '   ', value: '5'},
      ]);

      expect(duplicates.has('A')).toBe(true);
      expect(duplicates.has('B')).toBe(false);
      expect(duplicates.size).toBe(1);
    });
  });
});
