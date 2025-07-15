// Columns in the saved gestures table
export const SAVED_GESTURE_PROPS = {
  NAME: 'Name',
  DESCRIPTION: 'Description',
  CREATED: 'Created',
  ACTIONS: 'Actions',
};

export const POINTER_TYPES = {
  POINTER_UP: 'pointerUp',
  POINTER_DOWN: 'pointerDown',
  PAUSE: 'pause',
  POINTER_MOVE: 'pointerMove',
};

export const POINTER_TYPES_MAP = {
  [POINTER_TYPES.POINTER_UP]: 'Pointer Up',
  [POINTER_TYPES.POINTER_DOWN]: 'Pointer Down',
  [POINTER_TYPES.PAUSE]: 'Pause',
  [POINTER_TYPES.POINTER_MOVE]: 'Move',
};

// Colors used to distinguish multiple pointers in the same gesture
export const POINTER_COLORS = ['#FF3333', '#FF8F00', '#B65FF4', '#6CFF00', '#00FFDC'];

// Default pointer shown upon creating a new gesture
export const DEFAULT_POINTER = [
  {
    name: 'pointer1',
    ticks: [{id: '1.1'}],
    color: POINTER_COLORS[0],
    id: '1',
  },
];

// HTML cursor style (used when hovering over pointer title)
export const CURSOR = {POINTER: 'pointer', TEXT: 'text'};

// Properties for a single tick included in a pointer
export const TICK_PROPS = {
  POINTER_TYPE: 'pointerType',
  DURATION: 'duration',
  BUTTON: 'button',
  X: 'x',
  Y: 'y',
};

// Default duration for a pointer move action, in milliseconds
export const POINTER_MOVE_DEFAULT_DURATION = 2500;

export const POINTER_MOVE_COORDS_TYPE = {
  PERCENTAGES: 'percentages',
  PIXELS: 'pixels',
};

export const POINTER_DOWN_BTNS = {
  LEFT: 0,
  RIGHT: 1,
};

// Details for 'filler' ticks used to ensure timelines for all pointers have consistent length
export const FILLER_TICK = {TYPE: 'filler', WAIT: 'wait', FINISH: 'finish', COLOR: '#FFFFFF'};

// Style for dots and lines drawn over the app screenshot
export const GESTURE_ITEM_STYLES = {
  FILLED: 'filled',
  NEW_DASHED: 'newDashed',
  WHOLE: 'whole',
  DASHED: 'dashed',
};
