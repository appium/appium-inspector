import {describe, expect, it} from 'vitest';

import {moveGestureTick} from '../../app/common/renderer/utils/gesture-editing.js';

const pointers = [
  {
    id: '1',
    name: 'First pointer',
    color: '#FF3333',
    ticks: [
      {id: '1.1', type: 'pointerMove', x: 12, y: 34, duration: 500},
      {id: '1.2', type: 'pointerDown', button: 0},
      {id: '1.3', type: 'pause', duration: 750},
    ],
  },
  {id: '2', name: 'Second pointer', ticks: [{id: '2.1', type: 'pointerUp', button: 0}]},
];

describe('moveGestureTick', () => {
  it('moves an action earlier, retaining its parameters and renumbering every position', () => {
    const original = structuredClone(pointers);
    const result = moveGestureTick(pointers, '1', '1.3', -1);
    expect(result[0]).toEqual({
      ...pointers[0],
      ticks: [pointers[0].ticks[0], {...pointers[0].ticks[2], id: '1.2'}, {...pointers[0].ticks[1], id: '1.3'}],
    });
    expect(result[1]).toBe(pointers[1]);
    expect(pointers).toEqual(original);
  });

  it('moves an action later and allows a subsequent move using its new ID', () => {
    const result = moveGestureTick(pointers, '1', '1.1', 1);
    expect(result[0].ticks).toEqual([
      {...pointers[0].ticks[1], id: '1.1'},
      {...pointers[0].ticks[0], id: '1.2'},
      pointers[0].ticks[2],
    ]);
    expect(moveGestureTick(result, '1', '1.2', -1)).toEqual(pointers);
  });

  it('moves directly to a non-adjacent position and back without changing the other pointer', () => {
    const original = structuredClone(pointers);
    const result = moveGestureTick(pointers, '1', '1.1', 2);
    expect(result[0].ticks).toEqual([
      {...pointers[0].ticks[1], id: '1.1'},
      {...pointers[0].ticks[2], id: '1.2'},
      {...pointers[0].ticks[0], id: '1.3'},
    ]);
    expect(result[1]).toBe(pointers[1]);
    expect(moveGestureTick(result, '1', '1.3', -2)).toEqual(pointers);
    expect(pointers).toEqual(original);
  });

  it.each([
    ['1', '1.1', -1],
    ['1', '1.3', 1],
    ['2', '2.1', 1],
    ['missing', '1.1', 1],
    ['1', 'missing', 1],
    ['1', '1.1', 0],
    ['1', '1.1', 3],
    ['1', '1.3', -3],
    ['1', '1.1', 0.5],
    ['1', '1.1', NaN],
    ['1', '1.1', Infinity],
  ])('ignores unavailable moves for pointer %s, action %s, direction %s', (pointerId, tickId, direction) => {
    expect(moveGestureTick(pointers, pointerId, tickId, direction)).toBe(pointers);
  });

  it('keeps an unfinished action and multi-character pointer IDs intact', () => {
    const original = [{id: '12', ticks: [{id: '12.1'}, {id: '12.2', type: 'pause', duration: 50}]}];
    expect(moveGestureTick(original, '12', '12.1', 1)[0].ticks).toEqual([
      {id: '12.1', type: 'pause', duration: 50},
      {id: '12.2'},
    ]);
  });
});
