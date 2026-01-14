import {describe, expect, it} from 'vitest';

import {
  parseGestureFileContents,
  validateGestureJSON,
} from '../../app/common/renderer/utils/gesturefile-parsing.js';

describe('utils/gesturefile-parsing.js', function () {
  describe('#validateGestureJSON', function () {
    const nameProp = {name: 'test'};
    const descProp = {description: 'desc'};
    const baseActionProp = {name: 'a', color: '#FFFFFF', id: '1'};
    const validTick = {id: '1', type: 'pointerDown', button: 0};
    const validAction = {...baseActionProp, ticks: [validTick]};
    const actionsProp = {actions: [validAction]};

    it('should work for a basic gesture', function () {
      const gesture = {...nameProp, ...descProp, ...actionsProp};
      expect(validateGestureJSON(gesture)).toEqual(gesture);
    });

    it('should work for a gesture with an empty tick', function () {
      const gesture = {
        ...nameProp,
        ...descProp,
        actions: [{...baseActionProp, ticks: [{id: '1'}]}],
      };
      expect(validateGestureJSON(gesture)).toEqual(gesture);
    });

    it.each([
      ['is missing', {}],
      ['is empty', {name: ''}],
      ['only contains whitespace', {name: '   '}],
      ['is not a string', {name: 123}],
    ])('should return null if name %s', (_desc, newNameProp) => {
      const gesture = {...descProp, ...actionsProp, ...newNameProp};
      expect(validateGestureJSON(gesture)).toBeNull();
    });

    it.each([
      ['is missing', {}],
      ['is empty', {description: ''}],
      ['only contains whitespace', {description: '   '}],
      ['is not a string', {description: 123}],
    ])('should return null if description %s', (_desc, newDescProp) => {
      const gesture = {...nameProp, ...actionsProp, ...newDescProp};
      expect(validateGestureJSON(gesture)).toBeNull();
    });

    it.each([
      ['is missing', {}],
      ['is not an array', {actions: 123}],
      ['contains a non-object', {actions: [123]}],
    ])('should return null if actions %s', (_desc, newActionsProp) => {
      const gesture = {...nameProp, ...descProp, ...newActionsProp};
      expect(validateGestureJSON(gesture)).toBeNull();
    });

    it.each([
      ['omits a required field', {name: undefined}],
      ['has an empty field', {id: ''}],
      ['has a field with only whitespace', {color: '   '}],
      ['has non-string field', {name: 123}],
      ['has invalid color', {color: 'red'}],
      ['is missing ticks', {ticks: undefined}],
      ['has non-array ticks', {ticks: 123}],
    ])('should return null if a single action %s', (_desc, newActionProps) => {
      const gesture = {...nameProp, ...descProp, actions: [{...validAction, ...newActionProps}]};
      expect(validateGestureJSON(gesture)).toBeNull();
    });

    it.each([
      ['is missing id', {id: undefined}],
      ['has empty id', {id: ''}],
      ['has id with only whitespace', {id: '   '}],
      ['has non-string id', {id: 123}],
      ['has unknown type', {type: 'unknown'}],
    ])('should return null if a single tick %s', (_desc, newTickProps) => {
      const gesture = {
        ...nameProp,
        ...descProp,
        actions: [{...baseActionProp, ticks: [{...validTick, ...newTickProps}]}],
      };
      expect(validateGestureJSON(gesture)).toBeNull();
    });

    it.each([
      ['is pointerMove without x', {type: 'pointerMove', y: 0, duration: 100}],
      ['is pointerMove with non-number y', {type: 'pointerMove', x: 0, y: '0', duration: 100}],
      ['is pointerUp without button', {type: 'pointerUp'}],
      ['is pointerDown without button', {type: 'pointerDown'}],
      ['is pause without duration', {type: 'pause'}],
    ])('should return null if a single tick type %s', (_desc, newTickProps) => {
      const gesture = {
        ...nameProp,
        ...descProp,
        actions: [{...baseActionProp, ticks: [{id: '1', ...newTickProps}]}],
      };
      expect(validateGestureJSON(gesture)).toBeNull();
    });
  });

  describe('#parseGestureFileContents', function () {
    it('should return null for invalid JSON', function () {
      expect(parseGestureFileContents('not json')).toBeNull();
    });

    it('should parse a valid gesture file', function () {
      const validGesture = {
        name: 'Complex',
        description: 'A complex gesture combining swipe and unfinished tap',
        actions: [
          {
            name: 'pointer1',
            color: '#FF0000',
            id: '1',
            ticks: [
              {
                id: '1.1',
                type: 'pointerMove',
                x: 70.3,
                y: 67.1,
                duration: 0,
              },
              {
                id: '1.2',
                type: 'pointerDown',
                button: 0,
              },
              {
                id: '1.3',
                type: 'pointerMove',
                x: 74.9,
                y: 22.1,
                duration: 995,
              },
              {
                id: '1.4',
                type: 'pause',
                duration: 100,
              },
              {
                id: '1.5',
                type: 'pointerUp',
                button: 0,
              },
            ],
          },
          {
            name: 'pointer2',
            ticks: [
              {
                id: '2.1',
                type: 'pointerMove',
                x: 34.2,
                y: 61.5,
                duration: 0,
              },
              {
                id: '2.2',
              },
            ],
            id: '2',
            color: '#FF8F00',
          },
        ],
        id: '1dc9a2e9-eb65-411a-bc33-7216d83ae693',
        date: 1765275934446,
      };
      const result = parseGestureFileContents(JSON.stringify(validGesture));
      expect(result).toEqual(validGesture);
    });
  });
});
