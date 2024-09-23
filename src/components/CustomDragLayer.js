// src/components/CustomDragLayer.js

import React from 'react';
import { useDragLayer } from 'react-dnd';

const CustomDragLayer = () => {
  const { item, isDragging, clientOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    clientOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !clientOffset) {
    return null;
  }

  const { x, y } = clientOffset;

  const style = {
    position: 'fixed',
    pointerEvents: 'none',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)', // Center the word under the cursor/finger
    zIndex: 1000,
  };

  return (
    <div style={style}>
      <span
        className="word"
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '6px 8px', // Match the word styles
          borderRadius: '12px',
          fontSize: '14px',
        }}
      >
        {item.word}
      </span>
    </div>
  );
};

export default CustomDragLayer;
