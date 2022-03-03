import React from 'react';

const CURSOR_SIDE_SIZE = 20;
const CURSOR_HALF_SIDE_SIZE = CURSOR_SIDE_SIZE / 2;
const TouchDot = ({ xPosition, yPosition }) => {
  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: 'rgba(246, 140, 56, 0.5)',
        zIndex: 100,
        borderColor: '#f68c38',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: CURSOR_HALF_SIDE_SIZE,
        left: xPosition - CURSOR_HALF_SIDE_SIZE,
        top: yPosition - CURSOR_HALF_SIDE_SIZE,
        height: CURSOR_SIDE_SIZE,
        width: CURSOR_SIDE_SIZE,
      }}
    />
  );
};

export default TouchDot;
