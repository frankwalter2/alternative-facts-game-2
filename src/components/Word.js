// src/components/Word.js

import React from 'react';
import { useDrag } from 'react-dnd';

const Word = ({ word, status = 'unused' }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WORD',
    item: { word },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Determine background color based on status
  const backgroundColor = isDragging
    ? '#0056b3' // Darker blue while dragging
    : status === 'correct'
    ? '#28a745' // Green
    : status === 'wrong place'
    ? '#fd7e14' // Orange
    : status === 'incorrect'
    ? '#dc3545' // Red
    : '#007bff'; // Default blue

    return (
      <span
        ref={drag}
        className="word"
        style={{
          /* Adjusted styles */
          opacity: isDragging ? 0 : 1,
          backgroundColor: backgroundColor,
          cursor: 'grab',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s ease-in-out',
          padding: '6px 8px',
          borderRadius: '8px',
          color: 'white',
          userSelect: 'none',
          margin: '4px',
          fontSize: '14px',
        }}
      >
        {word}
      </span>
    );
  };

export default Word;
