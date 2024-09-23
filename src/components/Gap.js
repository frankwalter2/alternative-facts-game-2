// src/components/Gap.js

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

const Gap = ({ id, word, onDrop, onRemove, status }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'WORD',
    drop: (item) => onDrop(id, item.word),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WORD_IN_GAP',
    item: { word, fromGapId: id },
    canDrag: () => !!word && status !== 'correct', // Prevent dragging if status is 'correct'
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        onRemove(item.word, id); // Pass word and gapId to handleReturnWord
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Determine background color based on status
  const backgroundColor = isOver
    ? '#e0e0e0' // Light gray when hovered
    : status === 'empty'
    ? '#a9a9a9' // Grey for empty gaps
    : status === 'filled'
    ? '#007bff' // Blue when filled
    : status === 'correct'
    ? '#28a745' // Green
    : status === 'wrong place'
    ? '#fd7e14' // Orange
    : status === 'incorrect'
    ? '#dc3545' // Red
    : '#dee1e4'; // Fallback color

// src/components/Gap.js

return (
    <span
      ref={(node) => drag(drop(node))}
      className="gap"
      style={{
        minWidth: '60px', // Reduced width
        padding: '6px 8px', // Reduced padding
        borderRadius: '4px',
        color: 'white',
        display: 'inline-block',
        textAlign: 'center',
        margin: '0 3px', // Reduced margin
        backgroundColor: backgroundColor,
        cursor: status !== 'correct' ? 'pointer' : 'default',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
        opacity: isDragging ? 0 : 1,
        fontSize: '14px', // Match word font size
        lineHeight: 'normal', // Ensure vertical alignment
        verticalAlign: 'middle', // Align with text
      }}
    >
      {word || '_____' /* Show blank if no word is placed */}
    </span>
  );
  
};

export default Gap;
