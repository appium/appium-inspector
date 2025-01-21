import {describe, expect, it} from 'vitest';

import {interpolateEnvironmentVariables} from '../../app/common/renderer/utils/env-utils';

describe('interpolateEnvironmentVariables', function () {
  const envVars = new Map([
    ['HOME', '/home/user'],
    ['PATH', '/usr/bin'],
    ['APP_ENV', 'test'],
  ]);

  it('should interpolate environment variables in strings', function () {
    const input = 'My home is ${HOME} and path is ${PATH}';
    const expected = 'My home is /home/user and path is /usr/bin';
    expect(interpolateEnvironmentVariables(input, envVars)).to.equal(expected);
  });

  it('should leave unmatched variables unchanged', function () {
    const input = 'Value: ${UNKNOWN_VAR}';
    expect(interpolateEnvironmentVariables(input, envVars)).to.equal('Value: ${UNKNOWN_VAR}');
  });

  it('should interpolate variables in arrays', function () {
    const input = ['${HOME}/files', '${PATH}/python'];
    const expected = ['/home/user/files', '/usr/bin/python'];
    expect(interpolateEnvironmentVariables(input, envVars)).to.deep.equal(expected);
  });

  it('should interpolate variables in nested objects', function () {
    const input = {
      home: '${HOME}',
      paths: {
        bin: '${PATH}',
        config: '${HOME}/.config',
      },
      env: '${APP_ENV}',
    };
    const expected = {
      home: '/home/user',
      paths: {
        bin: '/usr/bin',
        config: '/home/user/.config',
      },
      env: 'test',
    };
    expect(interpolateEnvironmentVariables(input, envVars)).to.deep.equal(expected);
  });

  it('should handle null values', function () {
    expect(interpolateEnvironmentVariables(null, envVars)).to.equal(null);
  });

  it('should handle undefined values', function () {
    expect(interpolateEnvironmentVariables(undefined, envVars)).to.equal(undefined);
  });

  it('should handle number values', function () {
    expect(interpolateEnvironmentVariables(42, envVars)).to.equal(42);
  });

  it('should handle boolean values', function () {
    expect(interpolateEnvironmentVariables(true, envVars)).to.equal(true);
    expect(interpolateEnvironmentVariables(false, envVars)).to.equal(false);
  });

  it('should handle empty arrays', function () {
    expect(interpolateEnvironmentVariables([], envVars)).to.deep.equal([]);
  });

  it('should handle empty objects', function () {
    expect(interpolateEnvironmentVariables({}, envVars)).to.deep.equal({});
  });

  it('should handle multiple variables in single string', function () {
    const input = '${HOME}:${PATH}:${APP_ENV}';
    const expected = '/home/user:/usr/bin:test';
    expect(interpolateEnvironmentVariables(input, envVars)).to.equal(expected);
  });
});
